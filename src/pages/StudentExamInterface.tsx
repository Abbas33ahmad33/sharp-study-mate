import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Clock, ChevronLeft, ChevronRight, CheckCircle, AlertTriangle } from "lucide-react";

interface MCQ {
  id: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
  type: "bank" | "custom";
}

interface ExamData {
  id: string;
  title: string;
  duration_minutes: number;
  opens_at: string | null;
  closes_at: string | null;
}

const StudentExamInterface = () => {
  const navigate = useNavigate();
  const { examId } = useParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [exam, setExam] = useState<ExamData | null>(null);
  const [questions, setQuestions] = useState<MCQ[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    loadExam();
  }, [examId, user]);

  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit(true);
          return 0;
        }

        // Check if now reached closes_at
        if (exam?.closes_at) {
          const closesAt = new Date(exam.closes_at).getTime();
          if (Date.now() >= closesAt) {
            clearInterval(timer);
            toast.warning("The exam window has closed.");
            handleSubmit(true);
            return 0;
          }
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const loadExam = async () => {
    if (!examId || !user) return;

    try {
      // Check if already attempted
      const { data: existingAttempt } = await supabase
        .from("exam_attempts")
        .select("*")
        .eq("exam_id", examId)
        .eq("student_id", user.id)
        .single();

      if (existingAttempt?.is_submitted) {
        toast.error("You have already completed this exam");
        navigate("/student");
        return;
      }

      // Fetch exam details
      const { data: examData, error } = await supabase
        .from("institute_exams")
        .select("id, title, duration_minutes, institute_id, opens_at, closes_at")
        .eq("id", examId)
        .single() as any;

      if (error) throw error;

      const now = Date.now();
      const opensAt = examData.opens_at ? new Date(examData.opens_at).getTime() : null;
      const closesAt = examData.closes_at ? new Date(examData.closes_at).getTime() : null;

      if (opensAt && now < opensAt) {
        toast.error(`This exam hasn't started yet. It will open at ${new Date(opensAt).toLocaleString()}`);
        navigate("/student");
        return;
      }

      if (closesAt && now > closesAt) {
        toast.error("This exam has already ended.");
        navigate("/student");
        return;
      }

      setExam(examData);

      // Check if student is enrolled in the institute
      const { data: enrollment } = await supabase
        .from("institute_students")
        .select("is_approved")
        .eq("institute_id", examData.institute_id)
        .eq("student_id", user.id)
        .single();

      if (!enrollment?.is_approved) {
        toast.error("You are not approved to take this exam");
        navigate("/student");
        return;
      }

      // Auto-enroll in exam if not already enrolled
      const { data: examEnrollment } = await supabase
        .from("exam_enrollments")
        .select("id")
        .eq("exam_id", examId)
        .eq("student_id", user.id)
        .single();

      if (!examEnrollment) {
        await supabase.from("exam_enrollments").insert({
          exam_id: examId,
          student_id: user.id,
        });
      }

      // Fetch questions from bank via the exam_mcqs join table
      const { data: bankQuestionLinks } = await supabase
        .from("exam_mcqs")
        .select("mcq_id")
        .eq("exam_id", examId)
        .order("order_index");

      let bankQuestions: any[] = [];
      if (bankQuestionLinks && bankQuestionLinks.length > 0) {
        const mcqIds = bankQuestionLinks.map(bq => bq.mcq_id);
        const { data: mcqs } = await supabase
          .from("mcqs")
          .select("id, question, option_a, option_b, option_c, option_d, correct_option")
          .in("id", mcqIds);
        bankQuestions = mcqs || [];
      }

      // Fetch custom questions
      const { data: customQuestions } = await supabase
        .from("institute_mcqs")
        .select("id, question, option_a, option_b, option_c, option_d, correct_option")
        .eq("exam_id", examId);

      const allQuestions: MCQ[] = [
        ...bankQuestions.map((bq) => ({
          ...bq,
          type: "bank" as const,
        })),
        ...(customQuestions || []).map((cq) => ({
          ...cq,
          type: "custom" as const,
        })),
      ];

      if (allQuestions.length === 0) {
        toast.error("This exam has no questions");
        navigate("/student");
        return;
      }

      setQuestions(allQuestions);

      // Create or resume attempt
      if (existingAttempt) {
        setAttemptId(existingAttempt.id);
        const elapsed = Math.floor(
          (Date.now() - new Date(existingAttempt.started_at).getTime()) / 1000
        );
        const remaining = examData.duration_minutes * 60 - elapsed;
        setTimeLeft(Math.max(remaining, 0));

        // Load existing answers
        const { data: existingAnswers } = await supabase
          .from("exam_answers")
          .select("mcq_id, institute_mcq_id, selected_option")
          .eq("attempt_id", existingAttempt.id);

        if (existingAnswers) {
          const answerMap: Record<string, string> = {};
          existingAnswers.forEach((ans) => {
            const key = ans.mcq_id || ans.institute_mcq_id;
            if (key) answerMap[key] = ans.selected_option;
          });
          setAnswers(answerMap);
        }
      } else {
        const { data: newAttempt, error: attemptError } = await supabase
          .from("exam_attempts")
          .insert({
            exam_id: examId,
            student_id: user.id,
            total_questions: allQuestions.length,
          })
          .select()
          .single();

        if (attemptError) throw attemptError;
        setAttemptId(newAttempt.id);
        setTimeLeft(examData.duration_minutes * 60);
      }
    } catch (error) {
      console.error("Error loading exam:", error);
      toast.error("Failed to load exam");
      navigate("/student");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = async (option: string) => {
    if (!attemptId) return;

    const currentQuestion = questions[currentIndex];
    const isCorrect = currentQuestion.correct_option === option;
    const previousAnswer = answers[currentQuestion.id];

    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: option }));

    try {
      if (previousAnswer) {
        // Update existing answer
        await supabase
          .from("exam_answers")
          .update({
            selected_option: option,
            is_correct: isCorrect,
          })
          .eq("attempt_id", attemptId)
          .or(
            currentQuestion.type === "bank"
              ? `mcq_id.eq.${currentQuestion.id}`
              : `institute_mcq_id.eq.${currentQuestion.id}`
          );
      } else {
        // Insert new answer
        await supabase.from("exam_answers").insert({
          attempt_id: attemptId,
          mcq_id: currentQuestion.type === "bank" ? currentQuestion.id : null,
          institute_mcq_id: currentQuestion.type === "custom" ? currentQuestion.id : null,
          selected_option: option,
          is_correct: isCorrect,
        });
      }
    } catch (error) {
      console.error("Error saving answer:", error);
    }
  };

  const handleSubmit = useCallback(async (autoSubmit = false) => {
    if (!attemptId || isSubmitting) return;
    setIsSubmitting(true);

    try {
      // Calculate score
      let score = 0;
      questions.forEach((q) => {
        if (answers[q.id] === q.correct_option) {
          score++;
        }
      });

      const percentage = (score / questions.length) * 100;

      const { error } = await supabase
        .from("exam_attempts")
        .update({
          completed_at: new Date().toISOString(),
          score,
          percentage,
          is_submitted: true,
        })
        .eq("id", attemptId);

      if (error) throw error;

      toast.success(
        autoSubmit
          ? "Time's up! Your exam has been submitted."
          : "Exam submitted successfully!"
      );
      navigate("/student");
    } catch (error) {
      console.error("Error submitting exam:", error);
      toast.error("Failed to submit exam");
      setIsSubmitting(false);
    }
  }, [attemptId, answers, questions, isSubmitting, navigate]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!exam || questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Exam not available</p>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;
  const answeredCount = Object.keys(answers).length;
  const isLowTime = timeLeft <= 60;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b p-4">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3">
          <h1 className="text-lg font-bold truncate">{exam.title}</h1>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${isLowTime ? "bg-destructive/10 text-destructive" : "bg-muted"}`}>
            {isLowTime && <AlertTriangle className="h-4 w-4" />}
            <Clock className="h-4 w-4" />
            <span className="font-mono font-bold">{formatTime(timeLeft)}</span>
          </div>
        </div>
        <div className="max-w-4xl mx-auto mt-3">
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1">
            Question {currentIndex + 1} of {questions.length} • {answeredCount} answered
          </p>
        </div>
      </div>

      {/* Question */}
      <div className="max-w-4xl mx-auto p-4 space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg leading-relaxed break-words">
              <span className="text-primary font-bold mr-2">Q{currentIndex + 1}.</span>
              {currentQuestion.question}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5 pt-0">
            {["a", "b", "c", "d"].map((opt) => {
              const optionKey = `option_${opt}` as keyof MCQ;
              const isSelected = answers[currentQuestion.id] === opt;

              return (
                <button
                  key={opt}
                  onClick={() => handleSelectOption(opt)}
                  className={`w-full p-3 sm:p-4 text-left rounded-xl border-2 transition-all ${isSelected
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                    }`}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 ${isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
                        }`}
                    >
                      {opt.toUpperCase()}
                    </span>
                    <span className="flex-1 text-sm sm:text-base pt-1 break-words leading-relaxed">{currentQuestion[optionKey]}</span>
                    {isSelected && <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-1" />}
                  </div>
                </button>
              );
            })}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
            disabled={currentIndex === 0}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>

          {currentIndex === questions.length - 1 ? (
            <Button
              onClick={() => handleSubmit(false)}
              disabled={isSubmitting}
              variant="default"
            >
              {isSubmitting ? "Submitting..." : "Submit Exam"}
            </Button>
          ) : (
            <Button onClick={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}>
              Next
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Question Navigator */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Question Navigator</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {questions.map((q, i) => (
                <button
                  key={q.id}
                  onClick={() => setCurrentIndex(i)}
                  className={`w-10 h-10 rounded-lg text-sm font-medium transition-all ${i === currentIndex
                    ? "bg-primary text-primary-foreground"
                    : answers[q.id]
                      ? "bg-green-100 text-green-800 border border-green-300"
                      : "bg-muted hover:bg-muted/80"
                    }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudentExamInterface;