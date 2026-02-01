-- Fix: Allow institutes to view profiles of their students
CREATE POLICY "Institutes can view their student profiles"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM institute_students ist
    JOIN institutes i ON ist.institute_id = i.id
    WHERE ist.student_id = profiles.id
    AND i.created_by = auth.uid()
  )
);

-- Update handle_new_user to NOT assign default student role (let signup flow handle it)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, mobile_number)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'mobile_number', NULL)
  );
  
  -- Only assign student role if no role exists yet (prevents overwriting institute role)
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = NEW.id) THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'student');
  END IF;
  
  RETURN NEW;
END;
$$;