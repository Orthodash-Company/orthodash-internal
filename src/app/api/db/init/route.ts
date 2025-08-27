import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'

export async function POST(request: NextRequest) {
  try {
    console.log('Initializing database...')
    
    // Ensure all tables exist and have proper structure
    const initQueries = [
      // Create locations table if it doesn't exist
      `CREATE TABLE IF NOT EXISTS locations (
        id SERIAL PRIMARY KEY,
        user_id UUID REFERENCES auth.users(id),
        name TEXT NOT NULL,
        address TEXT,
        patient_count INTEGER DEFAULT 0,
        greyfinch_id TEXT,
        last_sync_date TIMESTAMP,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )`,
      
      // Add user_id column if it doesn't exist
      `ALTER TABLE locations ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id)`,
      
      // Update existing locations to have a default user_id
      `UPDATE locations SET user_id = (SELECT id FROM auth.users LIMIT 1) WHERE user_id IS NULL`,
      
      // Create indexes
      `CREATE INDEX IF NOT EXISTS idx_locations_user_id ON locations(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_locations_is_active ON locations(is_active)`,
      
      // Enable RLS
      `ALTER TABLE locations ENABLE ROW LEVEL SECURITY`,
      
      // Create RLS policies
      `DROP POLICY IF EXISTS "Users can view their own locations" ON locations`,
      `CREATE POLICY "Users can view their own locations" ON locations FOR SELECT USING (auth.uid()::text = user_id::text)`,
      
      `DROP POLICY IF EXISTS "Users can insert their own locations" ON locations`,
      `CREATE POLICY "Users can insert their own locations" ON locations FOR INSERT WITH CHECK (auth.uid()::text = user_id::text)`,
      
      `DROP POLICY IF EXISTS "Users can update their own locations" ON locations`,
      `CREATE POLICY "Users can update their own locations" ON locations FOR UPDATE USING (auth.uid()::text = user_id::text)`,
      
      `DROP POLICY IF EXISTS "Users can delete their own locations" ON locations`,
      `CREATE POLICY "Users can delete their own locations" ON locations FOR DELETE USING (auth.uid()::text = user_id::text)`
    ]
    
    for (const query of initQueries) {
      try {
        await db.execute(sql.raw(query))
        console.log('Executed query:', query.substring(0, 50) + '...')
      } catch (error) {
        console.log('Query failed (may already exist):', error)
      }
    }
    
    // Insert sample data if no locations exist
    const existingLocations = await db.execute(sql`SELECT COUNT(*) FROM locations`)
    if (existingLocations[0]?.count === '0') {
      const sampleLocations = [
        {
          user_id: '6dfe99e7-d999-445d-9318-55fe30a676c5',
          name: 'Main Orthodontic Center',
          address: '123 Main St, Downtown',
          patient_count: 1247,
          is_active: true
        },
        {
          user_id: '6dfe99e7-d999-445d-9318-55fe30a676c5',
          name: 'Westside Dental & Orthodontics',
          address: '456 West Ave, Westside',
          patient_count: 892,
          is_active: true
        }
      ]
      
      for (const location of sampleLocations) {
        await db.execute(sql`
          INSERT INTO locations (user_id, name, address, patient_count, is_active)
          VALUES (${location.user_id}, ${location.name}, ${location.address}, ${location.patient_count}, ${location.is_active})
        `)
      }
      console.log('Inserted sample locations')
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Database initialized successfully',
      locationsCount: existingLocations[0]?.count || 0
    })
  } catch (error) {
    console.error('Database initialization failed:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Database initialization failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
