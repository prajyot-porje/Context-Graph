import { authenticateMcp } from '@/lib/mcp-auth'
export async function GET(request:Request){
  try{await authenticateMcp(request);return Response.json({reachable:true,message:'Endpoint reachable. This diagnostic does not verify an external client connection.'})}
  catch{return Response.json({error:'Unauthorized'},{status:401})}
}
