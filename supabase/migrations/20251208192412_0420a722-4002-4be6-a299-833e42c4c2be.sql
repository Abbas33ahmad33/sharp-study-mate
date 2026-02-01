-- Allow anyone to view institute by code (for joining)
CREATE POLICY "Anyone can view active institutes by code"
ON public.institutes
FOR SELECT
USING (is_active = true);

-- Drop the restrictive policies that prevent viewing
DROP POLICY IF EXISTS "Admins can view all institutes" ON public.institutes;
DROP POLICY IF EXISTS "Institutes can view their own data" ON public.institutes;