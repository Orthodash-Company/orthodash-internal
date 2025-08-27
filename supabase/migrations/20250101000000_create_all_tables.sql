-- Create all tables if they don't exist
-- API Configurations table
CREATE TABLE IF NOT EXISTS api_configurations (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    name TEXT NOT NULL,
    api_key TEXT NOT NULL,
    api_secret TEXT NOT NULL,
    base_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Acquisition Costs table
CREATE TABLE IF NOT EXISTS acquisition_costs (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    location_id INTEGER,
    cost_type TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    date DATE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Reports table
CREATE TABLE IF NOT EXISTS reports (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    title TEXT NOT NULL,
    content JSONB,
    generated_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Session History table
CREATE TABLE IF NOT EXISTS session_history (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    session_data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Locations table (update if exists)
ALTER TABLE locations ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE locations ADD COLUMN IF NOT EXISTS greyfinch_id TEXT;
ALTER TABLE locations ADD COLUMN IF NOT EXISTS last_sync_date TIMESTAMP;

-- Patients table
CREATE TABLE IF NOT EXISTS patients (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    greyfinch_id TEXT UNIQUE,
    location_id INTEGER REFERENCES locations(id),
    patient_hash TEXT NOT NULL,
    age_group TEXT,
    gender TEXT,
    treatment_status TEXT,
    first_visit_date TIMESTAMP,
    last_visit_date TIMESTAMP,
    total_visits INTEGER DEFAULT 0,
    total_revenue REAL DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Appointments table
CREATE TABLE IF NOT EXISTS appointments (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    greyfinch_id TEXT UNIQUE,
    patient_id INTEGER REFERENCES patients(id),
    location_id INTEGER REFERENCES locations(id),
    appointment_date TIMESTAMP,
    status TEXT,
    type TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    greyfinch_id TEXT UNIQUE,
    appointment_id INTEGER REFERENCES appointments(id),
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    local_start_date DATE,
    local_start_time TIME,
    status TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Treatments table
CREATE TABLE IF NOT EXISTS treatments (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    greyfinch_id TEXT UNIQUE,
    patient_id INTEGER REFERENCES patients(id),
    name TEXT,
    status_type TEXT,
    status_name TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Daily Metrics table
CREATE TABLE IF NOT EXISTS daily_metrics (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    location_id INTEGER REFERENCES locations(id),
    date DATE NOT NULL,
    total_appointments INTEGER DEFAULT 0,
    completed_appointments INTEGER DEFAULT 0,
    cancelled_appointments INTEGER DEFAULT 0,
    no_shows INTEGER DEFAULT 0,
    total_revenue REAL DEFAULT 0,
    new_patients INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Location Metrics table
CREATE TABLE IF NOT EXISTS location_metrics (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    location_id INTEGER REFERENCES locations(id),
    metric_date DATE NOT NULL,
    total_patients INTEGER DEFAULT 0,
    active_patients INTEGER DEFAULT 0,
    total_appointments INTEGER DEFAULT 0,
    total_revenue REAL DEFAULT 0,
    average_appointment_value REAL DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance (only for new tables)
CREATE INDEX IF NOT EXISTS idx_api_configurations_user_id ON api_configurations(user_id);
CREATE INDEX IF NOT EXISTS idx_session_history_user_id ON session_history(user_id);
CREATE INDEX IF NOT EXISTS idx_patients_user_id ON patients(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_treatments_user_id ON treatments(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_metrics_user_id ON daily_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_location_metrics_user_id ON location_metrics(user_id);
