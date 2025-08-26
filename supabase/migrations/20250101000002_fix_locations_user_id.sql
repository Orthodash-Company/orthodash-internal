-- Add missing user_id column to locations table
ALTER TABLE locations ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Update existing locations to have a default user (if any exist)
-- This is a temporary fix - in production you'd want to handle this more carefully
UPDATE locations SET user_id = (
  SELECT id FROM auth.users LIMIT 1
) WHERE user_id IS NULL;

-- Make user_id NOT NULL after setting default values
ALTER TABLE locations ALTER COLUMN user_id SET NOT NULL;

-- Create index for user_id on locations
CREATE INDEX IF NOT EXISTS idx_locations_user_id ON locations(user_id);
