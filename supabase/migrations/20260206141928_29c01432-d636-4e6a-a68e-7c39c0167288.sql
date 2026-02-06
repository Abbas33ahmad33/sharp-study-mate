-- Add opens_at and closes_at columns to institute_exams table
ALTER TABLE public.institute_exams 
ADD COLUMN IF NOT EXISTS opens_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS closes_at timestamp with time zone;