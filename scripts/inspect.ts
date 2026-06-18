import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { Pool } from 'pg'

const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.SUPABASE_DATABASE_URL

const pool = new Pool({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false }
})

async function inspect() {
  try {
    const resNodes = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'context_nodes';
    `)
    console.log('context_nodes columns:')
    console.log(resNodes.rows)

    const resUser = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'user';
    `)
    console.log('user columns:')
    console.log(resUser.rows)
  } catch (err) {
    console.error(err)
  } finally {
    await pool.end()
  }
}

inspect()
