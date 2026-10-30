import {readFile,writeFile} from 'node:fs/promises'
const original=await readFile('supabase/2026-10-30-auth-schema.sql','utf8')
const lines=original.split('\n'),existing=new Set(['user','session','account','verification'])
const tables=lines.map(line=>line.match(/^create table "([^"]+)"/)?.[1]).filter(Boolean)
let sql=lines.filter(line=>{
  const table=line.match(/^create table "([^"]+)"/)?.[1]
  return !line.startsWith('--')&&(!table||!existing.has(table))
}).join('\n').replace(/create table /g,'create table if not exists ').replace(/create unique index /g,'create unique index if not exists ').replace(/create index /g,'create index if not exists ')
for(const table of tables)sql+=`\nALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY;`
await writeFile('supabase/2026-10-30-oauth.sql',`-- Generated from the version-matched auth snapshot; preserves existing identities.\nBEGIN;\n${sql}\nCOMMIT;\n`)
