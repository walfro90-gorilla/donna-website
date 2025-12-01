-- Add has_seen_tour column to user_preferences table
ALTER TABLE public.user_preferences 
ADD COLUMN IF NOT EXISTS has_seen_tour BOOLEAN DEFAULT FALSE;

-- Comment on the column
COMMENT ON COLUMN public.user_preferences.has_seen_tour IS 'Tracks if the user has completed the dashboard guided tour';
