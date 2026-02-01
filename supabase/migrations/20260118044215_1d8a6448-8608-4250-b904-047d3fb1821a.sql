-- Add key_points column to chapters table (stored as JSON array of strings)
ALTER TABLE public.chapters 
ADD COLUMN key_points text[] DEFAULT '{}';

-- Add a comment for clarity
COMMENT ON COLUMN public.chapters.key_points IS 'Array of key points for the chapter';