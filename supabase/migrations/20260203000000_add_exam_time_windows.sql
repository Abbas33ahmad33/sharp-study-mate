-- Migration: Add opens_at and closes_at to institute_exams
-- This allows institutes to set a specific window during which students can take the exam.

ALTER TABLE public.institute_exams 
ADD COLUMN IF NOT EXISTS opens_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS closes_at timestamp with time zone;

-- Update existing exams to use exam_date as opens_at if available
UPDATE public.institute_exams
SET opens_at = exam_date
WHERE opens_at IS NULL AND exam_date IS NOT NULL;

-- Set a default closes_at based on duration if duration and opens_at exist
UPDATE public.institute_exams
SET closes_at = opens_at + (duration_minutes || ' minutes')::interval
WHERE closes_at IS NULL AND opens_at IS NOT NULL;

COMMENT ON COLUMN public.institute_exams.opens_at IS 'Timestamp when the exam becomes available to students';
COMMENT ON COLUMN public.institute_exams.closes_at IS 'Timestamp when the exam becomes unavailable and auto-submits';
