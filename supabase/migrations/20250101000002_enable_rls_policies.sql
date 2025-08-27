-- Enable Row Level Security on all tables
ALTER TABLE api_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE acquisition_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatments ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_metrics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for api_configurations
DROP POLICY IF EXISTS "Users can view their own api_configurations" ON api_configurations;
CREATE POLICY "Users can view their own api_configurations" ON api_configurations
    FOR SELECT USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can insert their own api_configurations" ON api_configurations;
CREATE POLICY "Users can insert their own api_configurations" ON api_configurations
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can update their own api_configurations" ON api_configurations;
CREATE POLICY "Users can update their own api_configurations" ON api_configurations
    FOR UPDATE USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can delete their own api_configurations" ON api_configurations;
CREATE POLICY "Users can delete their own api_configurations" ON api_configurations
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- Create RLS policies for acquisition_costs
DROP POLICY IF EXISTS "Users can view their own acquisition_costs" ON acquisition_costs;
CREATE POLICY "Users can view their own acquisition_costs" ON acquisition_costs
    FOR SELECT USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can insert their own acquisition_costs" ON acquisition_costs;
CREATE POLICY "Users can insert their own acquisition_costs" ON acquisition_costs
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can update their own acquisition_costs" ON acquisition_costs;
CREATE POLICY "Users can update their own acquisition_costs" ON acquisition_costs
    FOR UPDATE USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can delete their own acquisition_costs" ON acquisition_costs;
CREATE POLICY "Users can delete their own acquisition_costs" ON acquisition_costs
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- Create RLS policies for reports
DROP POLICY IF EXISTS "Users can view their own reports" ON reports;
CREATE POLICY "Users can view their own reports" ON reports
    FOR SELECT USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can insert their own reports" ON reports;
CREATE POLICY "Users can insert their own reports" ON reports
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can update their own reports" ON reports;
CREATE POLICY "Users can update their own reports" ON reports
    FOR UPDATE USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can delete their own reports" ON reports;
CREATE POLICY "Users can delete their own reports" ON reports
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- Create RLS policies for session_history
DROP POLICY IF EXISTS "Users can view their own session_history" ON session_history;
CREATE POLICY "Users can view their own session_history" ON session_history
    FOR SELECT USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can insert their own session_history" ON session_history;
CREATE POLICY "Users can insert their own session_history" ON session_history
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can update their own session_history" ON session_history;
CREATE POLICY "Users can update their own session_history" ON session_history
    FOR UPDATE USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can delete their own session_history" ON session_history;
CREATE POLICY "Users can delete their own session_history" ON session_history
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- Create RLS policies for locations
DROP POLICY IF EXISTS "Users can view their own locations" ON locations;
CREATE POLICY "Users can view their own locations" ON locations
    FOR SELECT USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can insert their own locations" ON locations;
CREATE POLICY "Users can insert their own locations" ON locations
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can update their own locations" ON locations;
CREATE POLICY "Users can update their own locations" ON locations
    FOR UPDATE USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can delete their own locations" ON locations;
CREATE POLICY "Users can delete their own locations" ON locations
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- Create RLS policies for patients
DROP POLICY IF EXISTS "Users can view their own patients" ON patients;
CREATE POLICY "Users can view their own patients" ON patients
    FOR SELECT USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can insert their own patients" ON patients;
CREATE POLICY "Users can insert their own patients" ON patients
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can update their own patients" ON patients;
CREATE POLICY "Users can update their own patients" ON patients
    FOR UPDATE USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can delete their own patients" ON patients;
CREATE POLICY "Users can delete their own patients" ON patients
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- Create RLS policies for appointments
DROP POLICY IF EXISTS "Users can view their own appointments" ON appointments;
CREATE POLICY "Users can view their own appointments" ON appointments
    FOR SELECT USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can insert their own appointments" ON appointments;
CREATE POLICY "Users can insert their own appointments" ON appointments
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can update their own appointments" ON appointments;
CREATE POLICY "Users can update their own appointments" ON appointments
    FOR UPDATE USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can delete their own appointments" ON appointments;
CREATE POLICY "Users can delete their own appointments" ON appointments
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- Create RLS policies for bookings
DROP POLICY IF EXISTS "Users can view their own bookings" ON bookings;
CREATE POLICY "Users can view their own bookings" ON bookings
    FOR SELECT USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can insert their own bookings" ON bookings;
CREATE POLICY "Users can insert their own bookings" ON bookings
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can update their own bookings" ON bookings;
CREATE POLICY "Users can update their own bookings" ON bookings
    FOR UPDATE USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can delete their own bookings" ON bookings;
CREATE POLICY "Users can delete their own bookings" ON bookings
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- Create RLS policies for treatments
DROP POLICY IF EXISTS "Users can view their own treatments" ON treatments;
CREATE POLICY "Users can view their own treatments" ON treatments
    FOR SELECT USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can insert their own treatments" ON treatments;
CREATE POLICY "Users can insert their own treatments" ON treatments
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can update their own treatments" ON treatments;
CREATE POLICY "Users can update their own treatments" ON treatments
    FOR UPDATE USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can delete their own treatments" ON treatments;
CREATE POLICY "Users can delete their own treatments" ON treatments
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- Create RLS policies for daily_metrics
DROP POLICY IF EXISTS "Users can view their own daily_metrics" ON daily_metrics;
CREATE POLICY "Users can view their own daily_metrics" ON daily_metrics
    FOR SELECT USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can insert their own daily_metrics" ON daily_metrics;
CREATE POLICY "Users can insert their own daily_metrics" ON daily_metrics
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can update their own daily_metrics" ON daily_metrics;
CREATE POLICY "Users can update their own daily_metrics" ON daily_metrics
    FOR UPDATE USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can delete their own daily_metrics" ON daily_metrics;
CREATE POLICY "Users can delete their own daily_metrics" ON daily_metrics
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- Create RLS policies for location_metrics
DROP POLICY IF EXISTS "Users can view their own location_metrics" ON location_metrics;
CREATE POLICY "Users can view their own location_metrics" ON location_metrics
    FOR SELECT USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can insert their own location_metrics" ON location_metrics;
CREATE POLICY "Users can insert their own location_metrics" ON location_metrics
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can update their own location_metrics" ON location_metrics;
CREATE POLICY "Users can update their own location_metrics" ON location_metrics
    FOR UPDATE USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can delete their own location_metrics" ON location_metrics;
CREATE POLICY "Users can delete their own location_metrics" ON location_metrics
    FOR DELETE USING (auth.uid()::text = user_id::text);
