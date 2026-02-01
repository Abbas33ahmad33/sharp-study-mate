-- Add DELETE policy for students to delete their own test attempts
CREATE POLICY "Students can delete own attempts"
ON public.test_attempts
FOR DELETE
USING ((auth.uid() = student_id) AND is_active_user(auth.uid()));

-- Add DELETE policy for students to delete their own test answers
CREATE POLICY "Students can delete own answers"
ON public.test_answers
FOR DELETE
USING (
  (EXISTS (
    SELECT 1 FROM test_attempts
    WHERE test_attempts.id = test_answers.attempt_id
    AND test_attempts.student_id = auth.uid()
  )) AND is_active_user(auth.uid())
);