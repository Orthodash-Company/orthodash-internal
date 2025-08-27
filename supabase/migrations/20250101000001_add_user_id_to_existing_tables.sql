-- Add user_id column to existing tables that don't have it
ALTER TABLE acquisition_costs ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE reports ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Update existing rows to have a default user_id (from auth.users)
UPDATE acquisition_costs SET user_id = (SELECT id FROM auth.users LIMIT 1) WHERE user_id IS NULL;
UPDATE reports SET user_id = (SELECT id FROM auth.users LIMIT 1) WHERE user_id IS NULL;

-- Make user_id NOT NULL
ALTER TABLE acquisition_costs ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE reports ALTER COLUMN user_id SET NOT NULL;

-- Create indexes for the new user_id columns
CREATE INDEX IF NOT EXISTS idx_acquisition_costs_user_id ON acquisition_costs(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports(user_id);
