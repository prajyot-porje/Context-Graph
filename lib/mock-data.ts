export interface MockNode {
  id: string
  scope: string
  title: string
  content: string
  relevance: number
  parent_scope: string | null
  depth: number
}

export const mockNodes: MockNode[] = [
  {
    id: '1',
    scope: 'me',
    title: 'ME',
    content: 'Alex Rivera — Full-stack developer, founder of Dev Studio.',
    relevance: 0.95,
    parent_scope: null,
    depth: 0,
  },
  {
    id: '2', 
    scope: 'agency',
    title: 'Dev Studio',
    content: 'Web development studio handling remote client retainers.',
    relevance: 0.88,
    parent_scope: 'me',
    depth: 1,
  },
  {
    id: '3',
    scope: 'agency/cresults',
    title: 'cResults',
    content: 'US client on monthly retainer. WordPress, SEO.',
    relevance: 0.82,
    parent_scope: 'agency',
    depth: 2,
  },
  {
    id: '4',
    scope: 'agency/dev-studio-site',
    title: 'Dev Studio Site',
    content: 'Agency website. Next.js, GSAP, Framer Motion.',
    relevance: 0.75,
    parent_scope: 'agency',
    depth: 2,
  },
  {
    id: '5',
    scope: 'personal/context-engine',
    title: 'ContextGraph',
    content: 'Personal project. MCP server + SaaS dashboard.',
    relevance: 0.91,
    parent_scope: 'me',
    depth: 1,
  },
]
