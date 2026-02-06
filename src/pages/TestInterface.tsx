import { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CheckCircle2, XCircle, ArrowRight, Home, SkipForward } from "lucide-react";
import { toast } from "sonner";
import MathText from "@/components/MathText";

interface MCQ {
  id: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option?: string;
}

const TestInterface = () => {
  const { chapterId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const chapterName = location.state?.chapterName || "Test";

  const [mcqs, setMcqs] = useState<MCQ[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [answers, setAnswers] = useState<Map<string, { mcqId: string; selected: string; correct: string; isCorrect: boolean }>>(new Map());
  const [skippedQuestions, setSkippedQuestions] = useState<Set<number>>(new Set());
  const [testComplete, setTestComplete] = useState(false);
  const [attemptId, setAttemptId] = useState<string | null>(null);

  useEffect(() => {
    fetchMCQs();
  }, [chapterId]);

  const fetchMCQs = async () => {
    if (!chapterId) return;

    const { data, error } = await supabase
      .from("mcqs")
      .select("id, question, option_a, option_b, option_c, option_d")
      .eq("chapter_id", chapterId)
      .order("created_at");

    if (error) {
      toast.error("Failed to load questions");
      navigate("/student");
    } else if (data && data.length > 0) {
      setMcqs(data);
    } else {
      toast.error("No questions available");
      navigate("/student");
    }
  };

  const handleSubmit = async () => {
    if (!selectedOption) {
      toast.error("Please select an option");
      return;
    }

    const currentMCQ = mcqs[currentIndex];

    try {
      // Use secure server-side function to check answer
      const { data: isCorrectAnswer, error } = await supabase
        .rpc("check_answer", {
          _mcq_id: currentMCQ.id,
          _selected_option: selectedOption,
        });

      if (error) throw error;

      setIsCorrect(isCorrectAnswer || false);
      setShowFeedback(true);

      const newAnswers = new Map(answers);
      newAnswers.set(currentMCQ.id, {
        mcqId: currentMCQ.id,
        selected: selectedOption,
        correct: selectedOption,
        isCorrect: isCorrectAnswer || false,
      });
      setAnswers(newAnswers);

      // Remove from skipped if it was skipped before
      if (skippedQuestions.has(currentIndex)) {
        const newSkipped = new Set(skippedQuestions);
        newSkipped.delete(currentIndex);
        setSkippedQuestions(newSkipped);
      }
    } catch (error: any) {
      console.error("Error checking answer:", error);
      toast.error("Failed to verify answer");
    }
  };

  const handleSkip = () => {
    // Add to skipped questions
    const newSkipped = new Set(skippedQuestions);
    newSkipped.add(currentIndex);
    setSkippedQuestions(newSkipped);

    // Move to next unanswered question or first skipped question
    moveToNextQuestion();
  };

  const moveToNextQuestion = () => {
    // Find next unanswered question
    for (let i = currentIndex + 1; i < mcqs.length; i++) {
      if (!answers.has(mcqs[i].id)) {
        setCurrentIndex(i);
        setSelectedOption("");
        setShowFeedback(false);
        return;
      }
    }

    // Wrap around to find skipped questions from beginning
    for (let i = 0; i < currentIndex; i++) {
      if (!answers.has(mcqs[i].id)) {
        setCurrentIndex(i);
        setSelectedOption("");
        setShowFeedback(false);
        return;
      }
    }

    // All questions answered
    finishTest();
  };

  const handleNext = () => {
    moveToNextQuestion();
  };

  const finishTest = async () => {
    await saveTestAttempt();
    setTestComplete(true);
  };

  const getUnansweredCount = () => {
    return mcqs.filter(mcq => !answers.has(mcq.id)).length;
  };

  const goToQuestion = (index: number) => {
    setCurrentIndex(index);
    setSelectedOption("");
    setShowFeedback(false);
  };

  const saveTestAttempt = async () => {
    if (!user || !chapterId) return;

    const allAnswers = Array.from(answers.values());
    const score = allAnswers.filter((a) => a.isCorrect).length;
    const total = mcqs.length;
    const percentage = (score / total) * 100;

    const { data: attempt, error: attemptError } = await supabase
      .from("test_attempts")
      .insert({
        student_id: user.id,
        chapter_id: chapterId,
        score,
        total_questions: total,
        percentage,
      })
      .select()
      .single();

    if (attemptError) {
      toast.error("Failed to save test results");
      return;
    }

    if (attempt) {
      setAttemptId(attempt.id);

      await Promise.all(
        allAnswers.map((answer) =>
          supabase.from("test_answers").insert({
            attempt_id: attempt.id,
            mcq_id: answer.mcqId,
            selected_option: answer.selected,
            is_correct: answer.isCorrect,
          })
        )
      );
    }
  };

  const getScore = () => {
    return Array.from(answers.values()).filter((a) => a.isCorrect).length;
  };

  if (testComplete) {
    const score = getScore();
    const total = mcqs.length;
    const percentage = ((score / total) * 100).toFixed(1);
    const isPassing = parseFloat(percentage) >= 60;

    return (
      <div className="min-h-screen bg-gradient-glow bg-gradient-animated safe-top">
        {/* Results Header */}
        <div className="sticky top-0 z-10 glass-strong border-b border-border/50 px-4 py-3 safe-top">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="font-bold text-lg">Test Complete!</h1>
            <p className="text-sm text-muted-foreground">{chapterName}</p>
          </div>
        </div>

        {/* Results Content */}
        <div className="px-4 py-6 pb-safe">
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Score Card */}
            <Card className={`border-2 overflow-hidden ${isPassing ? 'border-success' : 'border-warning'}`}>
              <div className={`p-6 text-center ${isPassing ? 'bg-success/10' : 'bg-warning/10'}`}>
                <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full mb-4 ${isPassing ? 'bg-success/20' : 'bg-warning/20'}`}>
                  <span className={`text-4xl font-bold ${isPassing ? 'text-success' : 'text-warning'}`}>
                    {percentage}%
                  </span>
                </div>
                <h2 className="text-2xl font-bold mb-1">
                  {isPassing ? "Great Job! 🎉" : "Keep Practicing! 💪"}
                </h2>
                <p className="text-muted-foreground">
                  {score} out of {total} correct answers
                </p>
              </div>
              <CardContent className="p-4">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 rounded-xl bg-success/10">
                    <p className="text-2xl font-bold text-success">{score}</p>
                    <p className="text-xs text-muted-foreground">Correct</p>
                  </div>
                  <div className="p-3 rounded-xl bg-destructive/10">
                    <p className="text-2xl font-bold text-destructive">{total - score - (mcqs.length - answers.size)}</p>
                    <p className="text-xs text-muted-foreground">Wrong</p>
                  </div>
                  <div className="p-3 rounded-xl bg-muted">
                    <p className="text-2xl font-bold text-muted-foreground">{mcqs.length - answers.size}</p>
                    <p className="text-xs text-muted-foreground">Skipped</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Questions Review */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg px-1">Question Review</h3>
              {mcqs.map((mcq, index) => {
                const answer = answers.get(mcq.id);
                const wasSkipped = !answer;

                return (
                  <Card
                    key={mcq.id}
                    className={`border-2 overflow-hidden ${wasSkipped
                      ? "border-muted"
                      : answer.isCorrect
                        ? "border-success"
                        : "border-destructive"
                      }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${wasSkipped
                          ? "bg-muted text-muted-foreground"
                          : answer.isCorrect
                            ? "bg-success text-success-foreground"
                            : "bg-destructive text-destructive-foreground"
                          }`}>
                          {wasSkipped ? (
                            <SkipForward className="w-5 h-5" />
                          ) : answer.isCorrect ? (
                            <CheckCircle2 className="w-5 h-5" />
                          ) : (
                            <XCircle className="w-5 h-5" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm mb-1">Q{index + 1}. {mcq.question}</p>
                          <div className="text-xs space-y-0.5">
                            {wasSkipped ? (
                              <p className="text-muted-foreground">Skipped</p>
                            ) : (
                              <>
                                <p className="text-muted-foreground">
                                  Your answer: <span className="font-semibold">{answer.selected}</span>
                                </p>
                                {!answer.isCorrect && (
                                  <p className="text-destructive font-medium">Incorrect answer</p>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Back Button */}
            <Button
              size="lg"
              onClick={() => navigate("/student")}
              className="w-full h-14 rounded-xl text-base font-semibold shadow-lg"
            >
              <Home className="mr-2 h-5 w-5" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (mcqs.length === 0) {
    return null;
  }

  const currentMCQ = mcqs[currentIndex];
  const answeredCount = answers.size;
  const progress = (answeredCount / mcqs.length) * 100;
  const isCurrentAnswered = answers.has(currentMCQ.id);

  return (
    <div className="min-h-screen bg-gradient-glow bg-gradient-animated flex flex-col safe-top">
      {/* Mobile Header */}
      <div className="sticky top-0 z-10 glass-strong border-b border-border/50 px-4 py-3 safe-top">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/student")}
              className="h-10 w-10 rounded-xl"
            >
              <Home className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="font-bold text-base line-clamp-1">{chapterName}</h1>
              <p className="text-xs text-muted-foreground">
                {answeredCount}/{mcqs.length} answered
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right">
              <p className="text-2xl font-bold text-primary">{currentIndex + 1}</p>
              <p className="text-xs text-muted-foreground">of {mcqs.length}</p>
            </div>
          </div>
        </div>
        <Progress value={progress} className="h-1.5 mt-3" />
      </div>

      {/* Question Content */}
      <div className="flex-1 overflow-y-auto px-4 py-5 pb-safe">
        <div className="max-w-2xl mx-auto space-y-5">
          <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm overflow-hidden">
            <CardContent className="p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0 border border-primary/20 shadow-sm">
                  <span className="font-bold text-lg text-primary">Q{currentIndex + 1}</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl sm:text-2xl font-semibold leading-relaxed tracking-tight text-foreground/90 break-words">
                    <MathText text={currentMCQ.question} />
                  </h3>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Options */}
          <div className="space-y-3">
            {!showFeedback ? (
              <RadioGroup value={selectedOption} onValueChange={setSelectedOption}>
                {["A", "B", "C", "D"].map((option) => (
                  <div
                    key={option}
                    className={`group relative overflow-hidden rounded-2xl border-2 transition-all duration-200 ${selectedOption === option
                      ? 'border-primary bg-primary/5 shadow-md'
                      : 'border-border/50 bg-card hover:border-primary/30 hover:bg-muted/30'
                      }`}
                  >
                    <label
                      htmlFor={`option-${option}`}
                      className="flex items-start gap-4 p-4 sm:p-5 cursor-pointer"
                    >
                      <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-base transition-all shadow-sm ${selectedOption === option
                        ? 'bg-primary text-primary-foreground scale-105'
                        : 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'
                        }`}>
                        {option}
                      </div>
                      <div className="flex-1 pt-1.5 min-w-0">
                        <span className="text-base sm:text-lg leading-relaxed break-words whitespace-pre-wrap">
                          <MathText text={currentMCQ[`option_${option.toLowerCase()}` as keyof MCQ] as string} />
                        </span>
                      </div>
                      <RadioGroupItem value={option} id={`option-${option}`} className="sr-only" />
                    </label>
                  </div>
                ))}
              </RadioGroup>
            ) : (
              <>
                {["A", "B", "C", "D"].map((option) => {
                  const optionText = currentMCQ[`option_${option.toLowerCase()}` as keyof MCQ];
                  const isSelected = selectedOption === option;

                  let borderClass = "border-border/50 bg-card";
                  let iconBg = "bg-muted text-muted-foreground";

                  if (isSelected && isCorrect) {
                    borderClass = "border-success bg-success/5 shadow-md";
                    iconBg = "bg-success text-success-foreground";
                  }
                  if (isSelected && !isCorrect) {
                    borderClass = "border-destructive bg-destructive/5 shadow-md";
                    iconBg = "bg-destructive text-destructive-foreground";
                  }

                  return (
                    <div key={option} className={`rounded-xl border-2 p-4 ${borderClass} transition-all duration-200`}>
                      <div className="flex items-start gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
                          {isSelected && isCorrect && <CheckCircle2 className="w-5 h-5" />}
                          {isSelected && !isCorrect && <XCircle className="w-5 h-5" />}
                          {!isSelected && <span className="font-bold text-sm">{option}</span>}
                        </div>
                        <span className="flex-1 text-sm sm:text-base pt-1 break-words leading-relaxed">
                          <MathText text={optionText} />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>

          {/* Feedback - Simple inline message */}
          {showFeedback && (
            <div className={`text-center py-3 px-4 rounded-xl ${isCorrect ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
              <p className="font-bold text-base">
                {isCorrect ? "Correct! 🎉" : "Incorrect ❌"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Fixed Bottom Actions */}
      <div className="sticky bottom-0 glass-strong border-t border-border/50 p-4 safe-bottom">
        <div className="max-w-2xl mx-auto space-y-3">
          {!showFeedback && !isCurrentAnswered ? (
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="lg"
                onClick={handleSkip}
                className="flex-1 h-14 rounded-xl text-base font-semibold"
              >
                <SkipForward className="mr-2 h-5 w-5" />
                Skip
              </Button>
              <Button
                size="lg"
                onClick={handleSubmit}
                disabled={!selectedOption}
                className="flex-1 h-14 rounded-xl text-base font-semibold shadow-lg"
              >
                Submit Answer
              </Button>
            </div>
          ) : showFeedback ? (
            <Button
              size="lg"
              onClick={handleNext}
              className="w-full h-14 rounded-xl text-base font-semibold shadow-lg"
            >
              {getUnansweredCount() > 1 ? (
                <>
                  Next Question
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              ) : (
                "View Results"
              )}
            </Button>
          ) : (
            <Button
              size="lg"
              onClick={handleNext}
              className="w-full h-14 rounded-xl text-base font-semibold shadow-lg"
            >
              {getUnansweredCount() > 0 ? (
                <>
                  Next Unanswered
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              ) : (
                "View Results"
              )}
            </Button>
          )}

          {skippedQuestions.size > 0 && answeredCount > 0 && !showFeedback && (
            <Button
              variant="secondary"
              size="lg"
              onClick={finishTest}
              className="w-full h-12 rounded-xl font-medium"
            >
              Finish Test ({getUnansweredCount()} skipped)
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestInterface;