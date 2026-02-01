-- Create institutes table
CREATE TABLE public.institutes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  institute_code TEXT UNIQUE NOT NULL,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL
);

-- Create function to generate unique institute code
CREATE OR REPLACE FUNCTION generate_institute_code()
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    new_code := 'INST' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    SELECT EXISTS(SELECT 1 FROM institutes WHERE institute_code = new_code) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;
  RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- Add mobile_number to profiles
ALTER TABLE public.profiles ADD COLUMN mobile_number TEXT;

-- Create institute_students table (students linked to institutes with approval)
CREATE TABLE public.institute_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institute_id UUID REFERENCES public.institutes(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  is_approved BOOLEAN DEFAULT false NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(institute_id, student_id)
);

-- Create institute_exams table
CREATE TABLE public.institute_exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institute_id UUID REFERENCES public.institutes(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  subject_id UUID REFERENCES public.subjects(id),
  exam_code TEXT UNIQUE NOT NULL,
  exam_date TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL
);

-- Create function to generate unique exam code
CREATE OR REPLACE FUNCTION generate_exam_code()
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    new_code := 'EX' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    SELECT EXISTS(SELECT 1 FROM institute_exams WHERE exam_code = new_code) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;
  RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- Create exam_enrollments table
CREATE TABLE public.exam_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID REFERENCES public.institute_exams(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(exam_id, student_id)
);

-- Add institute_id to existing content tables
ALTER TABLE public.subjects ADD COLUMN institute_id UUID REFERENCES public.institutes(id) ON DELETE CASCADE;
ALTER TABLE public.chapters ADD COLUMN institute_id UUID REFERENCES public.institutes(id) ON DELETE CASCADE;
ALTER TABLE public.mcqs ADD COLUMN institute_id UUID REFERENCES public.institutes(id) ON DELETE CASCADE;

-- Update app_role enum to include institute
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'institute';

-- Enable RLS on new tables
ALTER TABLE public.institutes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.institute_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.institute_exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_enrollments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for institutes table
CREATE POLICY "Admins can view all institutes"
  ON public.institutes FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Institutes can view their own data"
  ON public.institutes FOR SELECT
  USING (created_by = auth.uid());

CREATE POLICY "Anyone can insert institutes during signup"
  ON public.institutes FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Institutes can update their own data"
  ON public.institutes FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "Admins can update any institute"
  ON public.institutes FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for institute_students
CREATE POLICY "Admins can view all institute students"
  ON public.institute_students FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Institutes can view their students"
  ON public.institute_students FOR SELECT
  USING (EXISTS(SELECT 1 FROM institutes WHERE id = institute_id AND created_by = auth.uid()));

CREATE POLICY "Students can view their enrollments"
  ON public.institute_students FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "Students can join institutes"
  ON public.institute_students FOR INSERT
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Institutes can update their students"
  ON public.institute_students FOR UPDATE
  USING (EXISTS(SELECT 1 FROM institutes WHERE id = institute_id AND created_by = auth.uid()));

-- RLS Policies for institute_exams
CREATE POLICY "Admins can view all exams"
  ON public.institute_exams FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Institutes can view their exams"
  ON public.institute_exams FOR SELECT
  USING (EXISTS(SELECT 1 FROM institutes WHERE id = institute_id AND created_by = auth.uid()));

CREATE POLICY "Students can view exams from their institutes"
  ON public.institute_exams FOR SELECT
  USING (EXISTS(
    SELECT 1 FROM institute_students 
    WHERE institute_id = institute_exams.institute_id 
    AND student_id = auth.uid() 
    AND is_approved = true
  ));

CREATE POLICY "Institutes can create exams"
  ON public.institute_exams FOR INSERT
  WITH CHECK (EXISTS(SELECT 1 FROM institutes WHERE id = institute_id AND created_by = auth.uid()));

CREATE POLICY "Institutes can update their exams"
  ON public.institute_exams FOR UPDATE
  USING (EXISTS(SELECT 1 FROM institutes WHERE id = institute_id AND created_by = auth.uid()));

CREATE POLICY "Institutes can delete their exams"
  ON public.institute_exams FOR DELETE
  USING (EXISTS(SELECT 1 FROM institutes WHERE id = institute_id AND created_by = auth.uid()));

-- RLS Policies for exam_enrollments
CREATE POLICY "Students can view their enrollments"
  ON public.exam_enrollments FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "Institutes can view enrollments for their exams"
  ON public.exam_enrollments FOR SELECT
  USING (EXISTS(
    SELECT 1 FROM institute_exams ie
    JOIN institutes i ON ie.institute_id = i.id
    WHERE ie.id = exam_id AND i.created_by = auth.uid()
  ));

CREATE POLICY "Students can enroll in exams"
  ON public.exam_enrollments FOR INSERT
  WITH CHECK (student_id = auth.uid());

-- Update existing RLS policies for subjects/chapters/mcqs to support institutes
DROP POLICY IF EXISTS "Admins can insert subjects" ON public.subjects;
CREATE POLICY "Admins and institutes can insert subjects"
  ON public.subjects FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'admin') OR 
    (institute_id IS NOT NULL AND EXISTS(SELECT 1 FROM institutes WHERE id = institute_id AND created_by = auth.uid()))
  );

DROP POLICY IF EXISTS "Admins can update subjects" ON public.subjects;
CREATE POLICY "Admins and institutes can update their subjects"
  ON public.subjects FOR UPDATE
  USING (
    has_role(auth.uid(), 'admin') OR 
    (institute_id IS NOT NULL AND EXISTS(SELECT 1 FROM institutes WHERE id = institute_id AND created_by = auth.uid()))
  );

DROP POLICY IF EXISTS "Admins can delete subjects" ON public.subjects;
CREATE POLICY "Admins and institutes can delete their subjects"
  ON public.subjects FOR DELETE
  USING (
    has_role(auth.uid(), 'admin') OR 
    (institute_id IS NOT NULL AND EXISTS(SELECT 1 FROM institutes WHERE id = institute_id AND created_by = auth.uid()))
  );

-- Update triggers for updated_at
CREATE TRIGGER update_institutes_updated_at
  BEFORE UPDATE ON public.institutes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_institute_exams_updated_at
  BEFORE UPDATE ON public.institute_exams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();