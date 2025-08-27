import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'

export async function GET() {
  try {
    console.log('Checking RLS status...')
    
    // Check RLS status for all tables
    const tables = [
      'locations',
      'acquisition_costs', 
      'api_configurations',
      'ad_spend',
      'reports',
      'sessions',
      'patients',
      'appointments',
      'bookings',
      'treatments',
      'daily_metrics',
      'location_metrics'
    ]
    
    const rlsStatus = []
    
    for (const table of tables) {
      try {
        // Check if RLS is enabled
        const rlsEnabled = await db.execute(sql`
          SELECT schemaname, tablename, rowsecurity 
          FROM pg_tables 
          WHERE tablename = ${table}
        `)
        
        // Check existing policies
        const policies = await db.execute(sql`
          SELECT policyname, permissive, roles, cmd, qual, with_check
          FROM pg_policies 
          WHERE tablename = ${table}
        `)
        
        rlsStatus.push({
          table,
          rlsEnabled: rlsEnabled[0]?.rowsecurity || false,
          policyCount: policies.length,
          policies: policies.map((p: any) => ({
            name: p.policyname,
            command: p.cmd,
            roles: p.roles,
            condition: p.qual
          }))
        })
      } catch (error) {
        rlsStatus.push({
          table,
          rlsEnabled: false,
          policyCount: 0,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'RLS status retrieved',
      tables: rlsStatus,
      summary: {
        totalTables: tables.length,
        tablesWithRLS: rlsStatus.filter(t => t.rlsEnabled).length,
        totalPolicies: rlsStatus.reduce((sum, t) => sum + (t.policyCount || 0), 0)
      }
    })
  } catch (error) {
    console.error('RLS status check failed:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'RLS status check failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
