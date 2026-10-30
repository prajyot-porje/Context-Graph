import { protectedResourceMetadata } from '@/lib/mcp-metadata'
export async function GET() { return Response.json(protectedResourceMetadata(), { headers: { 'Access-Control-Allow-Origin': '*' } }) }
