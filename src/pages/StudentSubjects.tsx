import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Award, RotateCcw, GraduationCap, School, Clock, CheckCircle, Play, ChevronRight, Lightbulb, ChevronDown, BookOpen, Target, Sparkles, Zap, Trophy, BarChart3, Atom, FlaskConical, Dna, Calculator } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import JoinInstituteDialog from "@/components/student/JoinInstituteDialog";
import SubjectCard from "@/components/student/SubjectCard";
import InstituteCard from "@/components/student/InstituteCard";
import ExamCard from "@/components/student/ExamCard";
import AppNavbar from "@/components/AppNavbar";
import BottomNav from "@/components/BottomNav";
import { cn } from "@/lib/utils";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import { Skeleton } from "@/components/ui/skeleton";

const SubjectsSkeleton = () => (
  <div className="space-y-8 animate-pulse">
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48 rounded-lg animate-shimmer-loading" />
        <Skeleton className="h-4 w-64 rounded-lg animate-shimmer-loading" />
      </div>
      <Skeleton className="h-10 w-32 rounded-xl animate-shimmer-loading" />
    </div>
    <div className="grid grid-cols-2 gap-4">
      <Skeleton className="h-32 rounded-[2rem] animate-shimmer-loading" />
      <Skeleton className="h-32 rounded-[2rem] animate-shimmer-loading" />
    </div>
    <Skeleton className="h-24 rounded-2xl animate-shimmer-loading" />
    <Skeleton className="h-24 rounded-2xl animate-shimmer-loading" />
    <div className="pt-4 space-y-4">
      <div className="flex items-center gap-4">
        <Skeleton className="w-12 h-12 rounded-2xl animate-shimmer-loading" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-32 rounded-lg animate-shimmer-loading" />
          <Skeleton className="h-4 w-48 rounded-lg animate-shimmer-loading" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} className="h-64 rounded-[2rem] animate-shimmer-loading" />
        ))}
      </div>
    </div>
  </div>
);

interface Subject {
  id: string;
  name: string;
  description: string | null;
  chapters: Chapter[];
  totalQuestions?: number;
  totalAttempts?: number;
  avgProgress?: number;
}

interface Chapter {
  id: string;
  name: string;
  description: string | null;
  key_points: string[] | null;
  mcq_count?: number;
  progress?: number;
  attempts_count?: number;
  best_score?: number;
  latest_score?: number;
}

// Subject icon colors for visual variety - enhanced with more professional gradients


const StudentSubjects = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [stats, setStats] = useState({ totalTests: 0, avgScore: 0 });
  const [instituteExams, setInstituteExams] = useState<any[]>([]);
  const [myInstitutes, setMyInstitutes] = useState<any[]>([]);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [personalColors, setPersonalColors] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('subject_colors');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const updateColor = useCallback((subjectId: string, colorIndex: number) => {
    setPersonalColors(prev => {
      const newColors = { ...prev, [subjectId]: colorIndex };
      localStorage.setItem('subject_colors', JSON.stringify(newColors));
      return newColors;
    });
    toast.success("Theme updated!");
  }, []);

  // Memoized fetch functions for better performance
  const fetchInstituteExams = useCallback(async () => {
    if (!user) return;

    const { data: studentInstitutes } = await supabase
      .from("institute_students")
      .select("institute_id")
      .eq("student_id", user.id)
      .eq("is_approved", true);

    if (studentInstitutes && studentInstitutes.length > 0) {
      const instituteIds = studentInstitutes.map(si => si.institute_id);

      const { data: exams } = await supabase
        .from("institute_exams")
        .select("*, institutes(name)")
        .in("institute_id", instituteIds)
        .eq("is_active", true)
        .order("exam_date", { ascending: false });

      setInstituteExams(exams || []);
    }
  }, [user]);

  const fetchMyInstitutes = useCallback(async () => {
    if (!user) return;

    const { data } = await supabase
      .from("institute_students")
      .select("id, is_approved, joined_at, institutes(id, name, institute_code)")
      .eq("student_id", user.id)
      .order("joined_at", { ascending: false });

    setMyInstitutes(data || []);
  }, [user]);

  // Optimized data fetching - fetch all data in parallel with fewer queries
  const fetchSubjectsWithChapters = useCallback(async () => {
    if (!user) return;

    try {
      // Fetch all data in parallel for better performance
      // OPTIMIZATION: Removed separate mcqs query (select * from mcqs) which was reading 3000+ rows
      // consistently. Added `mcqs(count)` to chapters query to get the aggregate directly.
      const [subjectsResult, chaptersResult, attemptsResult] = await Promise.all([
        supabase.from("subjects").select("id, name, description").order("name"),
        supabase.from("chapters").select("id, name, description, key_points, subject_id, mcqs(count)").order("order_index"),
        supabase.from("test_attempts").select("id, chapter_id, percentage, completed_at").eq("student_id", user.id).order("completed_at", { ascending: false })
      ]);

      const subjectsData = subjectsResult.data || [];
      const chaptersData = chaptersResult.data || [];
      const attemptsData = attemptsResult.data || [];

      // Create lookup maps for O(1) access
      const attemptsByChapter = new Map<string, typeof attemptsData>();
      attemptsData.forEach(attempt => {
        if (!attemptsByChapter.has(attempt.chapter_id)) {
          attemptsByChapter.set(attempt.chapter_id, []);
        }
        attemptsByChapter.get(attempt.chapter_id)!.push(attempt);
      });

      // Build subjects with chapters
      const subjectsWithChapters = subjectsData.map(subject => {
        const subjectChapters = chaptersData.filter(ch => ch.subject_id === subject.id);

        const chaptersWithStats = subjectChapters.map(chapter => {
          // Access the aggregated count from relation
          // @ts-ignore - access runtime relationship property
          const mcq_count = chapter.mcqs?.[0]?.count || 0;
          const chapterAttempts = attemptsByChapter.get(chapter.id) || [];

          let progress = 0;
          let attempts_count = chapterAttempts.length;
          let best_score = 0;
          let latest_score = 0;

          if (attempts_count > 0) {
            latest_score = Number(chapterAttempts[0].percentage);
            best_score = Math.max(...chapterAttempts.map(a => Number(a.percentage)));
            progress = chapterAttempts.reduce((sum, a) => sum + Number(a.percentage), 0) / attempts_count;
          }

          return {
            id: chapter.id,
            name: chapter.name,
            description: chapter.description,
            key_points: chapter.key_points,
            mcq_count,
            progress,
            attempts_count,
            best_score,
            latest_score
          };
        });

        const totalQuestions = chaptersWithStats.reduce((sum, ch) => sum + (ch.mcq_count || 0), 0);
        const totalAttempts = chaptersWithStats.reduce((sum, ch) => sum + (ch.attempts_count || 0), 0);
        const avgProgress = chaptersWithStats.length > 0
          ? chaptersWithStats.reduce((sum, ch) => sum + (ch.progress || 0), 0) / chaptersWithStats.length
          : 0;

        return {
          ...subject,
          chapters: chaptersWithStats,
          totalQuestions,
          totalAttempts,
          avgProgress
        };
      });

      setSubjects(subjectsWithChapters);
    } catch (error) {
      console.error("Error fetching subjects:", error);
    }
  }, [user]);

  const fetchStudentStats = useCallback(async () => {
    if (!user) return;

    const { data: attempts } = await supabase
      .from("test_attempts")
      .select("percentage")
      .eq("student_id", user.id);

    if (attempts && attempts.length > 0) {
      const avgScore = attempts.reduce((sum, a) => sum + Number(a.percentage), 0) / attempts.length;
      setStats({ totalTests: attempts.length, avgScore: Math.round(avgScore) });
    }
  }, [user]);

  // Initial data fetch
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([
        fetchSubjectsWithChapters(),
        fetchStudentStats(),
        fetchInstituteExams(),
        fetchMyInstitutes()
      ]);
      setIsLoading(false);
    };

    if (user) {
      loadData();
    }
  }, [user, fetchSubjectsWithChapters, fetchStudentStats, fetchInstituteExams, fetchMyInstitutes]);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      <AppNavbar />

      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-6 space-y-6 pb-32">
          {isLoading ? (
            <SubjectsSkeleton />
          ) : (
            <>
              {/* Welcome Header */}
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                <div className="animate-fade-in">
                  <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Welcome back! 👋</h2>
                  <p className="text-muted-foreground mt-1">Continue your learning journey</p>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="h-1 w-1 rounded-full bg-primary animate-pulse" />
                    <p className="text-sm font-semibold bg-gradient-to-r from-primary via-purple-600 to-primary bg-clip-text text-transparent">
                      Small Steps. Big Success
                    </p>
                    <div className="h-1 w-1 rounded-full bg-primary animate-pulse" />
                  </div>
                </div>
                <JoinInstituteDialog onJoined={fetchMyInstitutes} />
              </div>

              {/* Stats Cards - Enhanced design */}
              <div className="grid grid-cols-2 gap-4 animate-slide-up">
                <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent shadow-lg shadow-primary/5">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                  <CardContent className="relative p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Tests Taken</p>
                        <p className="text-3xl font-bold mt-2 text-foreground">{stats.totalTests}</p>
                      </div>
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/25 group-active:animate-pop">
                        <TrendingUp className="h-6 w-6 text-primary-foreground" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-success/10 via-success/5 to-transparent shadow-lg shadow-success/5">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-success/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                  <CardContent className="relative p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Avg. Score</p>
                        <p className="text-3xl font-bold mt-2 text-foreground">{stats.avgScore}%</p>
                      </div>
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-success to-success/80 flex items-center justify-center shadow-lg shadow-success/25">
                        <Award className="h-6 w-6 text-success-foreground" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Summary Cards Row - Explicitly requested size/style match */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                {/* My Institutes Summary Card */}
                <div
                  onClick={() => navigate('/student/institutes')}
                  className="relative group cursor-pointer overflow-hidden rounded-xl transition-all duration-300 hover:shadow-lg active:scale-95 shadow-md h-[130px] sm:h-[160px] w-full flex flex-col items-center justify-between text-center p-2.5 bg-gradient-to-br from-indigo-500 to-purple-700"
                >
                  <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                  <div className="absolute bottom-0 left-0 w-12 h-12 bg-black/10 rounded-full blur-xl translate-y-1/2 -translate-x-1/2" />

                  <div className="flex-1 flex items-center justify-center w-full pt-1">
                    <div className="p-2 rounded-full bg-white/10 backdrop-blur-md border border-white/10 shadow-inner group-hover:scale-110 transition-transform duration-500">
                      <School strokeWidth={1.5} className="w-5 h-5 sm:w-6 sm:h-6 text-white drop-shadow-md" />
                    </div>
                  </div>

                  <div className="w-full space-y-1.5 relative z-10">
                    <h3 className="text-xs sm:text-sm font-bold text-white tracking-tight drop-shadow-sm leading-tight line-clamp-1">
                      My Institutes
                    </h3>
                    <p className="text-[8px] text-white/80 font-medium tracking-wide uppercase line-clamp-1">
                      {myInstitutes.length} Joined
                    </p>
                  </div>
                </div>

                {/* Upcoming Exams Summary Card */}
                <div
                  onClick={() => navigate('/student/exams')}
                  className="relative group cursor-pointer overflow-hidden rounded-xl transition-all duration-300 hover:shadow-lg active:scale-95 shadow-md h-[130px] sm:h-[160px] w-full flex flex-col items-center justify-between text-center p-2.5 bg-gradient-to-br from-amber-500 to-orange-600"
                >
                  <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                  <div className="absolute bottom-0 left-0 w-12 h-12 bg-black/10 rounded-full blur-xl translate-y-1/2 -translate-x-1/2" />

                  <div className="flex-1 flex items-center justify-center w-full pt-1">
                    <div className="p-2 rounded-full bg-white/10 backdrop-blur-md border border-white/10 shadow-inner group-hover:scale-110 transition-transform duration-500">
                      <Clock strokeWidth={1.5} className="w-5 h-5 sm:w-6 sm:h-6 text-white drop-shadow-md" />
                    </div>
                  </div>

                  <div className="w-full space-y-1.5 relative z-10">
                    <h3 className="text-xs sm:text-sm font-bold text-white tracking-tight drop-shadow-sm leading-tight line-clamp-1">
                      Upcoming Exams
                    </h3>
                    <p className="text-[8px] text-white/80 font-medium tracking-wide uppercase line-clamp-1">
                      {instituteExams.length} Scheduled
                    </p>
                  </div>
                </div>
              </div>

              {/* Practice MCQs Section - Subject Cards */}
              <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-hero flex items-center justify-center shadow-lg shadow-primary/20">
                    <BookOpen className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl text-foreground">Practice MCQs</h3>
                    <p className="text-sm text-muted-foreground">Select a subject to start practicing</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
                  {subjects.map((subject) => (
                    <div key={subject.id} className="space-y-4">
                      <SubjectCard
                        subject={subject}
                        onClick={() => navigate(`/student/subject/${subject.id}`)}
                      />
                    </div>
                  ))}
                </div>


                {
                  subjects.length === 0 && !isLoading && (
                    <Card className="border-0 shadow-xl">
                      <CardContent className="text-center py-20">
                        <div className="w-20 h-20 rounded-3xl bg-muted/50 flex items-center justify-center mx-auto mb-6">
                          <GraduationCap className="w-10 h-10 text-muted-foreground/50" />
                        </div>
                        <p className="text-xl font-semibold text-muted-foreground">No subjects available yet</p>
                        <p className="text-sm text-muted-foreground/70 mt-2">Check back soon!</p>
                      </CardContent>
                    </Card>
                  )
                }
              </div >

            </>
          )}
        </div >
      </main >


      <BottomNav />
    </div >
  );
};

export default StudentSubjects;
