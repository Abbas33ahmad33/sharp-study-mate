-- Fix Issue 1: Prevent students from viewing correct answers
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Everyone can view mcqs" ON public.mcqs;

-- Create new policies that hide correct_option from students
CREATE POLICY "Admins and content creators can view all mcq data"
ON public.mcqs FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'content_creator'::app_role)
);

CREATE POLICY "Students can view mcqs without answers"
ON public.mcqs FOR SELECT
TO authenticated
USING (
  NOT has_role(auth.uid(), 'admin'::app_role) AND 
  NOT has_role(auth.uid(), 'content_creator'::app_role)
);

-- Create a secure function to check if an answer is correct
CREATE OR REPLACE FUNCTION public.check_answer(
  _mcq_id uuid,
  _selected_option text
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT correct_option = _selected_option
  FROM public.mcqs
  WHERE id = _mcq_id;
$$;

-- Fix Issue 2: Enforce is_active status in RLS policies
-- Helper function to check if user is active
CREATE OR REPLACE FUNCTION public.is_active_user(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_active FROM public.profiles WHERE id = _user_id),
    false
  );
$$;

-- Update test_attempts policies to check is_active
DROP POLICY IF EXISTS "Students can insert own attempts" ON public.test_attempts;
CREATE POLICY "Active students can insert own attempts"
ON public.test_attempts FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = student_id AND
  is_active_user(auth.uid())
);

DROP POLICY IF EXISTS "Students can view own attempts" ON public.test_attempts;
CREATE POLICY "Active students can view own attempts"
ON public.test_attempts FOR SELECT
TO authenticated
USING (
  auth.uid() = student_id AND
  is_active_user(auth.uid())
);

-- Update test_answers policies to check is_active
DROP POLICY IF EXISTS "Students can insert own answers" ON public.test_answers;
CREATE POLICY "Active students can insert own answers"
ON public.test_answers FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM test_attempts
    WHERE test_attempts.id = test_answers.attempt_id 
    AND test_attempts.student_id = auth.uid()
  ) AND
  is_active_user(auth.uid())
);

DROP POLICY IF EXISTS "Students can view own answers" ON public.test_answers;
CREATE POLICY "Active students can view own answers"
ON public.test_answers FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM test_attempts
    WHERE test_attempts.id = test_answers.attempt_id 
    AND test_attempts.student_id = auth.uid()
  ) AND
  is_active_user(auth.uid())
);

-- Update user_roles policies to check is_active
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Active users can view own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id AND
  is_active_user(auth.uid())
);