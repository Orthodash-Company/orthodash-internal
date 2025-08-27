import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'

export async function POST(request: NextRequest) {
  try {
    console.log('Setting up comprehensive RLS policies...')
    
    // Comprehensive RLS policies for all tables
    const rlsPolicies = [
      // Locations table policies
      `DROP POLICY IF EXISTS "Users can view their own locations" ON locations`,
      `CREATE POLICY "Users can view their own locations" ON locations FOR SELECT USING (auth.uid()::text = user_id::text)`,
      `DROP POLICY IF EXISTS "Users can insert their own locations" ON locations`,
      `CREATE POLICY "Users can insert their own locations" ON locations FOR INSERT WITH CHECK (auth.uid()::text = user_id::text)`,
      `DROP POLICY IF EXISTS "Users can update their own locations" ON locations`,
      `CREATE POLICY "Users can update their own locations" ON locations FOR UPDATE USING (auth.uid()::text = user_id::text)`,
      `DROP POLICY IF EXISTS "Users can delete their own locations" ON locations`,
      `CREATE POLICY "Users can delete their own locations" ON locations FOR DELETE USING (auth.uid()::text = user_id::text)`,
      
      // Acquisition costs table policies
      `DROP POLICY IF EXISTS "Users can view their own acquisition_costs" ON acquisition_costs`,
      `CREATE POLICY "Users can view their own acquisition_costs" ON acquisition_costs FOR SELECT USING (auth.uid()::text = user_id::text)`,
      `DROP POLICY IF EXISTS "Users can insert their own acquisition_costs" ON acquisition_costs`,
      `CREATE POLICY "Users can insert their own acquisition_costs" ON acquisition_costs FOR INSERT WITH CHECK (auth.uid()::text = user_id::text)`,
      `DROP POLICY IF EXISTS "Users can update their own acquisition_costs" ON acquisition_costs`,
      `CREATE POLICY "Users can update their own acquisition_costs" ON acquisition_costs FOR UPDATE USING (auth.uid()::text = user_id::text)`,
      `DROP POLICY IF EXISTS "Users can delete their own acquisition_costs" ON acquisition_costs`,
      `CREATE POLICY "Users can delete their own acquisition_costs" ON acquisition_costs FOR DELETE USING (auth.uid()::text = user_id::text)`,
      
      // API configurations table policies
      `DROP POLICY IF EXISTS "Users can view their own api_configurations" ON api_configurations`,
      `CREATE POLICY "Users can view their own api_configurations" ON api_configurations FOR SELECT USING (auth.uid()::text = user_id::text)`,
      `DROP POLICY IF EXISTS "Users can insert their own api_configurations" ON api_configurations`,
      `CREATE POLICY "Users can insert their own api_configurations" ON api_configurations FOR INSERT WITH CHECK (auth.uid()::text = user_id::text)`,
      `DROP POLICY IF EXISTS "Users can update their own api_configurations" ON api_configurations`,
      `CREATE POLICY "Users can update their own api_configurations" ON api_configurations FOR UPDATE USING (auth.uid()::text = user_id::text)`,
      `DROP POLICY IF EXISTS "Users can delete their own api_configurations" ON api_configurations`,
      `CREATE POLICY "Users can delete their own api_configurations" ON api_configurations FOR DELETE USING (auth.uid()::text = user_id::text)`,
      
      // Ad spend table policies
      `DROP POLICY IF EXISTS "Users can view their own ad_spend" ON ad_spend`,
      `CREATE POLICY "Users can view their own ad_spend" ON ad_spend FOR SELECT USING (auth.uid()::text = user_id::text)`,
      `DROP POLICY IF EXISTS "Users can insert their own ad_spend" ON ad_spend`,
      `CREATE POLICY "Users can insert their own ad_spend" ON ad_spend FOR INSERT WITH CHECK (auth.uid()::text = user_id::text)`,
      `DROP POLICY IF EXISTS "Users can update their own ad_spend" ON ad_spend`,
      `CREATE POLICY "Users can update their own ad_spend" ON ad_spend FOR UPDATE USING (auth.uid()::text = user_id::text)`,
      `DROP POLICY IF EXISTS "Users can delete their own ad_spend" ON ad_spend`,
      `CREATE POLICY "Users can delete their own ad_spend" ON ad_spend FOR DELETE USING (auth.uid()::text = user_id::text)`,
      
      // Reports table policies
      `DROP POLICY IF EXISTS "Users can view their own reports" ON reports`,
      `CREATE POLICY "Users can view their own reports" ON reports FOR SELECT USING (auth.uid()::text = user_id::text)`,
      `DROP POLICY IF EXISTS "Users can insert their own reports" ON reports`,
      `CREATE POLICY "Users can insert their own reports" ON reports FOR INSERT WITH CHECK (auth.uid()::text = user_id::text)`,
      `DROP POLICY IF EXISTS "Users can update their own reports" ON reports`,
      `CREATE POLICY "Users can update their own reports" ON reports FOR UPDATE USING (auth.uid()::text = user_id::text)`,
      `DROP POLICY IF EXISTS "Users can delete their own reports" ON reports`,
      `CREATE POLICY "Users can delete their own reports" ON reports FOR DELETE USING (auth.uid()::text = user_id::text)`,
      
      // Sessions table policies
      `DROP POLICY IF EXISTS "Users can view their own sessions" ON sessions`,
      `CREATE POLICY "Users can view their own sessions" ON sessions FOR SELECT USING (auth.uid()::text = user_id::text)`,
      `DROP POLICY IF EXISTS "Users can insert their own sessions" ON sessions`,
      `CREATE POLICY "Users can insert their own sessions" ON sessions FOR INSERT WITH CHECK (auth.uid()::text = user_id::text)`,
      `DROP POLICY IF EXISTS "Users can update their own sessions" ON sessions`,
      `CREATE POLICY "Users can update their own sessions" ON sessions FOR UPDATE USING (auth.uid()::text = user_id::text)`,
      `DROP POLICY IF EXISTS "Users can delete their own sessions" ON sessions`,
      `CREATE POLICY "Users can delete their own sessions" ON sessions FOR DELETE USING (auth.uid()::text = user_id::text)`,
      
      // Patients table policies (HIPAA-compliant)
      `DROP POLICY IF EXISTS "Users can view their own patients" ON patients`,
      `CREATE POLICY "Users can view their own patients" ON patients FOR SELECT USING (auth.uid()::text = user_id::text)`,
      `DROP POLICY IF EXISTS "Users can insert their own patients" ON patients`,
      `CREATE POLICY "Users can insert their own patients" ON patients FOR INSERT WITH CHECK (auth.uid()::text = user_id::text)`,
      `DROP POLICY IF EXISTS "Users can update their own patients" ON patients`,
      `CREATE POLICY "Users can update their own patients" ON patients FOR UPDATE USING (auth.uid()::text = user_id::text)`,
      `DROP POLICY IF EXISTS "Users can delete their own patients" ON patients`,
      `CREATE POLICY "Users can delete their own patients" ON patients FOR DELETE USING (auth.uid()::text = user_id::text)`,
      
      // Appointments table policies (HIPAA-compliant)
      `DROP POLICY IF EXISTS "Users can view their own appointments" ON appointments`,
      `CREATE POLICY "Users can view their own appointments" ON appointments FOR SELECT USING (auth.uid()::text = user_id::text)`,
      `DROP POLICY IF EXISTS "Users can insert their own appointments" ON appointments`,
      `CREATE POLICY "Users can insert their own appointments" ON appointments FOR INSERT WITH CHECK (auth.uid()::text = user_id::text)`,
      `DROP POLICY IF EXISTS "Users can update their own appointments" ON appointments`,
      `CREATE POLICY "Users can update their own appointments" ON appointments FOR UPDATE USING (auth.uid()::text = user_id::text)`,
      `DROP POLICY IF EXISTS "Users can delete their own appointments" ON appointments`,
      `CREATE POLICY "Users can delete their own appointments" ON appointments FOR DELETE USING (auth.uid()::text = user_id::text)`,
      
      // Bookings table policies
      `DROP POLICY IF EXISTS "Users can view their own bookings" ON bookings`,
      `CREATE POLICY "Users can view their own bookings" ON bookings FOR SELECT USING (auth.uid()::text = user_id::text)`,
      `DROP POLICY IF EXISTS "Users can insert their own bookings" ON bookings`,
      `CREATE POLICY "Users can insert their own bookings" ON bookings FOR INSERT WITH CHECK (auth.uid()::text = user_id::text)`,
      `DROP POLICY IF EXISTS "Users can update their own bookings" ON bookings`,
      `CREATE POLICY "Users can update their own bookings" ON bookings FOR UPDATE USING (auth.uid()::text = user_id::text)`,
      `DROP POLICY IF EXISTS "Users can delete their own bookings" ON bookings`,
      `CREATE POLICY "Users can delete their own bookings" ON bookings FOR DELETE USING (auth.uid()::text = user_id::text)`,
      
      // Treatments table policies
      `DROP POLICY IF EXISTS "Users can view their own treatments" ON treatments`,
      `CREATE POLICY "Users can view their own treatments" ON treatments FOR SELECT USING (auth.uid()::text = user_id::text)`,
      `DROP POLICY IF EXISTS "Users can insert their own treatments" ON treatments`,
      `CREATE POLICY "Users can insert their own treatments" ON treatments FOR INSERT WITH CHECK (auth.uid()::text = user_id::text)`,
      `DROP POLICY IF EXISTS "Users can update their own treatments" ON treatments`,
      `CREATE POLICY "Users can update their own treatments" ON treatments FOR UPDATE USING (auth.uid()::text = user_id::text)`,
      `DROP POLICY IF EXISTS "Users can delete their own treatments" ON treatments`,
      `CREATE POLICY "Users can delete their own treatments" ON treatments FOR DELETE USING (auth.uid()::text = user_id::text)`,
      
      // Daily metrics table policies
      `DROP POLICY IF EXISTS "Users can view their own daily_metrics" ON daily_metrics`,
      `CREATE POLICY "Users can view their own daily_metrics" ON daily_metrics FOR SELECT USING (auth.uid()::text = user_id::text)`,
      `DROP POLICY IF EXISTS "Users can insert their own daily_metrics" ON daily_metrics`,
      `CREATE POLICY "Users can insert their own daily_metrics" ON daily_metrics FOR INSERT WITH CHECK (auth.uid()::text = user_id::text)`,
      `DROP POLICY IF EXISTS "Users can update their own daily_metrics" ON daily_metrics`,
      `CREATE POLICY "Users can update their own daily_metrics" ON daily_metrics FOR UPDATE USING (auth.uid()::text = user_id::text)`,
      `DROP POLICY IF EXISTS "Users can delete their own daily_metrics" ON daily_metrics`,
      `CREATE POLICY "Users can delete their own daily_metrics" ON daily_metrics FOR DELETE USING (auth.uid()::text = user_id::text)`,
      
      // Location metrics table policies
      `DROP POLICY IF EXISTS "Users can view their own location_metrics" ON location_metrics`,
      `CREATE POLICY "Users can view their own location_metrics" ON location_metrics FOR SELECT USING (auth.uid()::text = user_id::text)`,
      `DROP POLICY IF EXISTS "Users can insert their own location_metrics" ON location_metrics`,
      `CREATE POLICY "Users can insert their own location_metrics" ON location_metrics FOR INSERT WITH CHECK (auth.uid()::text = user_id::text)`,
      `DROP POLICY IF EXISTS "Users can update their own location_metrics" ON location_metrics`,
      `CREATE POLICY "Users can update their own location_metrics" ON location_metrics FOR UPDATE USING (auth.uid()::text = user_id::text)`,
      `DROP POLICY IF EXISTS "Users can delete their own location_metrics" ON location_metrics`,
      `CREATE POLICY "Users can delete their own location_metrics" ON location_metrics FOR DELETE USING (auth.uid()::text = user_id::text)`,
      
      // Additional policies for related data access
      // Allow users to view locations they have access to through related data
      `DROP POLICY IF EXISTS "Users can view related locations" ON locations`,
      `CREATE POLICY "Users can view related locations" ON locations FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM acquisition_costs 
          WHERE acquisition_costs.location_id = locations.id 
          AND acquisition_costs.user_id::text = auth.uid()::text
        )
      )`,
      
      // Allow users to view patients for locations they have access to
      `DROP POLICY IF EXISTS "Users can view patients for accessible locations" ON patients`,
      `CREATE POLICY "Users can view patients for accessible locations" ON patients FOR SELECT USING (
        auth.uid()::text = user_id::text OR
        EXISTS (
          SELECT 1 FROM locations 
          WHERE locations.id = patients.location_id 
          AND locations.user_id::text = auth.uid()::text
        )
      )`,
      
      // Allow users to view appointments for patients they have access to
      `DROP POLICY IF EXISTS "Users can view appointments for accessible patients" ON appointments`,
      `CREATE POLICY "Users can view appointments for accessible patients" ON appointments FOR SELECT USING (
        auth.uid()::text = user_id::text OR
        EXISTS (
          SELECT 1 FROM patients 
          WHERE patients.id = appointments.patient_id 
          AND patients.user_id::text = auth.uid()::text
        )
      )`,
      
      // Enable RLS on all tables (in case it wasn't enabled)
      `ALTER TABLE locations ENABLE ROW LEVEL SECURITY`,
      `ALTER TABLE acquisition_costs ENABLE ROW LEVEL SECURITY`,
      `ALTER TABLE api_configurations ENABLE ROW LEVEL SECURITY`,
      `ALTER TABLE ad_spend ENABLE ROW LEVEL SECURITY`,
      `ALTER TABLE reports ENABLE ROW LEVEL SECURITY`,
      `ALTER TABLE sessions ENABLE ROW LEVEL SECURITY`,
      `ALTER TABLE patients ENABLE ROW LEVEL SECURITY`,
      `ALTER TABLE appointments ENABLE ROW LEVEL SECURITY`,
      `ALTER TABLE bookings ENABLE ROW LEVEL SECURITY`,
      `ALTER TABLE treatments ENABLE ROW LEVEL SECURITY`,
      `ALTER TABLE daily_metrics ENABLE ROW LEVEL SECURITY`,
      `ALTER TABLE location_metrics ENABLE ROW LEVEL SECURITY`
    ]
    
    let successCount = 0
    let errorCount = 0
    
    for (const policy of rlsPolicies) {
      try {
        await db.execute(sql.raw(policy))
        successCount++
        console.log('Applied policy:', policy.substring(0, 80) + '...')
      } catch (error) {
        errorCount++
        console.log('Policy failed (may already exist):', error)
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'RLS policies setup completed',
      policiesApplied: successCount,
      policiesFailed: errorCount,
      totalPolicies: rlsPolicies.length
    })
  } catch (error) {
    console.error('RLS policies setup failed:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'RLS policies setup failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
