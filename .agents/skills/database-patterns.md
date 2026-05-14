# ContextGraph Database Patterns

## Rules
- Better Auth is the source of truth for user identity.
- User-private data is read and written on the server only.
- Pass the Better Auth session user id into every user-scoped query helper.
- Use typed responses and handle errors explicitly.
- Do not assume Supabase Auth or `auth.uid()` exists.
- Do not use the service role key in browser code.

## Auth Model
- Better Auth manages auth tables and sessions.
- Supabase stores application data.
- API routes and server actions authorize first with Better Auth, then query Supabase.
- MCP routes authorize with API keys, resolve a user id, then query Supabase.

## Client Setup
For V1, prefer a server-only admin client for private data access.

```ts
// /lib/db/server.ts
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

export function createSupabaseServerAdmin() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
```

If you later add public, read-only content such as shared graphs, create a
separate browser client for those explicitly public tables or views.

## TypeScript Types
Better Auth ids are strings. Do not assume UUIDs in app code unless you have
explicitly configured that.

```ts
// /types/database.ts
export interface ContextNode {
  id: string
  user_id: string
  scope: string
  title: string
  content: string
  relevance: number
  tags: string[]
  parent_scope: string | null
  last_updated: string
  created_at: string
}

export interface ContextEntry {
  id: string
  node_id: string
  user_id: string
  entry_text: string
  score: number
  created_at: string
}

export interface ApiKey {
  id: string
  user_id: string
  key_hash: string
  key_prefix: string
  created_at: string
  last_used: string | null
}
```

## Query Patterns

### Fetch all nodes for a user
```ts
import { createSupabaseServerAdmin } from '@/lib/db/server'
import type { ContextNode } from '@/types/database'

export async function getUserNodes(userId: string): Promise<ContextNode[]> {
  const supabase = createSupabaseServerAdmin()

  const { data, error } = await supabase
    .from('context_nodes')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch nodes: ${error.message}`)
  }

  return data
}
```

### Fetch a single node with its entries
```ts
import { createSupabaseServerAdmin } from '@/lib/db/server'

export async function getNodeWithEntries(nodeId: string, userId: string) {
  const supabase = createSupabaseServerAdmin()

  const { data: node, error: nodeError } = await supabase
    .from('context_nodes')
    .select('*')
    .eq('id', nodeId)
    .eq('user_id', userId)
    .single()

  if (nodeError) {
    throw new Error(`Node not found: ${nodeError.message}`)
  }

  const { data: entries, error: entriesError } = await supabase
    .from('context_entries')
    .select('*')
    .eq('node_id', nodeId)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (entriesError) {
    throw new Error(`Failed to fetch entries: ${entriesError.message}`)
  }

  return { node, entries }
}
```

### Create a node
```ts
import { createSupabaseServerAdmin } from '@/lib/db/server'
import type { ContextNode } from '@/types/database'

export async function createNode(
  userId: string,
  data: Pick<ContextNode, 'scope' | 'title' | 'content' | 'tags' | 'parent_scope'>
): Promise<ContextNode> {
  const supabase = createSupabaseServerAdmin()

  const { data: node, error } = await supabase
    .from('context_nodes')
    .insert({
      user_id: userId,
      scope: data.scope,
      title: data.title,
      content: data.content,
      tags: data.tags,
      parent_scope: data.parent_scope,
      relevance: 0.9,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create node: ${error.message}`)
  }

  return node
}
```

### Append an entry and update node metadata
```ts
import { createSupabaseServerAdmin } from '@/lib/db/server'

export async function appendEntry(
  nodeId: string,
  userId: string,
  entryText: string,
  score: number
) {
  const supabase = createSupabaseServerAdmin()

  const { error: entryError } = await supabase
    .from('context_entries')
    .insert({
      node_id: nodeId,
      user_id: userId,
      entry_text: entryText,
      score,
    })

  if (entryError) {
    throw new Error(`Failed to append entry: ${entryError.message}`)
  }

  const { error: nodeError } = await supabase
    .from('context_nodes')
    .update({
      last_updated: new Date().toISOString(),
      relevance: Math.min(1, score + 0.05),
    })
    .eq('id', nodeId)
    .eq('user_id', userId)

  if (nodeError) {
    throw new Error(`Failed to update node: ${nodeError.message}`)
  }
}
```

### Validate API key and resolve user id
```ts
import { createHash } from 'crypto'
import { createSupabaseServerAdmin } from '@/lib/db/server'

export async function validateApiKey(rawKey: string): Promise<string | null> {
  const supabase = createSupabaseServerAdmin()
  const hash = createHash('sha256').update(rawKey).digest('hex')

  const { data, error } = await supabase
    .from('api_keys')
    .select('user_id')
    .eq('key_hash', hash)
    .single()

  if (error || !data) {
    return null
  }

  await supabase
    .from('api_keys')
    .update({ last_used: new Date().toISOString() })
    .eq('key_hash', hash)

  return data.user_id
}
```

### Weekly relevance decay
```ts
import { createSupabaseServerAdmin } from '@/lib/db/server'

export async function decayRelevanceScores() {
  const supabase = createSupabaseServerAdmin()
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data: staleNodes, error } = await supabase
    .from('context_nodes')
    .select('id, relevance')
    .lt('last_updated', thirtyDaysAgo.toISOString())

  if (error) {
    throw new Error(`Failed to fetch stale nodes: ${error.message}`)
  }

  for (const node of staleNodes) {
    const newRelevance = Math.max(0.1, node.relevance * 0.92)

    const { error: updateError } = await supabase
      .from('context_nodes')
      .update({ relevance: newRelevance })
      .eq('id', node.id)

    if (updateError) {
      throw new Error(`Failed to decay node ${node.id}: ${updateError.message}`)
    }
  }
}
```

## SQL Schema
Better Auth should own its own auth tables. Your custom app schema should start
with app-specific tables only.

```sql
create extension if not exists pgcrypto;

create table context_nodes (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references "user"(id) on delete cascade,
  scope text not null,
  title text not null,
  content text not null default '',
  relevance double precision not null default 0.9,
  tags text[] not null default '{}',
  parent_scope text,
  last_updated timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table context_entries (
  id uuid primary key default gen_random_uuid(),
  node_id uuid not null references context_nodes(id) on delete cascade,
  user_id text not null references "user"(id) on delete cascade,
  entry_text text not null,
  score double precision not null default 0.8,
  created_at timestamptz not null default now()
);

create table api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references "user"(id) on delete cascade,
  key_hash text not null unique,
  key_prefix text not null,
  created_at timestamptz not null default now(),
  last_used timestamptz
);

create index context_nodes_user_id_idx on context_nodes(user_id);
create index context_nodes_scope_idx on context_nodes(scope);
create index context_entries_node_id_idx on context_entries(node_id);
create index context_entries_user_id_idx on context_entries(user_id);
create index api_keys_hash_idx on api_keys(key_hash);
```

## RLS Note
If you later add a Better Auth to Supabase JWT bridge, you can layer RLS on top.
Until that bridge exists, do not write policies that depend on `auth.uid()`.
