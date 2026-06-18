import { ContextNode } from '@/types'

/**
 * Assembles context from user nodes for a given scope.
 * @param maxTokens - Approximate token budget (default 4000).
 *                    Content is trimmed if exceeded, prioritizing the 'me' root node.
 */
export function assembleContext(
  nodes: ContextNode[],
  scope: string,
  maxTokens: number = 4000
): string {
  const parts: string[] = []

  // Always include ME node
  const meNode = nodes.find(n => n.scope === 'me')
  if (meNode) {
    parts.push(`# ME\n\n${meNode.content}`)
  }

  if (scope === 'me') {
    const assembled = parts.join('\n\n---\n\n') || 'No context found for this scope.'
    const estimate = Math.ceil(assembled.length / 4)
    if (estimate <= maxTokens) return assembled

    // The 'me' node is never truncated as per requirements, so return full
    return assembled
  }

  // Include agency node if scope starts with agency
  let hasAgency = false
  let agencyNode: ContextNode | undefined
  if (scope.startsWith('agency')) {
    agencyNode = nodes.find(n => n.scope === 'agency')
    if (agencyNode) {
      hasAgency = true
      parts.push(`# ${agencyNode.title}\n\n${agencyNode.content}`)
    }
  }

  // Include the specific project node
  let hasProject = false
  let projectNode: ContextNode | undefined
  if (scope.includes('/')) {
    projectNode = nodes.find(n => n.scope === scope)
    if (projectNode) {
      hasProject = true
      parts.push(`# ${projectNode.title}\n\n${projectNode.content}`)
    }
  }

  let assembled = parts.join('\n\n---\n\n') || 'No context found for this scope.'
  const estimate = Math.ceil(assembled.length / 4)
  if (estimate <= maxTokens) return assembled

  // Over budget — rebuild with truncation
  const newParts: string[] = []
  if (meNode) {
    newParts.push(`# ME\n\n${meNode.content}`)
  }

  if (hasAgency && agencyNode) {
    let content = agencyNode.content
    if (content.length > 1200) {
      content = content.slice(0, 1200) + '...[trimmed]'
    }
    newParts.push(`# ${agencyNode.title}\n\n${content}`)
  }

  if (hasProject && projectNode) {
    let content = projectNode.content
    if (content.length > 800) {
      content = content.slice(0, 800) + '...[trimmed]'
    }
    newParts.push(`# ${projectNode.title}\n\n${content}`)
  }

  assembled = newParts.join('\n\n---\n\n') || 'No context found for this scope.'
  assembled += "\n\n---\n_Context trimmed to fit token budget. Full graph available in dashboard._"
  return assembled
}
