-- Add degree field to user_profiles table
-- Migration to add degree field for education section

-- Add the degree column to user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS degree TEXT;

-- Add comment for documentation
COMMENT ON COLUMN user_profiles.degree IS 'Degree obtained from college/university (e.g., Bachelor of Science, Master of Arts)';

-- Success message
SELECT 'Degree field added to user_profiles table successfully!' as message;
