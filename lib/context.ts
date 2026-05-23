import { ContextNode } from '@/types'

export function assembleContext(nodes: ContextNode[], scope: string): string {
  const parts: string[] = []

  // Always include ME node
  const meNode = nodes.find(n => n.scope === 'me')
  if (meNode) {
    parts.push(`# ME\n\n${meNode.content}`)
  }

  if (scope === 'me') {
    return parts.join('\n\n---\n\n')
  }

  // Include agency node if scope starts with agency
  if (scope.startsWith('agency')) {
    const agencyNode = nodes.find(n => n.scope === 'agency')
    if (agencyNode) {
      parts.push(`# ${agencyNode.title}\n\n${agencyNode.content}`)
    }
  }

  // Include the specific project node
  if (scope.includes('/')) {
    const projectNode = nodes.find(n => n.scope === scope)
    if (projectNode) {
      parts.push(`# ${projectNode.title}\n\n${projectNode.content}`)
    }
  }

  return parts.join('\n\n---\n\n') || 'No context found for this scope.'
}
