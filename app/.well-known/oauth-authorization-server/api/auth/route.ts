import { auth } from '@/lib/auth'
export const dynamic='force-dynamic'
export async function GET(request: Request) {
  const url = new URL(request.url)
  url.pathname = '/api/auth/.well-known/oauth-authorization-server'
  return auth.handler(new Request(url, request))
}
