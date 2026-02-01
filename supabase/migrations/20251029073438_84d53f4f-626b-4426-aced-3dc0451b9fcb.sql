-- Step 2: Update policies to support content creators
DROP POLICY IF EXISTS "Admins can insert mcqs" ON public.mcqs;
DROP POLICY IF EXISTS "Admins can update mcqs" ON public.mcqs;
DROP POLICY IF EXISTS "Admins can delete mcqs" ON public.mcqs;

CREATE POLICY "Admins and content creators can insert mcqs" 
ON public.mcqs 
FOR INSERT 
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'content_creator'::app_role)
);

CREATE POLICY "Admins can update all mcqs, content creators can update own" 
ON public.mcqs 
FOR UPDATE 
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  (has_role(auth.uid(), 'content_creator'::app_role) AND created_by = auth.uid())
);

CREATE POLICY "Admins can delete all mcqs, content creators can delete own" 
ON public.mcqs 
FOR DELETE 
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  (has_role(auth.uid(), 'content_creator'::app_role) AND created_by = auth.uid())
);

CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role) OR auth.uid() = id);

CREATE POLICY "Admins can update all profiles" 
ON public.profiles 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role) OR auth.uid() = id);

CREATE POLICY "Admins can insert user roles" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete user roles" 
ON public.user_roles 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view all user roles" 
ON public.user_roles 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role) OR user_id = auth.uid());