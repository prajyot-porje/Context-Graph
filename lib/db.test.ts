import {describe,it,expect} from 'vitest'
import {sanitizeApiKey} from './db'
describe('legacy key input compatibility',()=>{
  it.each([['Bearer ctx_abc','ctx_abc'],['"Bearer ctx_abc"','ctx_abc'],['ctx_abc%20123','ctx_abc 123'],["'ctx_abc'",'ctx_abc']])('normalizes %s',(input,expected)=>expect(sanitizeApiKey(input)).toBe(expected))
  it('rejects non-string values',()=>expect(sanitizeApiKey(null as unknown as string)).toBe(''))
})
