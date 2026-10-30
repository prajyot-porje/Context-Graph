import {describe,it,expect} from 'vitest'
import {hasUsefulContext,noteSchema,notesSchema,setupPrompt} from './setup'
import {authDestination} from './navigation'
import {oauthQuery} from './oauth-query'
import {assembleContext} from './context'
import type{ContextNode,ContextEntry}from'@/types'
describe('setup contracts and bounded context',()=>{
  it('does not count an empty root as useful context',()=>{expect(hasUsefulContext(['  '],0)).toBe(false);expect(hasUsefulContext([''],1)).toBe(true);expect(hasUsefulContext(['Real legacy context'],0)).toBe(true)})
  it('rejects oversized imports and invalid scopes instead of silently truncating',()=>{expect(()=>notesSchema.parse(Array.from({length:101},()=>({text:'fact'})))).toThrow();expect(()=>noteSchema.parse({text:'x'.repeat(2001)})).toThrow();expect(()=>noteSchema.parse({text:'fact',scope:'../other-user'})).toThrow()})
  it('scrubs secrets in proposed notes',()=>expect(noteSchema.parse({text:'password: supersecret123'}).text).toBe('[REDACTED]'))
  it('requires permission before a dedicated import and never promises full memory access',()=>{const prompt=setupPrompt('attempt');expect(prompt).toContain('Only after I explicitly approve');expect(prompt).toContain('Do not invent');expect(prompt).toContain('Do not use remember')})
  it('restricts auth return paths and preserves repeated signed OAuth parameters',()=>{expect(authDestination('https://evil.example')).toBe('/entry');expect(authDestination('//evil.example')).toBe('/entry');expect(authDestination('/oauth/login?oauth_query=abc')).toContain('/oauth/login?');expect(new URLSearchParams(oauthQuery({client_id:'client',ba_param:['a','b']})).getAll('ba_param')).toEqual(['a','b'])})
  it('enforces the total budget and includes scoped ancestors without resolved notes',()=>{
    const node=(id:string,scope:string,parent:string|null):ContextNode=>({id,user_id:'user',scope,title:scope,content:scope,tags:[],relevance:1,parent_scope:parent,last_updated:'',created_at:''})
    const nodes=[node('root','me',null),node('branch','agency','me'),node('leaf','agency/project','agency')]
    const entry:ContextEntry={id:'entry',node_id:'leaf',user_id:'user',entry_text:'unique resolved fact',kind:'resolved',score:.8,created_at:''}
    const result=assembleContext(nodes,'agency/project',100,[entry]);expect(result).toContain('agency');expect(result).not.toContain('unique resolved fact');expect(result.length).toBeLessThanOrEqual(400)
  })
})
