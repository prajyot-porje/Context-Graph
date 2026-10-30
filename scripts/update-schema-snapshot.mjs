import{readFile,writeFile}from'node:fs/promises'
const marker='-- Recovery schema snapshot (2026-10-30)'
const original=(await readFile('supabase/schema.sql','utf8')).split(marker)[0].trimEnd()
const recovery=await readFile('supabase/2026-10-30-demo-recovery.sql','utf8')
await writeFile('supabase/schema.sql',`${original}\n\n${marker}\n${recovery}\n`)
