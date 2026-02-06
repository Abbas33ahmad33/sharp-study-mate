
import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen, Clock, Trophy } from "lucide-react";
import ChapterCard from "@/components/student/ChapterCard";
import AppNavbar from "@/components/AppNavbar";
import BottomNav from "@/components/BottomNav";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
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
import { Play } from "lucide-react";
import MathText from "@/components/MathText";

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

interface SubjectDetails {
    id: string;
    name: string;
    description: string | null;
}

const StudentSubjectDetails = () => {
    const { subjectId } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [subject, setSubject] = useState<SubjectDetails | null>(null);
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Interaction states
    const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
    const [showKeyPointsDialog, setShowKeyPointsDialog] = useState(false);
    const [resetChapterId, setResetChapterId] = useState<string | null>(null);
    const [showResetDialog, setShowResetDialog] = useState(false);

    const fetchData = useCallback(async () => {
        if (!user || !subjectId) return;

        try {
            setIsLoading(true);

            // Fetch Subject Details
            const { data: subjectData, error: subjectError } = await supabase
                .from("subjects")
                .select("id, name, description")
                .eq("id", subjectId)
                .single();

            if (subjectError) throw subjectError;
            setSubject(subjectData);

            // Fetch Chapters with aggregated MCQ counts
            const { data: chaptersData, error: chaptersError } = await supabase
                .from("chapters")
                .select("id, name, description, key_points, order_index, mcqs(count)")
                .eq("subject_id", subjectId)
                .order("order_index");

            if (chaptersError) throw chaptersError;

            // Fetch Attempts
            const { data: attemptsData } = await supabase
                .from("test_attempts")
                .select("chapter_id, percentage")
                .eq("student_id", user.id);

            const attemptsByChapter = new Map();
            if (attemptsData) {
                attemptsData.forEach((a: any) => {
                    if (!attemptsByChapter.has(a.chapter_id)) {
                        attemptsByChapter.set(a.chapter_id, []);
                    }
                    attemptsByChapter.get(a.chapter_id).push(a);
                });
            }

            // Process Chapters
            const processedChapters = (chaptersData || []).map((chapter: any) => {
                // @ts-ignore
                const mcq_count = chapter.mcqs?.[0]?.count || 0;
                const chapterAttempts = attemptsByChapter.get(chapter.id) || [];

                let progress = 0;
                let attempts_count = chapterAttempts.length;
                let best_score = 0;
                let latest_score = 0;

                if (attempts_count > 0) {
                    latest_score = Number(chapterAttempts[0].percentage);
                    best_score = Math.max(...chapterAttempts.map((a: any) => Number(a.percentage)));
                    progress = chapterAttempts.reduce((sum: number, a: any) => sum + Number(a.percentage), 0) / attempts_count;
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

            setChapters(processedChapters);
        } catch (error) {
            console.error("Error fetching subject details:", error);
            toast.error("Failed to load subject details");
            navigate("/student/subjects");
        } finally {
            setIsLoading(false);
        }
    }, [user, subjectId, navigate]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleStartTest = (chapter: Chapter) => {
        if (chapter.key_points && chapter.key_points.length > 0) {
            setSelectedChapter(chapter);
            setShowKeyPointsDialog(true);
        } else {
            navigate(`/test/${chapter.id}`, { state: { chapterName: chapter.name } });
        }
    };

    const handleResetChapter = (chapterId: string) => {
        setResetChapterId(chapterId);
        setShowResetDialog(true);
    };

    const confirmResetChapter = async () => {
        if (!user || !resetChapterId) return;

        try {
            // 1. Get attempts
            const { data: attempts } = await supabase
                .from("test_attempts")
                .select("id")
                .eq("student_id", user.id)
                .eq("chapter_id", resetChapterId);

            if (attempts && attempts.length > 0) {
                const attemptIds = attempts.map(a => a.id);

                // 2. Delete answers
                await supabase.from("test_answers").delete().in("attempt_id", attemptIds);

                // 3. Delete attempts
                await supabase
                    .from("test_attempts")
                    .delete()
                    .eq("student_id", user.id)
                    .eq("chapter_id", resetChapterId);

                toast.success("Progress reset successfully!");
                fetchData(); // Reload data
            }
        } catch (error) {
            console.error("Reset error:", error);
            toast.error("Failed to reset progress");
        } finally {
            setShowResetDialog(false);
            setResetChapterId(null);
        }
    };

    // Determine gradient based on subject name (consistent with SubjectCard)
    const getHeaderGradient = (name: string = "") => {
        const lowerName = name.toLowerCase();
        if (lowerName.includes("physics")) return "from-blue-600 to-blue-800";
        if (lowerName.includes("chemistry")) return "from-emerald-600 to-emerald-800";
        if (lowerName.includes("biology") || lowerName.includes("life")) return "from-orange-500 to-red-700";
        if (lowerName.includes("math")) return "from-violet-600 to-indigo-800";
        return "from-slate-700 to-slate-900";
    };

    // Determine text color based on subject name
    const getAccentColor = (name: string = "") => {
        const lowerName = name.toLowerCase();
        if (lowerName.includes("physics")) return "text-blue-600 dark:text-blue-400";
        if (lowerName.includes("chemistry")) return "text-emerald-600 dark:text-emerald-400";
        if (lowerName.includes("biology") || lowerName.includes("life")) return "text-orange-600 dark:text-orange-400";
        if (lowerName.includes("math")) return "text-violet-600 dark:text-violet-400";
        return "text-slate-900 dark:text-slate-100";
    };

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
            <AppNavbar />

            <main className="flex-1 overflow-y-auto">
                {isLoading ? (
                    <div className="container mx-auto px-4 py-8 space-y-4">
                        <Skeleton className="h-48 w-full rounded-3xl" />
                        <Skeleton className="h-24 w-full rounded-2xl" />
                        <Skeleton className="h-24 w-full rounded-2xl" />
                    </div>
                ) : (
                    <>
                        {/* Hero Header */}
                        <div className={`relative bg-gradient-to-br ${getHeaderGradient(subject?.name)} text-white pb-12 pt-8 px-6 rounded-b-[2.5rem] shadow-xl overflow-hidden`}>
                            {/* Decorative blobs */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                            <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

                            <div className="relative z-10 container mx-auto">
                                <Button
                                    variant="ghost"
                                    onClick={() => navigate("/student/subjects")}
                                    className="text-white/80 hover:text-white hover:bg-white/10 mb-6 -ml-2 rounded-full"
                                >
                                    <ArrowLeft className="mr-2 h-5 w-5" />
                                    Back to Subjects
                                </Button>

                                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">{subject?.name}</h1>

                                <div className="flex gap-6 mt-8">
                                    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10">
                                        <BookOpen className="w-4 h-4 text-white/90" />
                                        <span className="font-medium text-sm">{chapters.length} Chapters</span>
                                    </div>
                                    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10">
                                        <Trophy className="w-4 h-4 text-white/90" />
                                        <span className="font-medium text-sm">{Math.round(chapters.reduce((acc, ch) => acc + (ch.progress || 0), 0) / (chapters.length || 1))}% Avg Score</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Chapters List */}
                        <div className="container mx-auto px-4 -mt-6 pb-20 relative z-20 space-y-4">
                            {chapters.length > 0 ? (
                                chapters.map((chapter) => (
                                    <ChapterCard
                                        key={chapter.id}
                                        chapter={chapter}
                                        onStart={() => handleStartTest(chapter)}
                                        onReset={() => handleResetChapter(chapter.id)}
                                        accentColor={getAccentColor(subject?.name)}
                                    />
                                ))
                            ) : (
                                <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 text-center shadow-sm border border-slate-100 dark:border-slate-800">
                                    <p className="text-slate-500 font-medium">No chapters found for this subject.</p>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </main>

            {/* Key Points Drawer (Copied from StudentSubjects) */}
            <Drawer open={showKeyPointsDialog} onOpenChange={setShowKeyPointsDialog}>
                <DrawerContent className="max-h-[85vh]">
                    <DrawerHeader className="text-left border-b border-primary/10 pb-4">
                        <DrawerTitle className="flex items-center gap-3 text-2xl font-bold text-primary">
                            <div className="p-2.5 rounded-xl bg-primary/10">
                                <BookOpen className="w-6 h-6 text-primary" />
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
                                    <div className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap break-words">
                                        {point.includes(":") ? (
                                            <>
                                                <span className="font-bold text-primary">{point.split(":")[0]}:</span>
                                                <MathText text={point.split(":").slice(1).join(":")} />
                                            </>
                                        ) : (
                                            <MathText text={point} />
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8">
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
                            Cancel
                        </Button>
                    </DrawerFooter>
                </DrawerContent>
            </Drawer>

            {/* Reset Dialog */}
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

            <BottomNav />
        </div>
    );
};

export default StudentSubjectDetails;
