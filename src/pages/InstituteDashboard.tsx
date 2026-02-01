import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Users,
  FileText,
  Copy,
  CheckCircle,
  XCircle,
  Link as LinkIcon,
} from "lucide-react";
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
import AppNavbar from "@/components/AppNavbar";

interface InstituteData {
  id: string;
  name: string;
  institute_code: string;
}

interface Student {
  id: string;
  student_id: string;
  is_approved: boolean;
  profiles: {
    full_name: string;
    email: string;
    mobile_number: string;
  };
}

interface Exam {
  id: string;
  title: string;
  description: string;
  exam_code: string;
  exam_date: string;
  is_active: boolean;
  _count?: {
    enrollments: number;
  };
}

const InstituteDashboard = () => {
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [instituteData, setInstituteData] = useState<InstituteData | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  
  // Exam creation form
  const [examTitle, setExamTitle] = useState("");
  const [examDescription, setExamDescription] = useState("");
  const [examDate, setExamDate] = useState("");

  useEffect(() => {
    fetchInstituteData();
  }, []);

  const fetchInstituteData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch institute data
      const { data: institute } = await supabase
        .from("institutes")
        .select("*")
        .eq("created_by", user.id)
        .single();

      if (institute) {
        setInstituteData(institute);
        await Promise.all([
          fetchStudents(institute.id),
          fetchExams(institute.id),
        ]);
      }
    } catch (error) {
      console.error("Error fetching institute data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async (instituteId: string) => {
    const { data, error } = await supabase
      .from("institute_students")
      .select("id, student_id, is_approved")
      .eq("institute_id", instituteId)
      .order("joined_at", { ascending: false });

    if (error) {
      console.error("Error fetching students:", error);
      return;
    }

    // Fetch profile data for each student
    const studentsWithProfiles = await Promise.all(
      (data || []).map(async (student) => {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, email, mobile_number")
          .eq("id", student.student_id)
          .single();

        return {
          ...student,
          profiles: profile || { full_name: "", email: "", mobile_number: "" },
        };
      })
    );

    setStudents(studentsWithProfiles);
  };

  const fetchExams = async (instituteId: string) => {
    const { data, error } = await supabase
      .from("institute_exams")
      .select("*")
      .eq("institute_id", instituteId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching exams:", error);
      return;
    }

    // Get enrollment counts for each exam
    const examsWithCounts = await Promise.all(
      (data || []).map(async (exam) => {
        const { count } = await supabase
          .from("exam_enrollments")
          .select("*", { count: "exact", head: true })
          .eq("exam_id", exam.id);

        return {
          ...exam,
          _count: { enrollments: count || 0 },
        };
      })
    );

    setExams(examsWithCounts);
  };

  const handleApproveStudent = async (studentRecordId: string, isApproved: boolean) => {
    try {
      const { error } = await supabase
        .from("institute_students")
        .update({ is_approved: !isApproved })
        .eq("id", studentRecordId);

      if (error) throw error;
      
      toast.success(isApproved ? "Student access revoked" : "Student approved!");
      if (instituteData) {
        fetchStudents(instituteData.id);
      }
    } catch (error) {
      console.error("Error updating student:", error);
      toast.error("Failed to update student status");
    }
  };

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instituteData) return;

    try {
      const { data: examCodeData } = await supabase.rpc("generate_exam_code");
      const { data: { user } } = await supabase.auth.getUser();

      const { data: newExam, error } = await supabase.from("institute_exams").insert({
        institute_id: instituteData.id,
        title: examTitle,
        description: examDescription,
        exam_code: examCodeData,
        exam_date: examDate ? new Date(examDate).toISOString() : null,
        created_by: user!.id,
      }).select().single();

      if (error) throw error;

      toast.success("Exam created! Now add questions to your exam.");
      setExamTitle("");
      setExamDescription("");
      setExamDate("");
      
      // Navigate to exam details to add questions
      navigate(`/institute/exam/${newExam.id}`);
    } catch (error) {
      console.error("Error creating exam:", error);
      toast.error("Failed to create exam");
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const studentInviteLink = instituteData
    ? `${window.location.origin}/auth?institute=${instituteData.institute_code}`
    : "";

  return (
    <div className="min-h-screen bg-background">
      <AppNavbar />
      
      <div className="p-3 sm:p-6">
        <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <div>
              <h1 className="text-xl sm:text-3xl font-bold">{instituteData?.name}</h1>
              <p className="text-sm sm:text-base text-muted-foreground">Institute Dashboard</p>
            </div>
          </div>

        {/* Institute Code Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LinkIcon className="w-5 h-5" />
              Institute Invite Link
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="flex-1 p-3 bg-muted rounded-lg font-mono text-sm">
                  {instituteData?.institute_code}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    copyToClipboard(instituteData?.institute_code || "", "Institute code")
                  }
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 p-3 bg-muted rounded-lg text-sm break-all">
                  {studentInviteLink}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(studentInviteLink, "Invite link")}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{students.length}</div>
              <p className="text-xs text-muted-foreground">
                {students.filter((s) => s.is_approved).length} approved
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Exams</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{exams.length}</div>
              <p className="text-xs text-muted-foreground">
                {exams.filter((e) => e.is_active).length} active
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="students" className="space-y-4">
          <TabsList className="w-full flex overflow-x-auto">
            <TabsTrigger value="students" className="flex-1 min-w-fit text-xs sm:text-sm">Students</TabsTrigger>
            <TabsTrigger value="exams" className="flex-1 min-w-fit text-xs sm:text-sm">Exams</TabsTrigger>
            <TabsTrigger value="create-exam" className="flex-1 min-w-fit text-xs sm:text-sm">Create Exam</TabsTrigger>
          </TabsList>

          <TabsContent value="students">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">Student Management</CardTitle>
              </CardHeader>
              <CardContent className="p-0 sm:p-6">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[120px]">Name</TableHead>
                        <TableHead className="min-w-[150px] hidden sm:table-cell">Email</TableHead>
                        <TableHead className="min-w-[100px] hidden md:table-cell">Mobile</TableHead>
                        <TableHead className="min-w-[100px]">Status</TableHead>
                        <TableHead className="min-w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell className="text-sm">
                            <div>{student.profiles?.full_name}</div>
                            <div className="text-xs text-muted-foreground sm:hidden">{student.profiles?.email}</div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-sm">{student.profiles?.email}</TableCell>
                          <TableCell className="hidden md:table-cell text-sm">{student.profiles?.mobile_number}</TableCell>
                          <TableCell>
                            {student.is_approved ? (
                              <span className="flex items-center gap-1 text-green-600 text-xs sm:text-sm">
                                <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                                <span className="hidden sm:inline">Approved</span>
                                <span className="sm:hidden">OK</span>
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-yellow-600 text-xs sm:text-sm">
                                <XCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                                Pending
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant={student.is_approved ? "destructive" : "default"}
                              onClick={() =>
                                handleApproveStudent(student.id, student.is_approved)
                              }
                              className="text-xs"
                            >
                              {student.is_approved ? "Revoke" : "Approve"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="exams">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">Exam Management</CardTitle>
              </CardHeader>
              <CardContent className="p-0 sm:p-6">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[120px]">Title</TableHead>
                        <TableHead className="min-w-[130px]">Exam Code</TableHead>
                        <TableHead className="min-w-[80px] hidden sm:table-cell">Date</TableHead>
                        <TableHead className="min-w-[80px] hidden md:table-cell">Students</TableHead>
                        <TableHead className="min-w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {exams.map((exam) => (
                        <TableRow key={exam.id}>
                          <TableCell className="font-medium text-sm">{exam.title}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <code className="text-xs">{exam.exam_code}</code>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={() =>
                                  copyToClipboard(
                                    `${window.location.origin}/auth?exam=${exam.exam_code}&institute=${instituteData?.institute_code}`,
                                    "Exam invite link"
                                  )
                                }
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-sm">
                            {exam.exam_date
                              ? new Date(exam.exam_date).toLocaleDateString()
                              : "N/A"}
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-sm">
                            {exam._count?.enrollments || 0}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => navigate(`/institute/exam/${exam.id}`)}
                              className="text-xs"
                            >
                              Manage
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="create-exam">
            <Card>
              <CardHeader>
                <CardTitle>Create New Exam</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateExam} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="exam-title">Exam Title</Label>
                    <Input
                      id="exam-title"
                      placeholder="Mid-Term Exam 2024"
                      value={examTitle}
                      onChange={(e) => setExamTitle(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="exam-description">Description</Label>
                    <Textarea
                      id="exam-description"
                      placeholder="Exam details and instructions..."
                      value={examDescription}
                      onChange={(e) => setExamDescription(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="exam-date">Exam Date</Label>
                    <Input
                      id="exam-date"
                      type="datetime-local"
                      value={examDate}
                      onChange={(e) => setExamDate(e.target.value)}
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    Create Exam
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        </div>
      </div>
    </div>
  );
};

export default InstituteDashboard;