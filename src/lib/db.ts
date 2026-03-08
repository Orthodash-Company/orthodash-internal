import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '@/shared/schema'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required')
}

const client = postgres(process.env.DATABASE_URL, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
  prepare: false,
  ssl: { rejectUnauthorized: false }
})

const db = drizzle(client, { schema })

export { db }
