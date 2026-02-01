-- Add exam duration to institute_exams
ALTER TABLE public.institute_exams 
ADD COLUMN IF NOT EXISTS duration_minutes integer DEFAULT 60;

-- Table to link MCQs to exams (for selecting from global bank)
CREATE TABLE public.exam_mcqs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  exam_id uuid NOT NULL REFERENCES public.institute_exams(id) ON DELETE CASCADE,
  mcq_id uuid NOT NULL REFERENCES public.mcqs(id) ON DELETE CASCADE,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(exam_id, mcq_id)
);

-- Table for institute custom questions
CREATE TABLE public.institute_mcqs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  institute_id uuid NOT NULL REFERENCES public.institutes(id) ON DELETE CASCADE,
  exam_id uuid REFERENCES public.institute_exams(id) ON DELETE SET NULL,
  question text NOT NULL,
  option_a text NOT NULL,
  option_b text NOT NULL,
  option_c text NOT NULL,
  option_d text NOT NULL,
  correct_option text NOT NULL,
  explanation text,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Exam attempts by students
CREATE TABLE public.exam_attempts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  exam_id uuid NOT NULL REFERENCES public.institute_exams(id) ON DELETE CASCADE,
  student_id uuid NOT NULL,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  completed_at timestamp with time zone,
  score integer DEFAULT 0,
  total_questions integer NOT NULL,
  percentage numeric,
  is_submitted boolean DEFAULT false,
  UNIQUE(exam_id, student_id)
);

-- Exam answers
CREATE TABLE public.exam_answers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  attempt_id uuid NOT NULL REFERENCES public.exam_attempts(id) ON DELETE CASCADE,
  mcq_id uuid, -- can be null if using institute_mcq
  institute_mcq_id uuid REFERENCES public.institute_mcqs(id) ON DELETE CASCADE,
  selected_option text NOT NULL,
  is_correct boolean NOT NULL,
  answered_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.exam_mcqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.institute_mcqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_answers ENABLE ROW LEVEL SECURITY;

-- RLS for exam_mcqs
CREATE POLICY "Institutes can manage their exam MCQs"
ON public.exam_mcqs FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM institute_exams ie
    JOIN institutes i ON ie.institute_id = i.id
    WHERE ie.id = exam_mcqs.exam_id AND i.created_by = auth.uid()
  )
);

CREATE POLICY "Students can view exam MCQs for enrolled exams"
ON public.exam_mcqs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM exam_enrollments ee
    WHERE ee.exam_id = exam_mcqs.exam_id AND ee.student_id = auth.uid()
  )
);

-- RLS for institute_mcqs
CREATE POLICY "Institutes can manage their custom MCQs"
ON public.institute_mcqs FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM institutes i
    WHERE i.id = institute_mcqs.institute_id AND i.created_by = auth.uid()
  )
);

CREATE POLICY "Students can view institute MCQs during exams"
ON public.institute_mcqs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM exam_enrollments ee
    JOIN institute_exams ie ON ee.exam_id = ie.id
    WHERE ie.institute_id = institute_mcqs.institute_id AND ee.student_id = auth.uid()
  )
);

-- RLS for exam_attempts
CREATE POLICY "Students can manage their own exam attempts"
ON public.exam_attempts FOR ALL
USING (student_id = auth.uid());

CREATE POLICY "Institutes can view attempts for their exams"
ON public.exam_attempts FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM institute_exams ie
    JOIN institutes i ON ie.institute_id = i.id
    WHERE ie.id = exam_attempts.exam_id AND i.created_by = auth.uid()
  )
);

-- RLS for exam_answers
CREATE POLICY "Students can manage their own exam answers"
ON public.exam_answers FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM exam_attempts ea
    WHERE ea.id = exam_answers.attempt_id AND ea.student_id = auth.uid()
  )
);

CREATE POLICY "Institutes can view answers for their exams"
ON public.exam_answers FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM exam_attempts ea
    JOIN institute_exams ie ON ea.exam_id = ie.id
    JOIN institutes i ON ie.institute_id = i.id
    WHERE ea.id = exam_answers.attempt_id AND i.created_by = auth.uid()
  )
);