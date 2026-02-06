import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Users,
  Clock,
  TrendingUp,
  CheckCircle,
  XCircle,
  BarChart3,
  FileQuestion,
} from "lucide-react";
import { toast } from "sonner";
import MathText from "@/components/MathText";

interface StudentPerformance {
  student_id: string;
  student_name: string;
  student_email: string;
  score: number;
  total_questions: number;
  percentage: number;
  time_taken_minutes: number;
  completed_at: string;
  attempt_id: string;
}

interface QuestionAnalytics {
  mcq_id: string;
  question: string;
  correct_count: number;
  wrong_count: number;
  total_attempts: number;
  success_rate: number;
}

interface ExamDetails {
  id: string;
  title: string;
  description: string;
  exam_code: string;
  exam_date: string;
  chapter_id?: string;
  chapter_name?: string;
}

const ExamAnalytics = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [examDetails, setExamDetails] = useState<ExamDetails | null>(null);
  const [studentPerformances, setStudentPerformances] = useState<StudentPerformance[]>([]);
  const [questionAnalytics, setQuestionAnalytics] = useState<QuestionAnalytics[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [studentAnswers, setStudentAnswers] = useState<any[]>([]);

  useEffect(() => {
    if (examId) {
      fetchExamData();
    }
  }, [examId]);

  const fetchExamData = async () => {
    try {
      // Fetch exam details
      const { data: exam, error: examError } = await supabase
        .from("institute_exams")
        .select("*")
        .eq("id", examId)
        .single();

      if (examError) throw examError;
      setExamDetails(exam);

      // Fetch exam attempts
      const { data: attempts } = await supabase
        .from("exam_attempts")
        .select("*")
        .eq("exam_id", examId)
        .eq("is_submitted", true)
        .order("completed_at", { ascending: false });

      // Fetch student profiles
      const performances: StudentPerformance[] = [];

      for (const attempt of attempts || []) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, email")
          .eq("id", attempt.student_id)
          .single();

        const timeTaken = attempt.started_at && attempt.completed_at
          ? Math.round((new Date(attempt.completed_at).getTime() - new Date(attempt.started_at).getTime()) / 60000)
          : 0;

        performances.push({
          student_id: attempt.student_id,
          student_name: profile?.full_name || "Unknown",
          student_email: profile?.email || "",
          score: attempt.score || 0,
          total_questions: attempt.total_questions,
          percentage: Number(attempt.percentage) || 0,
          time_taken_minutes: timeTaken,
          completed_at: attempt.completed_at || "",
          attempt_id: attempt.id,
        });
      }

      setStudentPerformances(performances);

      // Calculate question-level analytics
      if (attempts && attempts.length > 0) {
        const attemptIds = attempts.map(a => a.id);

        const { data: allAnswers } = await supabase
          .from("exam_answers")
          .select("mcq_id, institute_mcq_id, is_correct")
          .in("attempt_id", attemptIds);

        // Get unique MCQ IDs (both bank and custom)
        const bankMcqIds = [...new Set(allAnswers?.filter(a => a.mcq_id).map(a => a.mcq_id) || [])];
        const customMcqIds = [...new Set(allAnswers?.filter(a => a.institute_mcq_id).map(a => a.institute_mcq_id) || [])];

        const questionStats: QuestionAnalytics[] = [];

        // Process bank MCQs
        for (const mcqId of bankMcqIds) {
          const { data: mcq } = await supabase
            .from("mcqs")
            .select("question")
            .eq("id", mcqId)
            .single();

          const mcqAnswers = allAnswers?.filter(a => a.mcq_id === mcqId) || [];
          const correctCount = mcqAnswers.filter(a => a.is_correct).length;
          const wrongCount = mcqAnswers.filter(a => !a.is_correct).length;
          const totalAttempts = mcqAnswers.length;

          questionStats.push({
            mcq_id: mcqId!,
            question: mcq?.question || "Question not found",
            correct_count: correctCount,
            wrong_count: wrongCount,
            total_attempts: totalAttempts,
            success_rate: totalAttempts > 0 ? (correctCount / totalAttempts) * 100 : 0,
          });
        }

        // Process custom MCQs
        for (const mcqId of customMcqIds) {
          const { data: mcq } = await supabase
            .from("institute_mcqs")
            .select("question")
            .eq("id", mcqId)
            .single();

          const mcqAnswers = allAnswers?.filter(a => a.institute_mcq_id === mcqId) || [];
          const correctCount = mcqAnswers.filter(a => a.is_correct).length;
          const wrongCount = mcqAnswers.filter(a => !a.is_correct).length;
          const totalAttempts = mcqAnswers.length;

          questionStats.push({
            mcq_id: mcqId!,
            question: mcq?.question || "Question not found",
            correct_count: correctCount,
            wrong_count: wrongCount,
            total_attempts: totalAttempts,
            success_rate: totalAttempts > 0 ? (correctCount / totalAttempts) * 100 : 0,
          });
        }

        setQuestionAnalytics(questionStats.sort((a, b) => a.success_rate - b.success_rate));
      }
    } catch (error) {
      console.error("Error fetching exam data:", error);
      toast.error("Failed to load exam analytics");
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentAnswers = async (attemptId: string) => {
    // Fetch bank MCQ answers
    const { data: bankAnswers } = await supabase
      .from("exam_answers")
      .select("*, mcqs:mcq_id(question, option_a, option_b, option_c, option_d, correct_option)")
      .eq("attempt_id", attemptId)
      .not("mcq_id", "is", null);

    // Fetch custom MCQ answers
    const { data: customAnswers } = await supabase
      .from("exam_answers")
      .select("*, institute_mcqs:institute_mcq_id(question, option_a, option_b, option_c, option_d, correct_option)")
      .eq("attempt_id", attemptId)
      .not("institute_mcq_id", "is", null);

    const allAnswers = [
      ...(bankAnswers || []).map((a: any) => ({ ...a, mcqs: a.mcqs })),
      ...(customAnswers || []).map((a: any) => ({ ...a, mcqs: a.institute_mcqs })),
    ];

    setStudentAnswers(allAnswers);
    setSelectedStudent(attemptId);
  };

  const getAverageScore = () => {
    if (studentPerformances.length === 0) return 0;
    return Math.round(
      studentPerformances.reduce((sum, s) => sum + s.percentage, 0) / studentPerformances.length
    );
  };

  const getAverageTime = () => {
    if (studentPerformances.length === 0) return 0;
    return Math.round(
      studentPerformances.reduce((sum, s) => sum + s.time_taken_minutes, 0) / studentPerformances.length
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-3 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex items-center gap-2 sm:gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/institute")} className="h-8 w-8 sm:h-10 sm:w-10">
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-3xl font-bold truncate">{examDetails?.title}</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Exam Analytics</p>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{studentPerformances.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Average Score</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getAverageScore()}%</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Avg. Time Taken</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getAverageTime()} min</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Questions</CardTitle>
              <FileQuestion className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{questionAnalytics.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Student Performance Table */}
        <Card>
          <CardHeader className="px-3 sm:px-6">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Users className="w-4 h-4 sm:w-5 sm:h-5" />
              Student Performance
            </CardTitle>
            <CardDescription className="text-sm">Individual student scores and time taken</CardDescription>
          </CardHeader>
          <CardContent className="p-0 sm:p-6">
            {studentPerformances.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No students have completed this exam yet
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[120px]">Name</TableHead>
                      <TableHead className="min-w-[150px] hidden md:table-cell">Email</TableHead>
                      <TableHead className="min-w-[70px]">Score</TableHead>
                      <TableHead className="min-w-[130px]">Progress</TableHead>
                      <TableHead className="min-w-[70px] hidden sm:table-cell">Time</TableHead>
                      <TableHead className="min-w-[90px] hidden lg:table-cell">Date</TableHead>
                      <TableHead className="min-w-[80px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {studentPerformances.map((student) => (
                      <TableRow key={student.attempt_id}>
                        <TableCell className="font-medium text-sm">
                          <div>{student.student_name}</div>
                          <div className="text-xs text-muted-foreground md:hidden">{student.student_email}</div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm">{student.student_email}</TableCell>
                        <TableCell className="text-sm">
                          {student.score}/{student.total_questions}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 sm:gap-2">
                            <Progress value={student.percentage} className="w-12 sm:w-20 h-2" />
                            <span className={`text-xs sm:text-sm ${student.percentage >= 60 ? "text-green-600" : "text-red-600"}`}>
                              {student.percentage.toFixed(0)}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-sm">{student.time_taken_minutes}m</TableCell>
                        <TableCell className="hidden lg:table-cell text-sm">
                          {new Date(student.completed_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => fetchStudentAnswers(student.attempt_id)}
                            className="text-xs"
                          >
                            Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Question-by-Question Analytics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Question Analytics
            </CardTitle>
            <CardDescription>Success rate for each question (sorted by difficulty)</CardDescription>
          </CardHeader>
          <CardContent>
            {questionAnalytics.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No question data available
              </div>
            ) : (
              <div className="space-y-4">
                {questionAnalytics.map((q, index) => (
                  <div key={q.mcq_id} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-muted-foreground">Question {index + 1}</span>
                        <p className="font-medium break-words leading-relaxed">
                          <MathText text={q.question} />
                        </p>
                      </div>
                      <Badge variant={q.success_rate >= 60 ? "default" : "destructive"}>
                        {q.success_rate.toFixed(1)}% success
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-3">
                      <Progress value={q.success_rate} className="flex-1 h-2" />
                      <div className="flex gap-4 text-sm">
                        <span className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          {q.correct_count}
                        </span>
                        <span className="flex items-center gap-1 text-red-600">
                          <XCircle className="w-4 h-4" />
                          {q.wrong_count}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Student Answer Details Modal */}
        {selectedStudent && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Student Answer Details</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setSelectedStudent(null)}>
                Close
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {studentAnswers.map((answer, index) => (
                  <div
                    key={answer.id}
                    className={`p-4 rounded-lg border-2 ${answer.is_correct ? "border-green-500 bg-green-50" : "border-red-500 bg-red-50"
                      }`}
                  >
                    <div className="flex items-start gap-3">
                      {answer.is_correct ? (
                        <CheckCircle className="w-5 h-5 text-green-600 mt-1" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600 mt-1" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium mb-2 break-words leading-relaxed">
                          Q{index + 1}: <MathText text={answer.mcqs?.question} />
                        </p>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Selected: </span>
                            <span className="font-medium">{answer.selected_option}</span>
                          </div>
                          {!answer.is_correct && (
                            <div>
                              <span className="text-muted-foreground">Correct: </span>
                              <span className="font-medium text-green-600">
                                {answer.mcqs?.correct_option}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ExamAnalytics;
