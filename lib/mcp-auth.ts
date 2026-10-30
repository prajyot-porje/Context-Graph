import { oauthProviderResourceClient } from "@better-auth/oauth-provider/resource-client";
import { auth, getBaseUrl } from "./auth";
import {
  DataError,
  validateApiKey,
  isOAuthSessionActive,
  sanitizeApiKey,
} from "./db";
import { createHash } from "crypto";

const resourceClient = oauthProviderResourceClient(auth).getActions();
export const mcpResource = () => `${getBaseUrl()}/api/mcp`;
export function protectedResourceMetadata() {
  return {
    resource: mcpResource(),
    authorization_servers: [`${getBaseUrl()}/api/auth`],
    scopes_supported: ["context:read", "context:write"],
    bearer_methods_supported: ["header"],
  };
}
export async function authenticateMcp(request: Request) {
  const authorization = request.headers.get("authorization");
  const legacy =
    request.headers.get("x-api-key") ||
    (authorization?.replace(/^Bearer\s+/i, "").startsWith("ctx_")
      ? authorization
      : null);
  if (legacy) {
    const key = await validateApiKey(legacy);
    if (!key) throw new DataError("Invalid API key", 401);
    return {
      userId: key.userId,
      credential: `key:${key.apiKeyId}:${createHash("sha256").update(sanitizeApiKey(legacy)).digest("hex").slice(0, 12)}`,
      scopes: ["context:read", "context:write"],
      clientName: key.lastClientName || "API-key client",
    };
  }
  if (!authorization)
    throw new DataError("Connect your ContextGraph account using OAuth.", 401);
  try {
    const claims = await resourceClient.verifyAccessTokenRequest(request, {
      verifyOptions: {
        issuer: `${getBaseUrl()}/api/auth`,
        audience: mcpResource(),
      },
      requiredScopes: ["context:read"],
      jwksUrl: `${getBaseUrl()}/api/auth/jwks`,
    });
    const clientId = claims.client_id ?? claims.azp;
    if (
      !claims.sub ||
      typeof clientId !== "string" ||
      typeof claims.sid !== "string" ||
      !(await isOAuthSessionActive(claims.sub, clientId, claims.sid))
    )
      throw new Error("Missing identity");
    return {
      userId: claims.sub,
      credential: `oauth:${clientId}`,
      scopes: String(claims.scope || "").split(" "),
      clientName: "OAuth client",
      issuedAt: claims.iat,
    };
  } catch {
    throw new DataError(
      "Authorization expired or invalid. Reconnect ContextGraph.",
      401,
    );
  }
}
