import { createHash } from 'crypto'
import { createSupabaseServer } from '@/lib/supabase'
import type { ContextNode, ContextEntry, ApiKey, ContextEdge } from '@/types'
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
  score: number
): Promise<void> {
  const supabase = createSupabaseServer()

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
    throw new Error(`Failed to update node relevance: ${nodeError.message}`)
  }
}

export async function validateApiKey(rawKey: string): Promise<string | null> {
  const supabase = createSupabaseServer()
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
