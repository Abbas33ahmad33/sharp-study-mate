-- Update handle_new_user to check metadata for role type
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_type text;
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, email, full_name, mobile_number)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'mobile_number', NULL)
  );
  
  -- Check if user is registering as institute
  user_type := NEW.raw_user_meta_data->>'user_type';
  
  IF user_type = 'institute' THEN
    -- Assign institute role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'institute');
  ELSE
    -- Default to student role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'student');
  END IF;
  
  RETURN NEW;
END;
$$;