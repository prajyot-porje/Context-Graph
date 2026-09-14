import { createHash } from 'crypto'
import { createSupabaseServer } from '@/lib/supabase'
import type { ContextNode, ContextEdge, ContextEntry, ContextEntryKind, StagedContextEntry } from '@/types'
import type { SupabaseClient } from '@supabase/supabase-js'

export async function getUserNodes(userId: string): Promise<ContextNode[]> {
  const supabase = createSupabaseServer()

  const { data, error } = await supabase
    .from('context_nodes')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch nodes: ${error.message}`)
  }

  return data || []
}

export async function getNodeWithEntries(nodeId: string, userId: string) {
  const supabase = createSupabaseServer()

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

  return { node, entries: entries || [] }
}

export async function createNode(
  userId: string,
  data: Pick<ContextNode, 'scope' | 'title' | 'content' | 'tags' | 'parent_scope'>
): Promise<ContextNode> {
  const supabase = createSupabaseServer()

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

export async function updateNode(
  nodeId: string,
  userId: string,
  data: Partial<Pick<ContextNode, 'content' | 'relevance' | 'tags' | 'title' | 'scope' | 'parent_scope'>>
): Promise<ContextNode> {
  const supabase = createSupabaseServer()
  const { data: node, error } = await supabase
    .from('context_nodes')
    .update({ ...data, last_updated: new Date().toISOString() })
    .eq('id', nodeId)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update node: ${error.message}`)
  }

  return node
}

export async function deleteNode(nodeId: string, userId: string): Promise<void> {
  const supabase = createSupabaseServer()
  const { error } = await supabase
    .from('context_nodes')
    .delete()
    .eq('id', nodeId)
    .eq('user_id', userId)

  if (error) {
    throw new Error(`Failed to delete node: ${error.message}`)
  }
}

export async function appendEntry(
  nodeId: string,
  userId: string,
  entryText: string,
  score: number,
  kind: ContextEntryKind = 'note'
): Promise<void> {
  const supabase = createSupabaseServer()

  const { error: entryError } = await supabase
    .from('context_entries')
    .insert({
      node_id: nodeId,
      user_id: userId,
      entry_text: entryText,
      score,
      kind,
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
    throw new Error(`Failed to update node relevance: ${nodeError.message}`)
  }
}

// ── Phase 1 (ROADMAP.md P1.4/P1.5): staged entries + two-stage save ─────────

export async function stageEntry(params: {
  userId: string
  rawText: string
  kindHint?: string
  scopeHint?: string
  source?: string | null
}): Promise<{ staged: boolean; reason?: string }> {
  const { userId, rawText, kindHint, scopeHint, source } = params
  const trimmed = rawText.trim()

  if (trimmed.length < 3) {
    return { staged: false, reason: 'too short' }
  }

  const supabase = createSupabaseServer()

  // Cheap dedupe: skip if the exact same text is already sitting in the queue
  // or was already saved in the last 24 hours. Real fuzzy dedupe is P2.3 —
  // this is just enough to stop a chatty client re-queuing the same line.
  const { data: pendingDup } = await supabase
    .from('staged_context_entries')
    .select('id')
    .eq('user_id', userId)
    .eq('raw_text', trimmed)
    .maybeSingle()

  if (pendingDup) {
    return { staged: false, reason: 'already queued' }
  }

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { data: recentDup } = await supabase
    .from('context_entries')
    .select('id')
    .eq('user_id', userId)
    .eq('entry_text', trimmed)
    .gt('created_at', oneDayAgo)
    .maybeSingle()

  if (recentDup) {
    return { staged: false, reason: 'already saved recently' }
  }

  const { error } = await supabase
    .from('staged_context_entries')
    .insert({
      user_id: userId,
      raw_text: trimmed,
      kind_hint: kindHint ?? null,
      scope_hint: scopeHint ?? null,
      source: source ?? null,
    })

  if (error) {
    throw new Error(`Failed to stage entry: ${error.message}`)
  }

  return { staged: true }
}

export async function getPendingStagedEntries(limit: number): Promise<StagedContextEntry[]> {
  const supabase = createSupabaseServer()
  const { data, error } = await supabase
    .from('staged_context_entries')
    .select('*')
    .order('created_at', { ascending: true })
    .limit(limit)

  if (error) {
    throw new Error(`Failed to fetch staged entries: ${error.message}`)
  }

  return data ?? []
}

export async function deleteStagedEntries(ids: string[]): Promise<void> {
  if (ids.length === 0) return
  const supabase = createSupabaseServer()
  const { error } = await supabase
    .from('staged_context_entries')
    .delete()
    .in('id', ids)

  if (error) {
    throw new Error(`Failed to delete staged entries: ${error.message}`)
  }
}

export async function countUserEntries(userId: string): Promise<number> {
  const supabase = createSupabaseServer()
  const { count, error } = await supabase
    .from('context_entries')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  if (error) {
    throw new Error(`Failed to count entries: ${error.message}`)
  }

  return count ?? 0
}

export async function resolveEntry(entryId: string, userId: string): Promise<void> {
  const supabase = createSupabaseServer()
  const { error } = await supabase
    .from('context_entries')
    .update({ kind: 'resolved' })
    .eq('id', entryId)
    .eq('user_id', userId)

  if (error) {
    throw new Error(`Failed to resolve entry: ${error.message}`)
  }
}

export async function forgetEntry(entryId: string, userId: string): Promise<void> {
  const supabase = createSupabaseServer()
  const { error } = await supabase
    .from('context_entries')
    .delete()
    .eq('id', entryId)
    .eq('user_id', userId)

  if (error) {
    throw new Error(`Failed to forget entry: ${error.message}`)
  }
}

export interface SearchResult {
  entry: ContextEntry
  nodeScope: string
  nodeTitle: string
}

// ponytail: substring search over entry_text, not semantic — ROADMAP.md P3
// upgrades this to embeddings once the volume of entries makes ILIKE too blunt.
export async function searchEntries(userId: string, query: string): Promise<SearchResult[]> {
  const supabase = createSupabaseServer()
  const { data, error } = await supabase
    .from('context_entries')
    .select('*, context_nodes!inner(scope, title, user_id)')
    .eq('user_id', userId)
    .eq('context_nodes.user_id', userId)
    .ilike('entry_text', `%${query}%`)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) {
    throw new Error(`Failed to search entries: ${error.message}`)
  }

  type Row = ContextEntry & { context_nodes: { scope: string; title: string } }
  return (data as unknown as Row[] ?? []).map((row) => ({
    entry: {
      id: row.id,
      node_id: row.node_id,
      user_id: row.user_id,
      entry_text: row.entry_text,
      score: row.score,
      kind: row.kind,
      created_at: row.created_at,
    },
    nodeScope: row.context_nodes.scope,
    nodeTitle: row.context_nodes.title,
  }))
}

export async function updateLastClientName(apiKeyId: string, clientName: string): Promise<void> {
  const supabase = createSupabaseServer()
  await supabase
    .from('api_keys')
    .update({ last_client_name: clientName.slice(0, 100) })
    .eq('id', apiKeyId)
}

export function sanitizeApiKey(rawKey: string): string {
  if (!rawKey || typeof rawKey !== 'string') {
    return ''
  }

  let clean = rawKey.trim()
  try {
    clean = decodeURIComponent(clean)
  } catch {
    // ignore decode error
  }

  // Strip wrapping quotes ("..." or '...')
  clean = clean.replace(/^["']+|["']+$/g, '').trim()
  // Strip Bearer prefix
  clean = clean.replace(/^Bearer\s+/i, '').trim()
  // Strip wrapping quotes again in case of Bearer "..."
  clean = clean.replace(/^["']+|["']+$/g, '').trim()

  return clean
}

export interface ValidatedApiKey {
  userId: string
  apiKeyId: string
  lastClientName: string | null
}

export async function validateApiKey(rawKey: string): Promise<ValidatedApiKey | null> {
  const cleanKey = sanitizeApiKey(rawKey)
  if (!cleanKey) {
    return null
  }

  // If the key contains masked bullet characters or asterisks, it's a copied UI placeholder
  if (cleanKey.includes('•') || cleanKey.includes('*')) {
    console.warn('[validateApiKey] Rejected API key containing masked placeholder characters')
    return null
  }

  const supabase = createSupabaseServer()
  const hash = createHash('sha256').update(cleanKey).digest('hex')

  const { data, error } = await supabase
    .from('api_keys')
    .select('id, user_id, last_client_name')
    .eq('key_hash', hash)
    .maybeSingle()

  if (error || !data) {
    return null
  }

  // Fire-and-forget timestamp update
  await supabase
    .from('api_keys')
    .update({ last_used: new Date().toISOString() })
    .eq('key_hash', hash)

  return { userId: data.user_id, apiKeyId: data.id, lastClientName: data.last_client_name }
}

// ponytail: hourly window, best-effort increment (read-then-write, not atomic under
// heavy concurrency) — good enough to stop a single leaked/runaway key from racking up
// unbounded LLM judge calls; move to a DB-side upsert+increment if this ever needs to be exact.
const RATE_LIMIT_PER_HOUR = 300

export async function checkRateLimit(apiKeyId: string): Promise<boolean> {
  const supabase = createSupabaseServer()
  const windowStart = new Date()
  windowStart.setMinutes(0, 0, 0)
  const windowStartIso = windowStart.toISOString()

  const { data: existing } = await supabase
    .from('rate_limits')
    .select('id, request_count')
    .eq('api_key_id', apiKeyId)
    .eq('window_start', windowStartIso)
    .maybeSingle()

  if (!existing) {
    await supabase
      .from('rate_limits')
      .insert({ api_key_id: apiKeyId, window_start: windowStartIso, request_count: 1 })
    return true
  }

  if (existing.request_count >= RATE_LIMIT_PER_HOUR) {
    return false
  }

  await supabase
    .from('rate_limits')
    .update({ request_count: existing.request_count + 1 })
    .eq('id', existing.id)

  return true
}

export async function storeApiKey(userId: string, hash: string, prefix: string): Promise<void> {
  const supabase = createSupabaseServer()
  const { error } = await supabase
    .from('api_keys')
    .insert({
      user_id: userId,
      key_hash: hash,
      key_prefix: prefix,
    })

  if (error) {
    throw new Error(`Failed to store API key: ${error.message}`)
  }
}

export async function revokeApiKey(userId: string): Promise<void> {
  const supabase = createSupabaseServer()
  const { error } = await supabase
    .from('api_keys')
    .delete()
    .eq('user_id', userId)

  if (error) {
    throw new Error(`Failed to revoke API key: ${error.message}`)
  }
}

export async function markOnboardingDone(userId: string): Promise<void> {
  const supabase = createSupabaseServer()
  const { error } = await supabase
    .from('user')
    .update({ onboarding_done: true })
    .eq('id', userId)

  if (error) {
    throw new Error(`Failed to mark onboarding done: ${error.message}`)
  }
}

export async function decayRelevanceScores() {
  const supabase = createSupabaseServer()
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data: staleNodes, error } = await supabase
    .from('context_nodes')
    .select('id, relevance')
    .lt('last_updated', thirtyDaysAgo.toISOString())

  if (error) {
    throw new Error(`Failed to fetch stale nodes: ${error.message}`)
  }

  for (const node of staleNodes || []) {
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

export async function getApiKeyInfo(userId: string): Promise<{ prefix: string, last_used: string | null } | null> {
  const supabase = createSupabaseServer()
  const { data, error } = await supabase
    .from('api_keys')
    .select('key_prefix, last_used')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to fetch API key info: ${error.message}`)
  }

  if (!data) return null

  return {
    prefix: data.key_prefix,
    last_used: data.last_used,
  }
}

export interface AccountStatus {
  exists: boolean
  emailVerified: boolean
  hasPassword: boolean
  hasGoogle: boolean
}

export async function getAccountStatus(rawEmail: string): Promise<AccountStatus> {
  const cleanEmail = rawEmail.trim().toLowerCase()
  if (!cleanEmail) {
    return { exists: false, emailVerified: false, hasPassword: false, hasGoogle: false }
  }

  const supabase = createSupabaseServer()
  // Query user table by email (managed by Better Auth)
  const untypedSupabase = supabase as unknown as SupabaseClient
  const { data: userData, error: userError } = await untypedSupabase
    .from('user')
    .select('id, emailVerified')
    .eq('email', cleanEmail)
    .maybeSingle<{ id: string; emailVerified: boolean | null }>()

  if (userError || !userData) {
    return { exists: false, emailVerified: false, hasPassword: false, hasGoogle: false }
  }

  // Query account table for linked providers and password presence
  const { data: accountsData, error: accountError } = await untypedSupabase
    .from('account')
    .select('providerId, password')
    .eq('userId', userData.id)
    .returns<Array<{ providerId: string; password?: string | null }>>()

  if (accountError || !accountsData) {
    return {
      exists: true,
      emailVerified: !!userData.emailVerified,
      hasPassword: false,
      hasGoogle: false,
    }
  }

  const hasPassword = accountsData.some(
    (a) => a.providerId === 'credential' && a.password !== null && a.password !== undefined
  )
  const hasGoogle = accountsData.some((a) => a.providerId === 'google')

  return {
    exists: true,
    emailVerified: !!userData.emailVerified,
    hasPassword,
    hasGoogle,
  }
}

export async function getUserEdges(
  supabaseOrUserId: SupabaseClient | string,
  userId?: string
): Promise<ContextEdge[]> {
  const supabase = typeof supabaseOrUserId === 'string' ? createSupabaseServer() : supabaseOrUserId
  const actualUserId = typeof supabaseOrUserId === 'string' ? supabaseOrUserId : userId!

  const { data, error } = await supabase
    .from('context_edges')
    .select('*')
    .eq('user_id', actualUserId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('getUserEdges error:', error)
    return []
  }
  return data ?? []
}

export async function createEdge(
  supabaseOrUserId: SupabaseClient | string,
  userIdOrSourceNodeId: string,
  sourceNodeIdOrTargetNodeId?: string,
  targetNodeIdOrEdgeType?: string,
  edgeTypeParam?: string
): Promise<ContextEdge | null> {
  let supabase: SupabaseClient
  let userId: string
  let sourceNodeId: string
  let targetNodeId: string
  let edgeType: string = 'part_of'

  if (typeof supabaseOrUserId === 'string') {
    supabase = createSupabaseServer()
    userId = supabaseOrUserId
    sourceNodeId = userIdOrSourceNodeId
    targetNodeId = sourceNodeIdOrTargetNodeId!
    edgeType = targetNodeIdOrEdgeType ?? 'part_of'
  } else {
    supabase = supabaseOrUserId
    userId = userIdOrSourceNodeId
    sourceNodeId = sourceNodeIdOrTargetNodeId!
    targetNodeId = targetNodeIdOrEdgeType!
    edgeType = edgeTypeParam ?? 'part_of'
  }

  const { data, error } = await supabase
    .from('context_edges')
    .insert({
      user_id: userId,
      source_node_id: sourceNodeId,
      target_node_id: targetNodeId,
      edge_type: edgeType,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') return null
    console.error('createEdge error:', error)
    return null
  }
  return data
}
