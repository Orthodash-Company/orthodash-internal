-- Enable RLS on all tables
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE acquisition_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_sync_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_spend ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatments ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_metrics ENABLE ROW LEVEL SECURITY;

-- Locations policies
CREATE POLICY "Users can view their own locations" ON locations
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own locations" ON locations
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own locations" ON locations
    FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own locations" ON locations
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- Acquisition costs policies
CREATE POLICY "Users can view their own acquisition costs" ON acquisition_costs
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own acquisition costs" ON acquisition_costs
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own acquisition costs" ON acquisition_costs
    FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own acquisition costs" ON acquisition_costs
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- API configurations policies
CREATE POLICY "Users can view their own API configurations" ON api_configurations
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own API configurations" ON api_configurations
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own API configurations" ON api_configurations
    FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own API configurations" ON api_configurations
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- API sync history policies
CREATE POLICY "Users can view their own API sync history" ON api_sync_history
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own API sync history" ON api_sync_history
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Vendors policies
CREATE POLICY "Users can view their own vendors" ON vendors
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own vendors" ON vendors
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own vendors" ON vendors
    FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own vendors" ON vendors
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- Revenue policies
CREATE POLICY "Users can view their own revenue" ON revenue
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own revenue" ON revenue
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own revenue" ON revenue
    FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own revenue" ON revenue
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- Ad spend policies
CREATE POLICY "Users can view their own ad spend" ON ad_spend
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own ad spend" ON ad_spend
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own ad spend" ON ad_spend
    FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own ad spend" ON ad_spend
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- Analytics cache policies
CREATE POLICY "Users can view their own analytics cache" ON analytics_cache
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own analytics cache" ON analytics_cache
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own analytics cache" ON analytics_cache
    FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own analytics cache" ON analytics_cache
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- Reports policies
CREATE POLICY "Users can view their own reports" ON reports
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own reports" ON reports
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own reports" ON reports
    FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own reports" ON reports
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- Sessions policies
CREATE POLICY "Users can view their own sessions" ON sessions
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own sessions" ON sessions
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own sessions" ON sessions
    FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own sessions" ON sessions
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- Patients policies (HIPAA compliant)
CREATE POLICY "Users can view their own patients" ON patients
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own patients" ON patients
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own patients" ON patients
    FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own patients" ON patients
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- Appointments policies
CREATE POLICY "Users can view their own appointments" ON appointments
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own appointments" ON appointments
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own appointments" ON appointments
    FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own appointments" ON appointments
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- Bookings policies
CREATE POLICY "Users can view their own bookings" ON bookings
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own bookings" ON bookings
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own bookings" ON bookings
    FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own bookings" ON bookings
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- Treatments policies
CREATE POLICY "Users can view their own treatments" ON treatments
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own treatments" ON treatments
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own treatments" ON treatments
    FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own treatments" ON treatments
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- Daily metrics policies
CREATE POLICY "Users can view their own daily metrics" ON daily_metrics
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own daily metrics" ON daily_metrics
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own daily metrics" ON daily_metrics
    FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own daily metrics" ON daily_metrics
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- Location metrics policies
CREATE POLICY "Users can view their own location metrics" ON location_metrics
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own location metrics" ON location_metrics
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own location metrics" ON location_metrics
    FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own location metrics" ON location_metrics
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- Create indexes for better performance
CREATE INDEX idx_locations_user_id ON locations(user_id);
CREATE INDEX idx_acquisition_costs_user_id ON acquisition_costs(user_id);
CREATE INDEX idx_api_configurations_user_id ON api_configurations(user_id);
CREATE INDEX idx_patients_user_id ON patients(user_id);
CREATE INDEX idx_patients_location_id ON patients(location_id);
CREATE INDEX idx_appointments_user_id ON appointments(user_id);
CREATE INDEX idx_appointments_location_id ON appointments(location_id);
CREATE INDEX idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_appointment_id ON bookings(appointment_id);
CREATE INDEX idx_treatments_user_id ON treatments(user_id);
CREATE INDEX idx_treatments_patient_id ON treatments(patient_id);
CREATE INDEX idx_daily_metrics_user_id ON daily_metrics(user_id);
CREATE INDEX idx_daily_metrics_location_id ON daily_metrics(location_id);
CREATE INDEX idx_daily_metrics_date ON daily_metrics(date);
CREATE INDEX idx_location_metrics_user_id ON location_metrics(user_id);
CREATE INDEX idx_location_metrics_location_id ON location_metrics(location_id);
CREATE INDEX idx_location_metrics_period ON location_metrics(period);
