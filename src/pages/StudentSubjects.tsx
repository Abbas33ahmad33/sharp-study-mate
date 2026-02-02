import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Award, RotateCcw, GraduationCap, School, Clock, CheckCircle, Play, ChevronRight, Lightbulb, ChevronDown, BookOpen, Target, Sparkles, Zap, Trophy, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import JoinInstituteDialog from "@/components/student/JoinInstituteDialog";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
const subjectColors = [
  {
    bg: "bg-primary/[0.03] dark:bg-primary/[0.05]",
    icon: "text-primary",
    accent: "bg-primary",
    border: "border-primary/20",
    glow: "shadow-primary/5"
  },
  {
    bg: "bg-indigo-500/[0.03] dark:bg-indigo-500/[0.05]",
    icon: "text-indigo-500",
    accent: "bg-indigo-500",
    border: "border-indigo-500/20",
    glow: "shadow-indigo-500/5"
  },
  {
    bg: "bg-teal-500/[0.03] dark:bg-teal-500/[0.05]",
    icon: "text-teal-500",
    accent: "bg-teal-500",
    border: "border-teal-500/20",
    glow: "shadow-teal-500/5"
  },
  {
    bg: "bg-emerald-500/[0.03] dark:bg-emerald-500/[0.05]",
    icon: "text-emerald-500",
    accent: "bg-emerald-500",
    border: "border-emerald-500/20",
    glow: "shadow-emerald-500/5"
  },
  {
    bg: "bg-amber-500/[0.03] dark:bg-amber-500/[0.05]",
    icon: "text-amber-500",
    accent: "bg-amber-500",
    border: "border-amber-500/20",
    glow: "shadow-amber-500/5"
  },
  {
    bg: "bg-rose-500/[0.03] dark:bg-rose-500/[0.05]",
    icon: "text-rose-500",
    accent: "bg-rose-500",
    border: "border-rose-500/20",
    glow: "shadow-rose-500/5"
  },
];

const StudentSubjects = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [stats, setStats] = useState({ totalTests: 0, avgScore: 0 });
  const [resetChapterId, setResetChapterId] = useState<string | null>(null);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [instituteExams, setInstituteExams] = useState<any[]>([]);
  const [myInstitutes, setMyInstitutes] = useState<any[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [showKeyPointsDialog, setShowKeyPointsDialog] = useState(false);
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);
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

  const handleStartTest = useCallback((chapter: Chapter) => {
    if (chapter.key_points && chapter.key_points.length > 0) {
      setSelectedChapter(chapter);
      setShowKeyPointsDialog(true);
    } else {
      navigate(`/test/${chapter.id}`, { state: { chapterName: chapter.name } });
    }
  }, [navigate]);

  const handleResetChapter = useCallback((chapterId: string) => {
    setResetChapterId(chapterId);
    setShowResetDialog(true);
  }, []);

  const confirmResetChapter = async () => {
    if (!user || !resetChapterId) return;

    try {
      const { data: attempts, error: fetchError } = await supabase
        .from("test_attempts")
        .select("id")
        .eq("student_id", user.id)
        .eq("chapter_id", resetChapterId);

      if (fetchError) throw fetchError;

      if (attempts && attempts.length > 0) {
        const attemptIds = attempts.map(a => a.id);

        const { error: answersError } = await supabase
          .from("test_answers")
          .delete()
          .in("attempt_id", attemptIds);

        if (answersError) throw answersError;

        const { error: attemptsError } = await supabase
          .from("test_attempts")
          .delete()
          .eq("student_id", user.id)
          .eq("chapter_id", resetChapterId);

        if (attemptsError) throw attemptsError;

        toast.success("Progress reset successfully!");

        setShowResetDialog(false);
        setResetChapterId(null);

        // Refresh data
        await Promise.all([fetchSubjectsWithChapters(), fetchStudentStats()]);
      } else {
        toast.info("No progress to reset for this chapter.");
        setShowResetDialog(false);
        setResetChapterId(null);
      }
    } catch (error: any) {
      console.error("Error resetting chapter:", error);
      toast.error("Failed to reset progress");
      setShowResetDialog(false);
      setResetChapterId(null);
    }
  };

  const getSubjectColor = useCallback((index: number) => subjectColors[index % subjectColors.length], []);

  // Memoized chapter card component for better performance
  const ChapterCard = useMemo(() => ({ chapter, onStart, onReset }: { chapter: Chapter; onStart: () => void; onReset: () => void }) => {
    const hasProgress = chapter.attempts_count !== undefined && chapter.attempts_count > 0;
    const progressPercent = Math.round(chapter.progress || 0);

    return (
      <div className="group relative rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-primary/50 hover:shadow-md transition-all duration-300 overflow-hidden">
        <div className="p-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                <h4 className="font-bold text-lg text-slate-900 dark:text-slate-100 truncate">{chapter.name}</h4>
              </div>

              <div className="flex items-center gap-4 text-xs font-medium text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5" />
                  {chapter.mcq_count} MCQs
                </span>
                {hasProgress && (
                  <span className="flex items-center gap-1 text-primary">
                    <CheckCircle className="w-3.5 h-3.5" />
                    {progressPercent}% Score
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={onStart}
                disabled={!chapter.mcq_count || chapter.mcq_count === 0}
                size="sm"
                className={cn(
                  "h-10 px-5 rounded-xl font-bold transition-all active:scale-95",
                  chapter.mcq_count === 0
                    ? "bg-slate-100 text-slate-400 dark:bg-slate-800"
                    : "bg-primary text-white hover:shadow-lg shadow-primary/20"
                )}
              >
                {chapter.mcq_count === 0 ? "Locked" : "Start"}
              </Button>
              {hasProgress && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onReset}
                  className="h-10 w-10 rounded-xl text-slate-400 hover:text-destructive hover:bg-destructive/5"
                >
                  <RotateCcw className="h-4.5 w-4.5" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }, []);

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

              {/* My Institutes Section - Enhanced Collapsible */}
              {myInstitutes.length > 0 && (
                <Collapsible
                  open={expandedSubject === 'my-institutes'}
                  onOpenChange={(open) => setExpandedSubject(open ? 'my-institutes' : null)}
                  className="animate-slide-up"
                  style={{ animationDelay: '0.1s' }}
                >
                  <Card className={`overflow-hidden transition-all duration-300 border-0 shadow-xl ${expandedSubject === 'my-institutes' ? 'shadow-primary/20' : 'shadow-card/20'
                    }`}>
                    <CollapsibleTrigger asChild>
                      <button type="button" className="w-full text-left cursor-pointer transition-all duration-300 hover:bg-muted/20">
                        <div className="p-5 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-md">
                                <School className="w-6 h-6 text-primary-foreground" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="font-bold text-lg text-foreground">My Institutes</h3>
                                  <Badge className="bg-primary/20 text-primary border-0 h-6 font-semibold">
                                    {myInstitutes.length}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mt-0.5">
                                  Institutes you are enrolled in
                                </p>
                              </div>
                            </div>
                            <div className={`w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center transition-transform duration-300 ${expandedSubject === 'my-institutes' ? 'rotate-180' : ''}`}>
                              <ChevronDown className="w-5 h-5" />
                            </div>
                          </div>
                        </div>
                      </button>
                    </CollapsibleTrigger>

                    <CollapsibleContent className="animate-accordion-down">
                      <CardContent className="pt-4 pb-5 space-y-3 border-t border-border/50">
                        {myInstitutes.map((enrollment) => (
                          <div key={enrollment.id} className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 border border-border/50 hover:border-primary/30 transition-colors">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-xl bg-gradient-hero flex items-center justify-center shadow-sm">
                                <School className="w-6 h-6 text-primary-foreground" />
                              </div>
                              <div>
                                <p className="font-semibold text-foreground">{enrollment.institutes?.name}</p>
                                <p className="text-sm text-muted-foreground font-mono">
                                  {enrollment.institutes?.institute_code}
                                </p>
                              </div>
                            </div>
                            {enrollment.is_approved ? (
                              <Badge className="bg-success/10 text-success border-success/20 gap-1.5 px-3 py-1.5 font-medium">
                                <CheckCircle className="w-3.5 h-3.5" />
                                Approved
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="gap-1.5 px-3 py-1.5 font-medium">
                                <Clock className="w-3.5 h-3.5" />
                                Pending
                              </Badge>
                            )}
                          </div>
                        ))}
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              )}

              {/* Institute Exams Section - Collapsible Card */}
              {instituteExams.length > 0 && (
                <Collapsible
                  open={expandedSubject === 'upcoming-exams'}
                  onOpenChange={(open) => setExpandedSubject(open ? 'upcoming-exams' : null)}
                  className="animate-slide-up"
                  style={{ animationDelay: '0.15s' }}
                >
                  <Card className={`overflow-hidden transition-all duration-300 border-0 shadow-xl ${expandedSubject === 'upcoming-exams' ? 'shadow-secondary/20' : 'shadow-card/20'
                    }`}>
                    <CollapsibleTrigger asChild>
                      <button type="button" className="w-full text-left cursor-pointer transition-all duration-300 hover:bg-muted/20">
                        <div className="p-5 bg-gradient-to-br from-secondary/10 via-secondary/5 to-transparent">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-secondary to-secondary/80 flex items-center justify-center shadow-md">
                                <Clock className="w-6 h-6 text-secondary-foreground" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="font-bold text-lg text-foreground">Upcoming Exams</h3>
                                  <Badge className="bg-secondary/20 text-secondary border-0 h-6 font-semibold">
                                    {instituteExams.length}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mt-0.5">
                                  Exams from your joined institutes
                                </p>
                              </div>
                            </div>
                            <div className={`w-10 h-10 rounded-xl bg-secondary/20 text-secondary flex items-center justify-center transition-transform duration-300 ${expandedSubject === 'upcoming-exams' ? 'rotate-180' : ''}`}>
                              <ChevronDown className="w-5 h-5" />
                            </div>
                          </div>
                        </div>
                      </button>
                    </CollapsibleTrigger>

                    <CollapsibleContent className="animate-accordion-down">
                      <CardContent className="pt-4 pb-5 space-y-3 border-t border-border/50">
                        {instituteExams.map((exam) => (
                          <div
                            key={exam.id}
                            className="p-4 rounded-2xl bg-muted/30 border border-border/50 hover:border-secondary/30 hover:bg-muted/50 transition-all"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-foreground">{exam.title}</h4>
                                <p className="text-sm text-muted-foreground mt-0.5">{exam.institutes?.name}</p>
                                <div className="flex flex-wrap gap-2 mt-3">
                                  {exam.exam_date && (
                                    <Badge variant="outline" className="text-xs h-6 gap-1.5 font-medium">
                                      <Clock className="w-3 h-3" />
                                      {new Date(exam.exam_date).toLocaleDateString()}
                                    </Badge>
                                  )}
                                  {exam.duration_minutes && (
                                    <Badge variant="outline" className="text-xs h-6 font-medium">
                                      {exam.duration_minutes} min
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <Button
                                size="sm"
                                className="shrink-0 h-10 px-4 gap-1.5 font-semibold shadow-sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/exam/${exam.id}`);
                                }}
                              >
                                <Play className="w-4 h-4" />
                                Start
                              </Button>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              )}

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

                <div className="grid gap-5">
                  {subjects.map((subject, subjectIndex) => {
                    const appliedColorIndex = personalColors[subject.id] ?? subjectIndex;
                    const colorScheme = getSubjectColor(appliedColorIndex);
                    const isExpanded = expandedSubject === subject.id;

                    return (
                      <Collapsible
                        key={subject.id}
                        open={isExpanded}
                        onOpenChange={(open) => setExpandedSubject(open ? subject.id : null)}
                      >
                        <Card
                          className={cn(
                            "group relative transition-all duration-500 border-2 shadow-sm overflow-hidden animate-slide-up bg-white dark:bg-slate-900 active:scale-[0.98] cursor-pointer",
                            colorScheme.bg,
                            isExpanded
                              ? cn("shadow-xl sm:shadow-2xl rounded-[2rem] scale-[1.01] ring-2", colorScheme.border, colorScheme.border.replace('border-', 'ring-'))
                              : cn("hover:shadow-md rounded-2xl hover:border-primary/50", colorScheme.border)
                          )}
                          style={{ animationDelay: `${0.1 + subjectIndex * 0.1}s` }}
                        >
                          {/* Animated Mesh Gradient Background (Visible on hover or expand) */}
                          <div className={cn(
                            "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none animate-mesh bg-gradient-mesh",
                            isExpanded && "opacity-100"
                          )} />

                          {/* Floating Decorative Icon */}
                          <div className={cn(
                            "absolute -right-8 -top-8 opacity-[0.03] group-hover:opacity-[0.08] transition-all duration-700 pointer-events-none animate-float",
                            isExpanded && "opacity-[0.1] -right-4 -top-4 scale-125"
                          )}>
                            <GraduationCap className="w-48 h-48" />
                          </div>

                          <CollapsibleTrigger asChild>
                            <button type="button" className="w-full text-left cursor-pointer relative z-10 block">
                              {/* Shimmer effect */}
                              <div className="absolute inset-0 animate-shimmer opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                              <div className="p-3 sm:p-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3 sm:gap-4">
                                    <div>
                                      <h3 className={cn(
                                        "text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight transition-all duration-300",
                                        isExpanded && "text-primary"
                                      )}>
                                        {subject.name}
                                      </h3>
                                      <div className="flex items-center gap-3 mt-1">
                                        <div className="flex items-center gap-2 text-[11px] sm:text-xs font-bold uppercase tracking-wider" style={{ color: '#0000FF' }}>
                                          <Target className="w-4 h-4" style={{ color: '#0000FF' }} />
                                          {subject.chapters.length} Units
                                        </div>
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                                        <div className="flex items-center gap-2 text-[11px] sm:text-xs font-bold uppercase tracking-wider" style={{ color: '#0000FF' }}>
                                          <Sparkles className="w-4 h-4" style={{ color: '#0000FF' }} />
                                          {subject.totalQuestions} Questions
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-6">
                                    {(subject.avgProgress ?? 0) > 0 && !isExpanded && (
                                      <div className="hidden md:flex flex-col items-end animate-fade-in">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Your Mastery</span>
                                        <div className="flex items-center gap-3">
                                          <span className={cn("text-lg font-black transition-all group-hover:scale-110", colorScheme.icon)}>{Math.round(subject.avgProgress ?? 0)}%</span>
                                          <div className="w-16 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200/50 dark:border-slate-800/50">
                                            <div
                                              className={cn("h-full rounded-full shadow-sm", colorScheme.accent)}
                                              style={{ width: `${subject.avgProgress}%` }}
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                    <div className={cn(
                                      "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 border border-slate-200 dark:border-slate-800",
                                      isExpanded ? cn("rotate-180 text-white shadow-lg", colorScheme.accent, colorScheme.border) : "bg-white/50 dark:bg-slate-900/50 text-slate-400 group-hover:bg-primary/5 group-hover:text-primary"
                                    )}>
                                      <ChevronDown className="w-6 h-6" />
                                    </div>
                                  </div>
                                </div>

                                {/* Progress bar (Expanded) */}
                                {isExpanded && (subject.avgProgress ?? 0) > 0 && (
                                  <div className="mt-8 space-y-3 animate-fade-in">
                                    <div className="flex justify-between items-center px-1">
                                      <div className="flex items-center gap-2">
                                        <div className={cn("w-2 h-2 rounded-full animate-pulse", colorScheme.accent)} />
                                        <span className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Ongoing Performance</span>
                                      </div>
                                      <span className={cn("text-sm font-black px-3 py-1 rounded-full", colorScheme.icon, colorScheme.bg.replace('/[0.03]', '/[0.1]'))}>{Math.round(subject.avgProgress ?? 0)}% Mastery</span>
                                    </div>
                                    <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200/50 dark:border-slate-800/50 shadow-inner">
                                      <div
                                        className={cn("h-full rounded-full transition-all duration-1000 ease-out", colorScheme.accent)}
                                        style={{ width: `${subject.avgProgress}%` }}
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                            </button>
                          </CollapsibleTrigger>

                          <CollapsibleContent className="animate-accordion-down">
                            <div className="bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800">
                              {/* Theme Picker */}
                              <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/50">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Customize Card Theme</span>
                                <div className="flex gap-2">
                                  {subjectColors.map((color, idx) => (
                                    <button
                                      key={idx}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        updateColor(subject.id, idx);
                                      }}
                                      className={cn(
                                        "w-7 h-7 rounded-full transition-all duration-300 relative group/color active:scale-75",
                                        appliedColorIndex % subjectColors.length === idx
                                          ? "ring-2 ring-primary ring-offset-2 dark:ring-offset-slate-900 scale-110"
                                          : "hover:scale-110 opacity-70 hover:opacity-100",
                                        color.icon
                                      )}
                                    >
                                      {appliedColorIndex % subjectColors.length === idx && (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                          <div className="w-1.5 h-1.5 rounded-full bg-white shadow-sm" />
                                        </div>
                                      )}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              <div className="px-6 pb-6 pt-4 space-y-3">
                                <div className="grid grid-cols-1 gap-3">
                                  {subject.chapters.map((chapter) => (
                                    <ChapterCard
                                      key={chapter.id}
                                      chapter={chapter}
                                      onStart={() => handleStartTest(chapter)}
                                      onReset={() => handleResetChapter(chapter.id)}
                                    />
                                  ))}
                                </div>

                                {subject.chapters.length === 0 && (
                                  <div className="text-center py-12 px-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                                    <BookOpen className="w-10 h-10 text-slate-200 dark:text-slate-800 mx-auto mb-3" />
                                    <h4 className="font-bold text-slate-400 text-sm">No chapters available</h4>
                                  </div>
                                )}
                              </div>
                            </div>
                          </CollapsibleContent>
                        </Card>
                      </Collapsible>
                    );
                  })}
                </div>

                {subjects.length === 0 && !isLoading && (
                  <Card className="border-0 shadow-xl">
                    <CardContent className="text-center py-20">
                      <div className="w-20 h-20 rounded-3xl bg-muted/50 flex items-center justify-center mx-auto mb-6">
                        <GraduationCap className="w-10 h-10 text-muted-foreground/50" />
                      </div>
                      <p className="text-xl font-semibold text-muted-foreground">No subjects available yet</p>
                      <p className="text-sm text-muted-foreground/70 mt-2">Check back soon!</p>
                    </CardContent>
                  </Card>
                )}
              </div>

              <Drawer open={showKeyPointsDialog} onOpenChange={setShowKeyPointsDialog}>
                <DrawerContent className="max-h-[85vh] px-2 pb-6">
                  <DrawerHeader>
                    <DrawerTitle className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-warning/20 flex items-center justify-center shadow-sm">
                        <Lightbulb className="w-5 h-5 text-warning" />
                      </div>
                      <div>
                        <p className="text-lg font-bold">Key Points</p>
                        <p className="text-xs text-muted-foreground font-medium">{selectedChapter?.name}</p>
                      </div>
                    </DrawerTitle>
                    <DrawerDescription className="text-left mt-2">
                      Review these important concepts before starting the practice test
                    </DrawerDescription>
                  </DrawerHeader>
                  <div className="px-4 py-2 space-y-3 overflow-y-auto">
                    {selectedChapter?.key_points && selectedChapter.key_points.length > 0 ? (
                      selectedChapter.key_points.map((point, idx) => (
                        <div key={idx} className="flex gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <span className="text-xs font-bold text-primary">{idx + 1}</span>
                          </div>
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed">{point}</p>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <Lightbulb className="w-12 h-12 text-slate-200 dark:text-slate-800 mx-auto mb-3" />
                        <p className="text-slate-400 font-medium">No specific key points recorded for this chapter.</p>
                      </div>
                    )}
                  </div>
                  <DrawerFooter className="pt-4 px-4 gap-3">
                    <Button
                      onClick={() => {
                        setShowKeyPointsDialog(false);
                        if (selectedChapter) {
                          navigate(`/test/${selectedChapter.id}`, { state: { chapterName: selectedChapter.name } });
                        }
                      }}
                      className="h-14 w-full rounded-2xl text-base font-bold shadow-lg shadow-primary/20 transition-all active:scale-95 group"
                    >
                      <div className="group-active:animate-pop mr-3">
                        <Play className="w-5 h-5" />
                      </div>
                      Start Practice Test
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => setShowKeyPointsDialog(false)}
                      className="h-12 w-full rounded-xl text-slate-500 font-bold active:bg-slate-100"
                    >
                      Back to Subjects
                    </Button>
                  </DrawerFooter>
                </DrawerContent>
              </Drawer>

              <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
                <AlertDialogContent className="sm:max-w-sm w-[95vw] rounded-2xl">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Reset Progress?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete all your attempts and scores for this chapter. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="gap-2 sm:gap-0">
                    <AlertDialogCancel className="h-11">Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={confirmResetChapter} className="h-11 bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Reset
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default StudentSubjects;
