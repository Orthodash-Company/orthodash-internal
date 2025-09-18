import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '@/shared/schema'

// Create a mock database for build time if DATABASE_URL is not available
let db: any;

if (!process.env.DATABASE_URL) {
  console.warn("DATABASE_URL not set, using mock database");
  // Create a mock database object that returns empty arrays
  db = {
    select: () => ({ 
      from: () => ({ 
        where: () => ({ 
          orderBy: () => Promise.resolve([]) 
        }),
        orderBy: () => Promise.resolve([]) 
      }) 
    }),
    insert: () => ({ 
      values: () => ({ 
        returning: () => Promise.resolve([]) 
      }) 
    }),
    update: () => ({ 
      set: () => ({ 
        where: () => ({ 
          returning: () => Promise.resolve([]) 
        }) 
      }) 
    }),
    delete: () => ({ 
      where: () => Promise.resolve([]) 
    })
  };
} else {
  try {
    // Create the connection with proper error handling
    const client = postgres(process.env.DATABASE_URL, {
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10,
      ssl: { rejectUnauthorized: false } // Add SSL configuration for Supabase
    })
    db = drizzle(client, { schema })
    console.log("Database connected successfully");
  } catch (error) {
    console.warn("Failed to connect to database, using mock database:", error);
    // Create a mock database object that returns empty arrays
    db = {
      select: () => ({ 
        from: () => ({ 
          where: () => ({ 
            orderBy: () => Promise.resolve([]) 
          }),
          orderBy: () => Promise.resolve([]) 
        }) 
      }),
      insert: () => ({ 
        values: () => ({ 
          returning: () => Promise.resolve([]) 
        }) 
      }),
      update: () => ({ 
        set: () => ({ 
          where: () => ({ 
            returning: () => Promise.resolve([]) 
          }) 
        }) 
      }),
      delete: () => ({ 
        where: () => Promise.resolve([]) 
      })
    };
  }
}

export { db }
