import {getBaseUrl} from './auth-url'
export function protectedResourceMetadata(){
  const base=getBaseUrl()
  return{resource:`${base}/api/mcp`,authorization_servers:[`${base}/api/auth`],scopes_supported:['context:read','context:write'],bearer_methods_supported:['header']}
}
