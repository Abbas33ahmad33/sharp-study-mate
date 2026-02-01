import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { ArrowLeft, Copy, Users, FileText, Clock, Settings, BarChart3 } from "lucide-react";
import { ExamQuestionsManager } from "@/components/institute/ExamQuestionsManager";

interface ExamData {
  id: string;
  title: string;
  description: string | null;
  exam_code: string;
  exam_date: string | null;
  duration_minutes: number;
  is_active: boolean;
  institute_id: string;
}

interface StudentAttempt {
  id: string;
  student_id: string;
  started_at: string;
  completed_at: string | null;
  score: number;
  total_questions: number;
  percentage: number | null;
  is_submitted: boolean;
  profile: {
    full_name: string;
    email: string;
  };
}

const InstituteExamDetails = () => {
  const navigate = useNavigate();
  const { examId } = useParams();
  const { userRole } = useAuth();
  const [loading, setLoading] = useState(true);
  const [exam, setExam] = useState<ExamData | null>(null);
  const [attempts, setAttempts] = useState<StudentAttempt[]>([]);
  const [questionCount, setQuestionCount] = useState(0);
  const [showQuestionsManager, setShowQuestionsManager] = useState(false);
  
  // Edit form
  const [editMode, setEditMode] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [examDate, setExamDate] = useState("");
  const [duration, setDuration] = useState(60);

  useEffect(() => {
    if (userRole !== "institute" && userRole !== "admin") {
      navigate("/");
      return;
    }
    fetchExamData();
  }, [examId, userRole]);

  const fetchExamData = async () => {
    if (!examId) return;

    try {
      // Fetch exam details
      const { data: examData, error } = await supabase
        .from("institute_exams")
        .select("*")
        .eq("id", examId)
        .single();

      if (error) throw error;
      setExam(examData);
      setTitle(examData.title);
      setDescription(examData.description || "");
      setExamDate(examData.exam_date ? examData.exam_date.split("T")[0] : "");
      setDuration(examData.duration_minutes || 60);

      // Fetch question counts
      const [{ count: bankCount }, { count: customCount }] = await Promise.all([
        supabase
          .from("exam_mcqs")
          .select("*", { count: "exact", head: true })
          .eq("exam_id", examId),
        supabase
          .from("institute_mcqs")
          .select("*", { count: "exact", head: true })
          .eq("exam_id", examId),
      ]);
      setQuestionCount((bankCount || 0) + (customCount || 0));

      // Fetch student attempts
      const { data: attemptsData } = await supabase
        .from("exam_attempts")
        .select("*")
        .eq("exam_id", examId)
        .order("started_at", { ascending: false });

      if (attemptsData) {
        const attemptsWithProfiles = await Promise.all(
          attemptsData.map(async (attempt) => {
            const { data: profile } = await supabase
              .from("profiles")
              .select("full_name, email")
              .eq("id", attempt.student_id)
              .single();

            return {
              ...attempt,
              profile: profile || { full_name: "", email: "" },
            };
          })
        );
        setAttempts(attemptsWithProfiles);
      }
    } catch (error) {
      console.error("Error fetching exam:", error);
      toast.error("Failed to load exam details");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exam) return;

    try {
      const { error } = await supabase
        .from("institute_exams")
        .update({
          title,
          description: description || null,
          exam_date: examDate ? new Date(examDate).toISOString() : null,
          duration_minutes: duration,
        })
        .eq("id", exam.id);

      if (error) throw error;
      toast.success("Exam updated!");
      setEditMode(false);
      fetchExamData();
    } catch (error) {
      console.error("Error updating exam:", error);
      toast.error("Failed to update exam");
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Exam not found</p>
      </div>
    );
  }

  if (showQuestionsManager) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6">
        <div className="max-w-5xl mx-auto">
          <ExamQuestionsManager
            examId={exam.id}
            instituteId={exam.institute_id}
            onClose={() => {
              setShowQuestionsManager(false);
              fetchExamData();
            }}
          />
        </div>
      </div>
    );
  }

  const examLink = `${window.location.origin}/auth?exam=${exam.exam_code}`;

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/institute")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{exam.title}</h1>
            <p className="text-muted-foreground">Exam Management</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Questions</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{questionCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Duration</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{exam.duration_minutes} min</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Attempts</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{attempts.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Avg Score</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {attempts.length > 0
                  ? Math.round(
                      attempts
                        .filter((a) => a.is_submitted)
                        .reduce((sum, a) => sum + (a.percentage || 0), 0) /
                        attempts.filter((a) => a.is_submitted).length || 0
                    )
                  : 0}
                %
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Exam Code & Link */}
        <Card>
          <CardHeader>
            <CardTitle>Share Exam</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex-1 p-3 bg-muted rounded-lg font-mono text-sm">
                {exam.exam_code}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(exam.exam_code, "Exam code")}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 p-3 bg-muted rounded-lg text-sm break-all">
                {examLink}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(examLink, "Exam link")}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => setShowQuestionsManager(true)}>
            <FileText className="mr-2 h-4 w-4" />
            Manage Questions ({questionCount})
          </Button>
          <Button variant="outline" onClick={() => navigate(`/institute/exam/${exam.id}/analytics`)}>
            <BarChart3 className="mr-2 h-4 w-4" />
            View Analytics
          </Button>
          <Button variant="outline" onClick={() => setEditMode(!editMode)}>
            <Settings className="mr-2 h-4 w-4" />
            {editMode ? "Cancel Edit" : "Edit Settings"}
          </Button>
        </div>

        {/* Edit Form */}
        {editMode && (
          <Card>
            <CardHeader>
              <CardTitle>Edit Exam Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateExam} className="space-y-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Exam Date</Label>
                    <Input
                      type="date"
                      value={examDate}
                      onChange={(e) => setExamDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Duration (minutes)</Label>
                    <Input
                      type="number"
                      min="5"
                      max="300"
                      value={duration}
                      onChange={(e) => setDuration(Number(e.target.value))}
                    />
                  </div>
                </div>
                <Button type="submit">Save Changes</Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Student Attempts */}
        <Card>
          <CardHeader>
            <CardTitle>Student Attempts</CardTitle>
          </CardHeader>
          <CardContent className="p-0 sm:p-6">
            {attempts.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead className="hidden md:table-cell">Started</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Score</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attempts.map((attempt) => (
                      <TableRow key={attempt.id}>
                        <TableCell>
                          <div>{attempt.profile.full_name}</div>
                          <div className="text-xs text-muted-foreground">
                            {attempt.profile.email}
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm">
                          {new Date(attempt.started_at).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`text-xs px-2 py-1 rounded ${
                              attempt.is_submitted
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {attempt.is_submitted ? "Submitted" : "In Progress"}
                          </span>
                        </TableCell>
                        <TableCell>
                          {attempt.is_submitted
                            ? `${attempt.score}/${attempt.total_questions} (${Math.round(attempt.percentage || 0)}%)`
                            : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No students have attempted this exam yet
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InstituteExamDetails;