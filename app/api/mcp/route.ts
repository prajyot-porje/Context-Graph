import { after } from "next/server";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { authenticateMcp, mcpResource } from "@/lib/mcp-auth";
import { getBaseUrl } from "@/lib/auth";
import {
  checkRateLimit,
  DataError,
  forgetEntry,
  getImport,
  getUserEntries,
  getUserNodes,
  observeConnection,
  resolveEntry,
  searchEntries,
  stageEntry,
  submitImport,
} from "@/lib/db";
import { assembleContext } from "@/lib/context";
import { buildGetContextReply, MEMORY_PROTOCOL } from "@/lib/mcp-protocol";
import { notesSchema, setupPrompt } from "@/lib/setup";
import { triggerBackgroundDrain } from "@/lib/process-staged";

export const maxDuration = 60;
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type,Authorization,x-api-key,MCP-Protocol-Version,Mcp-Session-Id",
  "Access-Control-Expose-Headers": "WWW-Authenticate,Mcp-Session-Id",
};
export async function OPTIONS() {
  return new Response(null, { status: 204, headers: cors });
}
export async function GET() {
  return new Response("Use POST for stateless Streamable HTTP.", {
    status: 405,
    headers: cors,
  });
}
export async function DELETE() {
  return new Response(null, { status: 204, headers: cors });
}
const text = (value: unknown) => ({
  content: [
    {
      type: "text" as const,
      text: typeof value === "string" ? value : JSON.stringify(value),
    },
  ],
});
const objectSchema = (
  properties: Record<string, unknown>,
  required: string[] = [],
) => ({
  type: "object" as const,
  properties,
  required,
  additionalProperties: false,
});
const string = { type: "string" };
const tools = [
  {
    name: "contextgraph_setup",
    description:
      "Use when setting up ContextGraph. Read instructions before proposing notes. Ask user permission before sending facts.",
    inputSchema: objectSchema({ attempt_id: string }, ["attempt_id"]),
    annotations: { readOnlyHint: true },
  },
  {
    name: "submit_context_import",
    description:
      "Only after showing the exact facts and receiving user permission: send approved notes as a draft for website review. Does not activate memories.",
    inputSchema: objectSchema(
      {
        attempt_id: string,
        notes: {
          type: "array",
          minItems: 1,
          maxItems: 100,
          items: objectSchema(
            {
              text: { type: "string", maxLength: 2000 },
              kind: {
                type: "string",
                enum: [
                  "decision",
                  "preference",
                  "constraint",
                  "open_problem",
                  "note",
                ],
              },
              scope: string,
            },
            ["text"],
          ),
        },
      },
      ["attempt_id", "notes"],
    ),
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
    },
  },
  {
    name: "get_context",
    description:
      "Call at session start. Read approved context and active notes. Optional project scope, defaults to me.",
    inputSchema: objectSchema({ scope: string }),
    annotations: { readOnlyHint: true },
  },
  {
    name: "remember",
    description:
      "After setup and with automatic capture enabled, call when a decision, preference, constraint or unresolved problem arises. Never use for an initial memory import.",
    inputSchema: objectSchema(
      {
        text: { type: "string", maxLength: 2000 },
        kind: string,
        scope: string,
      },
      ["text"],
    ),
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
    },
  },
  {
    name: "recall",
    description:
      "Find saved notes by words from a previous decision or problem. Returns entry IDs; keyword search, not semantic search.",
    inputSchema: objectSchema({ query: string }, ["query"]),
    annotations: { readOnlyHint: true },
  },
  {
    name: "resolve",
    description:
      "Mark a saved open problem as resolved. Its history remains, but it leaves active context.",
    inputSchema: objectSchema({ entry_id: string }, ["entry_id"]),
    annotations: { readOnlyHint: false, destructiveHint: false },
  },
  {
    name: "forget",
    description: "Delete one saved note only when the user explicitly asks.",
    inputSchema: objectSchema({ entry_id: string }, ["entry_id"]),
    annotations: { readOnlyHint: false, destructiveHint: true },
  },
  {
    name: "list_nodes",
    description:
      "List available scopes and node metadata without full content.",
    inputSchema: objectSchema({}),
    annotations: { readOnlyHint: true },
  },
];
export async function POST(request: Request) {
  try {
    const principal = await authenticateMcp(request);
    if (!(await checkRateLimit(principal.userId)))
      throw new DataError("Too many requests. Try again next hour.", 429);
    const raw = await request.text();
    if (raw.length > 250_000) throw new DataError("Request is too large.", 413);
    const body = JSON.parse(raw) as {
      method?: string;
      params?: { clientInfo?: { name?: string } };
    };
    const clientName =
      body.method === "initialize" ? body.params?.clientInfo?.name : undefined;
    const connection = await observeConnection(
      principal.userId,
      principal.credential,
      clientName || principal.clientName,
      principal.issuedAt,
    );
    const server = new Server(
      {
        name: "contextgraph",
        title: "ContextGraph",
        version: "2.0.0",
        websiteUrl: getBaseUrl(),
        icons: [
          {
            src: `${getBaseUrl()}/icons/logo.svg`,
            mimeType: "image/svg+xml",
            sizes: ["any"],
          },
        ],
      },
      { capabilities: { tools: {} }, instructions: MEMORY_PROTOCOL },
    );
    server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: tools.map((t) => ({
        ...t,
        securitySchemes: [
          {
            type: "oauth2",
            scopes: t.annotations.readOnlyHint
              ? ["context:read"]
              : ["context:write"],
          },
        ],
      })),
    }));
    server.setRequestHandler(CallToolRequestSchema, async (call) => {
      try {
        const name = call.params.name,
          args = call.params.arguments ?? {},
          user = principal.userId;
        const readOnly = [
          "contextgraph_setup",
          "get_context",
          "recall",
          "list_nodes",
        ].includes(name);
        if (!readOnly && !principal.scopes.includes("context:write"))
          throw new DataError(
            "This connection does not have write permission.",
            403,
          );
        if (name === "contextgraph_setup") {
          const run = await getImport(user, z.uuid().parse(args.attempt_id));
          return text({
            attempt_id: run.id,
            status: run.status,
            instructions: setupPrompt(run.id),
            next: "After approval submit notes, then ask the user to review and save them on the website.",
          });
        }
        if (name === "submit_context_import") {
          const run = await submitImport(
            user,
            z.uuid().parse(args.attempt_id),
            args.notes,
            connection.id,
          );
          return text({
            receipt: run.id,
            status: run.status,
            proposed: run.items.length,
            next: "Return to ContextGraph to review and save. These notes are not active context yet.",
          });
        }
        if (name === "get_context") {
          const scope = z.string().max(120).default("me").parse(args.scope);
          const [nodes, entries] = await Promise.all([
            getUserNodes(user),
            getUserEntries(user),
          ]);
          after(triggerBackgroundDrain);
          return text(
            buildGetContextReply(
              assembleContext(nodes, scope, 4000, entries),
              nodes.length,
              entries.length,
            ),
          );
        }
        if (name === "remember" || name === "save_context") {
          const note = notesSchema.parse([
            {
              text: args.text ?? args.summary,
              kind: args.kind ?? "note",
              scope: args.scope ?? "me",
            },
          ])[0];
          const result = await stageEntry({
            userId: user,
            rawText: note.text,
            kindHint: note.kind,
            scopeHint: note.scope,
            source: connection.client_name,
            connectionId: connection.id,
          });
          if (result.staged) after(triggerBackgroundDrain);
          return text(
            result.staged
              ? "Queued for processing. View progress in ContextGraph."
              : `Skipped: ${result.reason}`,
          );
        }
        if (name === "recall")
          return text(
            await searchEntries(
              user,
              z.string().min(1).max(300).parse(args.query),
            ),
          );
        if (name === "resolve") {
          await resolveEntry(z.uuid().parse(args.entry_id), user);
          return text("Marked resolved.");
        }
        if (name === "forget") {
          await forgetEntry(z.uuid().parse(args.entry_id), user);
          return text("Deleted.");
        }
        if (name === "list_nodes")
          return text(
            (await getUserNodes(user)).map(
              ({ id, scope, title, tags, parent_scope }) => ({
                id,
                scope,
                title,
                tags,
                parent_scope,
              }),
            ),
          );
        throw new DataError("Unknown tool");
      } catch (e) {
        return {
          ...text(
            e instanceof DataError
              ? e.message
              : e instanceof z.ZodError
                ? "Invalid tool arguments. Check the tool schema."
                : "The operation failed. Retry or check ContextGraph.",
          ),
          isError: true,
        };
      }
    });
    const transport = new WebStandardStreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });
    await server.connect(transport);
    const response = await transport.handleRequest(
      new Request(request.url, {
        method: "POST",
        headers: request.headers,
        body: raw,
      }),
    );
    const headers = new Headers(response.headers);
    Object.entries(cors).forEach(([k, v]) => headers.set(k, v));
    return new Response(response.body, { status: response.status, headers });
  } catch (e) {
    const status =
      e instanceof DataError ? e.status : e instanceof SyntaxError ? 400 : 500;
    const headers: Record<string, string> = { ...cors };
    if (status === 401)
      headers["WWW-Authenticate"] =
        `Bearer resource_metadata="${getBaseUrl()}/.well-known/oauth-protected-resource", scope="context:read context:write"`;
    return Response.json(
      {
        error:
          status === 500
            ? "MCP request failed."
            : e instanceof Error
              ? e.message
              : "Invalid request",
        resource: mcpResource(),
      },
      { status, headers },
    );
  }
}
