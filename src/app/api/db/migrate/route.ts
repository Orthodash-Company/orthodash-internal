import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'

export async function POST(request: NextRequest) {
  try {
    console.log('Starting database migration...')

    // Add user_id column to locations table if it doesn't exist
    try {
      await db.execute(sql`
        ALTER TABLE locations 
        ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id)
      `)
      console.log('Added user_id column to locations table')
    } catch (error) {
      console.log('user_id column already exists or error:', error)
    }

    // Update existing locations to have a default user (if any exist)
    try {
      await db.execute(sql`
        UPDATE locations 
        SET user_id = (
          SELECT id FROM auth.users LIMIT 1
        ) 
        WHERE user_id IS NULL
      `)
      console.log('Updated existing locations with default user_id')
    } catch (error) {
      console.log('No existing locations to update or error:', error)
    }

    // Make user_id NOT NULL after setting default values
    try {
      await db.execute(sql`
        ALTER TABLE locations 
        ALTER COLUMN user_id SET NOT NULL
      `)
      console.log('Made user_id NOT NULL')
    } catch (error) {
      console.log('user_id already NOT NULL or error:', error)
    }

    // Create index for user_id on locations
    try {
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_locations_user_id 
        ON locations(user_id)
      `)
      console.log('Created index on locations.user_id')
    } catch (error) {
      console.log('Index already exists or error:', error)
    }

    // Enable RLS on all tables
    const tables = [
      'locations',
      'acquisition_costs', 
      'api_configurations',
      'api_sync_history',
      'vendors',
      'revenue',
      'ad_spend',
      'analytics_cache',
      'reports',
      'sessions',
      'patients',
      'appointments',
      'bookings',
      'treatments',
      'daily_metrics',
      'location_metrics'
    ]

    for (const table of tables) {
      try {
        await db.execute(sql`ALTER TABLE ${sql.identifier(table)} ENABLE ROW LEVEL SECURITY`)
        console.log(`Enabled RLS on ${table}`)
      } catch (error) {
        console.log(`RLS already enabled on ${table} or error:`, error)
      }
    }

    // Create basic RLS policies for locations table
    try {
      await db.execute(sql`
        DROP POLICY IF EXISTS "Users can view their own locations" ON locations
      `)
      await db.execute(sql`
        CREATE POLICY "Users can view their own locations" ON locations
        FOR SELECT USING (auth.uid()::text = user_id::text)
      `)
      console.log('Created RLS policy for locations SELECT')
    } catch (error) {
      console.log('Error creating locations SELECT policy:', error)
    }

    try {
      await db.execute(sql`
        DROP POLICY IF EXISTS "Users can insert their own locations" ON locations
      `)
      await db.execute(sql`
        CREATE POLICY "Users can insert their own locations" ON locations
        FOR INSERT WITH CHECK (auth.uid()::text = user_id::text)
      `)
      console.log('Created RLS policy for locations INSERT')
    } catch (error) {
      console.log('Error creating locations INSERT policy:', error)
    }

    try {
      await db.execute(sql`
        DROP POLICY IF EXISTS "Users can update their own locations" ON locations
      `)
      await db.execute(sql`
        CREATE POLICY "Users can update their own locations" ON locations
        FOR UPDATE USING (auth.uid()::text = user_id::text)
      `)
      console.log('Created RLS policy for locations UPDATE')
    } catch (error) {
      console.log('Error creating locations UPDATE policy:', error)
    }

    try {
      await db.execute(sql`
        DROP POLICY IF EXISTS "Users can delete their own locations" ON locations
      `)
      await db.execute(sql`
        CREATE POLICY "Users can delete their own locations" ON locations
        FOR DELETE USING (auth.uid()::text = user_id::text)
      `)
      console.log('Created RLS policy for locations DELETE')
    } catch (error) {
      console.log('Error creating locations DELETE policy:', error)
    }

    console.log('Database migration completed successfully')

    return NextResponse.json({
      success: true,
      message: 'Database migration completed successfully',
      changes: [
        'Added user_id column to locations table',
        'Updated existing locations with default user_id',
        'Made user_id NOT NULL',
        'Created index on locations.user_id',
        'Enabled RLS on all tables',
        'Created RLS policies for locations table'
      ]
    })

  } catch (error) {
    console.error('Database migration failed:', error)
    return NextResponse.json({
      success: false,
      message: 'Database migration failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
