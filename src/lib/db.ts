import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '@/shared/schema'

// Create a mock database for build time if DATABASE_URL is not available
let db: any;

if (!process.env.DATABASE_URL) {
  console.warn("DATABASE_URL not set, using mock database for build");
  // Create a mock database object
  db = {
    select: () => ({ from: () => [] }),
    insert: () => ({ values: () => Promise.resolve([]) }),
    update: () => ({ set: () => ({ where: () => Promise.resolve([]) }) }),
    delete: () => ({ where: () => Promise.resolve([]) })
  };
} else {
  try {
    // Create the connection
    const client = postgres(process.env.DATABASE_URL)
    db = drizzle(client, { schema })
  } catch (error) {
    console.warn("Failed to connect to database, using mock database:", error);
    // Create a mock database object
    db = {
      select: () => ({ from: () => [] }),
      insert: () => ({ values: () => Promise.resolve([]) }),
      update: () => ({ set: () => ({ where: () => Promise.resolve([]) }) }),
      delete: () => ({ where: () => Promise.resolve([]) })
    };
  }
}

export { db }
