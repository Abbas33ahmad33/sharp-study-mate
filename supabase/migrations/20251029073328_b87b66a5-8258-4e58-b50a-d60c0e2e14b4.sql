-- Step 1: Add new enum value and profile column
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'content_creator';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;