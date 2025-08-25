-- Orthodash Supabase Database Setup
-- Run this in your Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create tables
CREATE TABLE "locations" (
    "id" serial PRIMARY KEY NOT NULL,
    "name" text NOT NULL,
    "greyfinch_id" text UNIQUE,
    "address" text,
    "patient_count" integer,
    "last_sync_date" timestamp,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp DEFAULT now(),
    "updated_at" timestamp DEFAULT now()
);

CREATE TABLE "acquisition_costs" (
    "id" serial PRIMARY KEY NOT NULL,
    "location_id" integer REFERENCES "locations"("id") ON DELETE CASCADE,
    "referral_type" text NOT NULL,
    "cost" real NOT NULL,
    "period" text NOT NULL,
    "created_at" timestamp DEFAULT now(),
    "updated_at" timestamp DEFAULT now()
);

CREATE TABLE "analytics_cache" (
    "id" serial PRIMARY KEY NOT NULL,
    "location_id" integer REFERENCES "locations"("id") ON DELETE CASCADE,
    "start_date" text NOT NULL,
    "end_date" text NOT NULL,
    "data_type" text NOT NULL,
    "data" text NOT NULL,
    "created_at" timestamp DEFAULT now()
);

CREATE TABLE "reports" (
    "id" serial PRIMARY KEY NOT NULL,
    "user_id" uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    "name" text NOT NULL,
    "description" text,
    "period_configs" text NOT NULL,
    "pdf_url" text,
    "thumbnail" text,
    "is_public" boolean DEFAULT false,
    "share_token" text UNIQUE,
    "created_at" timestamp DEFAULT now(),
    "updated_at" timestamp DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_locations_greyfinch_id ON locations(greyfinch_id);
CREATE INDEX idx_acquisition_costs_location_period ON acquisition_costs(location_id, period);
CREATE INDEX idx_analytics_cache_location_dates ON analytics_cache(location_id, start_date, end_date);
CREATE INDEX idx_reports_user_id ON reports(user_id);
CREATE INDEX idx_reports_share_token ON reports(share_token);

-- Enable Row Level Security (RLS)
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE acquisition_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for locations
CREATE POLICY "Locations are viewable by authenticated users" ON locations
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Locations are insertable by authenticated users" ON locations
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Locations are updatable by authenticated users" ON locations
    FOR UPDATE USING (auth.role() = 'authenticated');

-- RLS Policies for acquisition_costs
CREATE POLICY "Acquisition costs are viewable by authenticated users" ON acquisition_costs
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Acquisition costs are insertable by authenticated users" ON acquisition_costs
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Acquisition costs are updatable by authenticated users" ON acquisition_costs
    FOR UPDATE USING (auth.role() = 'authenticated');

-- RLS Policies for analytics_cache
CREATE POLICY "Analytics cache is viewable by authenticated users" ON analytics_cache
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Analytics cache is insertable by authenticated users" ON analytics_cache
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- RLS Policies for reports
CREATE POLICY "Reports are viewable by owner or if public" ON reports
    FOR SELECT USING (
        auth.uid() = user_id OR 
        is_public = true OR 
        share_token IS NOT NULL
    );

CREATE POLICY "Reports are insertable by authenticated users" ON reports
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Reports are updatable by owner" ON reports
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Reports are deletable by owner" ON reports
    FOR DELETE USING (auth.uid() = user_id);

-- Create functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON locations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_acquisition_costs_updated_at BEFORE UPDATE ON acquisition_costs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for testing
INSERT INTO locations (name, greyfinch_id, address, patient_count) VALUES
    ('Main Orthodontic Center', 'loc_001', '123 Main St, Downtown', 1247),
    ('Westside Dental & Orthodontics', 'loc_002', '456 West Ave, Westside', 892);

-- Create a function to generate share tokens
CREATE OR REPLACE FUNCTION generate_share_token()
RETURNS text AS $$
BEGIN
    RETURN 'share_' || substr(md5(random()::text), 1, 16);
END;
$$ LANGUAGE plpgsql;

-- Create a function to set share token on report creation
CREATE OR REPLACE FUNCTION set_report_share_token()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.share_token IS NULL THEN
        NEW.share_token = generate_share_token();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically set share token
CREATE TRIGGER set_report_share_token_trigger
    BEFORE INSERT ON reports
    FOR EACH ROW
    EXECUTE FUNCTION set_report_share_token();
