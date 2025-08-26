-- Add missing columns to existing tables
ALTER TABLE locations ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE locations ADD COLUMN IF NOT EXISTS greyfinch_id TEXT UNIQUE;
ALTER TABLE locations ADD COLUMN IF NOT EXISTS patient_count INTEGER DEFAULT 0;
ALTER TABLE locations ADD COLUMN IF NOT EXISTS last_sync_date TIMESTAMP;
ALTER TABLE locations ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Create patients table (HIPAA compliant)
CREATE TABLE IF NOT EXISTS patients (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
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

-- Create appointments table
CREATE TABLE IF NOT EXISTS appointments (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  greyfinch_id TEXT UNIQUE,
  patient_id INTEGER REFERENCES patients(id),
  location_id INTEGER REFERENCES locations(id),
  appointment_type TEXT,
  status TEXT,
  scheduled_date TIMESTAMP,
  actual_date TIMESTAMP,
  duration INTEGER,
  revenue REAL DEFAULT 0,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  greyfinch_id TEXT UNIQUE,
  appointment_id INTEGER REFERENCES appointments(id),
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  local_start_date TIMESTAMP,
  local_start_time TIMESTAMP,
  timezone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create treatments table
CREATE TABLE IF NOT EXISTS treatments (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  greyfinch_id TEXT UNIQUE,
  patient_id INTEGER REFERENCES patients(id),
  name TEXT NOT NULL,
  type TEXT,
  status TEXT,
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  total_cost REAL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create daily_metrics table
CREATE TABLE IF NOT EXISTS daily_metrics (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  location_id INTEGER REFERENCES locations(id),
  date TIMESTAMP NOT NULL,
  total_patients INTEGER DEFAULT 0,
  new_patients INTEGER DEFAULT 0,
  appointments INTEGER DEFAULT 0,
  completed_appointments INTEGER DEFAULT 0,
  cancelled_appointments INTEGER DEFAULT 0,
  no_shows INTEGER DEFAULT 0,
  total_revenue REAL DEFAULT 0,
  average_revenue REAL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create location_metrics table
CREATE TABLE IF NOT EXISTS location_metrics (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  location_id INTEGER REFERENCES locations(id),
  period TEXT NOT NULL,
  total_patients INTEGER DEFAULT 0,
  new_patients INTEGER DEFAULT 0,
  total_appointments INTEGER DEFAULT 0,
  completed_appointments INTEGER DEFAULT 0,
  cancellation_rate REAL DEFAULT 0,
  no_show_rate REAL DEFAULT 0,
  total_revenue REAL DEFAULT 0,
  average_revenue_per_patient REAL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_patients_user_id ON patients(user_id);
CREATE INDEX IF NOT EXISTS idx_patients_location_id ON patients(location_id);
CREATE INDEX IF NOT EXISTS idx_patients_greyfinch_id ON patients(greyfinch_id);
CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_location_id ON appointments(location_id);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_greyfinch_id ON appointments(greyfinch_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_appointment_id ON bookings(appointment_id);
CREATE INDEX IF NOT EXISTS idx_bookings_greyfinch_id ON bookings(greyfinch_id);
CREATE INDEX IF NOT EXISTS idx_treatments_user_id ON treatments(user_id);
CREATE INDEX IF NOT EXISTS idx_treatments_patient_id ON treatments(patient_id);
CREATE INDEX IF NOT EXISTS idx_treatments_greyfinch_id ON treatments(greyfinch_id);
CREATE INDEX IF NOT EXISTS idx_daily_metrics_user_id ON daily_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_metrics_location_id ON daily_metrics(location_id);
CREATE INDEX IF NOT EXISTS idx_daily_metrics_date ON daily_metrics(date);
CREATE INDEX IF NOT EXISTS idx_location_metrics_user_id ON location_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_location_metrics_location_id ON location_metrics(location_id);
CREATE INDEX IF NOT EXISTS idx_location_metrics_period ON location_metrics(period);
