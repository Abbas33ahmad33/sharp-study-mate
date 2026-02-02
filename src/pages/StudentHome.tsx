import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Trophy,
    Target,
    TrendingUp,
    Clock,
    ChevronRight,
    Play,
    Zap,
    Award,
    BookOpen,
    Sparkles,
    User
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import AppNavbar from "@/components/AppNavbar";
import BottomNav from "@/components/BottomNav";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import AnnouncementModal from "@/components/AnnouncementModal";

const HomeSkeleton = () => (
    <div className="space-y-8 animate-pulse">
        <div className="flex items-center justify-between">
            <div className="space-y-2">
                <Skeleton className="h-8 w-48 rounded-lg animate-shimmer-loading" />
                <Skeleton className="h-4 w-32 rounded-lg animate-shimmer-loading" />
            </div>
            <Skeleton className="w-14 h-14 rounded-2xl animate-shimmer-loading" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
                <Skeleton key={i} className="h-32 rounded-[2rem] animate-shimmer-loading" />
            ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-48 rounded-[2.5rem] animate-shimmer-loading" />
            <Skeleton className="h-48 rounded-[2.5rem] animate-shimmer-loading" />
        </div>
        <div className="space-y-4">
            <Skeleton className="h-6 w-40 rounded-lg animate-shimmer-loading" />
            {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-20 rounded-2xl animate-shimmer-loading" />
            ))}
        </div>
    </div>
);

const StudentHome = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalTests: 0,
        avgScore: 0,
        mastery: 0,
        streak: 0
    });
    const [recentAttempts, setRecentAttempts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchHomeData = useCallback(async () => {
        if (!user) return;

        try {
            // Fetch stats and recent attempts
            const { data: attempts } = await supabase
                .from("test_attempts")
                .select("*, chapters(name, subjects(name))")
                .eq("student_id", user.id)
                .order("completed_at", { ascending: false });

            if (attempts && attempts.length > 0) {
                const totalTests = attempts.length;
                const avgScore = Math.round(attempts.reduce((sum, a) => sum + Number(a.percentage), 0) / totalTests);

                // Mastery is an aggregate of progress across unique chapters
                const uniqueChapters = new Set(attempts.map(a => a.chapter_id));
                const mastery = Math.min(100, Math.round((uniqueChapters.size / 20) * 100)); // Mock denominator

                setStats({
                    totalTests,
                    avgScore,
                    mastery,
                    streak: 3 // Mock streak
                });
                setRecentAttempts(attempts.slice(0, 3));
            }
        } catch (error) {
            console.error("Error fetching home data:", error);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (user) fetchHomeData();
    }, [user, fetchHomeData]);

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-background">
            <AnnouncementModal />
            <AppNavbar />

            <main className="flex-1 overflow-y-auto">
                <div className="container mx-auto px-4 py-6 space-y-8 pb-32">
                    {isLoading ? (
                        <HomeSkeleton />
                    ) : (
                        <>
                            {/* Welcome Section */}
                            <section className="animate-fade-in flex items-center justify-between">
                                <div>
                                    <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-none">
                                        Hello, <span className="text-primary">{user?.email?.split('@')[0] || 'Student'}</span>!
                                    </h1>
                                    <p className="text-slate-500 font-medium mt-1.5 text-sm">Ready to master your subjects?</p>
                                </div>
                                <div className="w-14 h-14 rounded-2xl bg-gradient-hero flex items-center justify-center shadow-lg active:scale-90 transition-transform cursor-pointer" onClick={() => navigate("/student/profile")}>
                                    <User className="w-7 h-7 text-white" />
                                </div>
                            </section>

                            <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <Card className="border-none shadow-sm bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden active:scale-95 transition-transform cursor-pointer group">
                                    <CardContent className="p-5 flex flex-col items-center justify-center text-center">
                                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-2.5 group-active:animate-pop">
                                            <Target className="w-6 h-6 text-primary" />
                                        </div>
                                        <span className="text-2xl font-black text-slate-900 dark:text-slate-100">{stats.totalTests}</span>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tests Taken</span>
                                    </CardContent>
                                </Card>
                                <Card className="border-none shadow-sm bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden active:scale-95 transition-transform cursor-pointer">
                                    <CardContent className="p-5 flex flex-col items-center justify-center text-center">
                                        <div className="w-12 h-12 rounded-2xl bg-success/10 flex items-center justify-center mb-2.5">
                                            <Trophy className="w-6 h-6 text-success" />
                                        </div>
                                        <span className="text-2xl font-black text-slate-900 dark:text-slate-100">{stats.avgScore}%</span>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Avg. Score</span>
                                    </CardContent>
                                </Card>
                                <Card className="border-none shadow-sm bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden active:scale-95 transition-transform cursor-pointer">
                                    <CardContent className="p-5 flex flex-col items-center justify-center text-center">
                                        <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center mb-2.5">
                                            <Zap className="w-6 h-6 text-orange-500" />
                                        </div>
                                        <span className="text-2xl font-black text-slate-900 dark:text-slate-100">{stats.streak}d</span>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Daily Streak</span>
                                    </CardContent>
                                </Card>
                                <Card className="border-none shadow-sm bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden active:scale-95 transition-transform cursor-pointer">
                                    <CardContent className="p-5 flex flex-col items-center justify-center text-center">
                                        <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center mb-2.5">
                                            <TrendingUp className="w-6 h-6 text-secondary" />
                                        </div>
                                        <span className="text-2xl font-black text-slate-900 dark:text-slate-100">{stats.mastery}%</span>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mastery</span>
                                    </CardContent>
                                </Card>
                            </section>

                            {/* Quick Actions */}
                            <section className="space-y-4">
                                <div className="flex items-center justify-between px-1">
                                    <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Recommended</h2>
                                    <Button variant="ghost" size="sm" onClick={() => navigate("/student/subjects")} className="text-primary font-bold">
                                        View All
                                    </Button>
                                </div>

                                <div className="grid grid-cols-1 gap-4">


                                    <Card
                                        className="group relative overflow-hidden rounded-[2.5rem] border-none shadow-xl shadow-slate-200/50 dark:shadow-black/20 bg-white dark:bg-slate-900 p-7 cursor-pointer transform transition-all active:scale-95 touch-manipulation"
                                        onClick={() => navigate("/student/exams")}
                                    >
                                        <div className="absolute top-0 right-0 p-4 opacity-[0.02] group-active:scale-110 transition-transform">
                                            <Award className="w-40 h-40 -rotate-12" />
                                        </div>
                                        <div className="relative z-10 space-y-4">
                                            <div className="bg-secondary/10 w-12 h-12 rounded-2xl flex items-center justify-center">
                                                <TrendingUp className="w-6 h-6 text-secondary" />
                                            </div>
                                            <div>
                                                <h3 className="text-2xl font-black tracking-tight">Mock Exams</h3>
                                                <p className="text-slate-500 text-sm font-medium">Prepare for the real deal with institute-level mock tests.</p>
                                            </div>
                                            <Button variant="outline" className="w-full rounded-xl font-bold border-secondary/20 text-secondary hover:bg-secondary/5">
                                                View Exams <ChevronRight className="w-4 h-4 ml-1" />
                                            </Button>
                                        </div>
                                    </Card>
                                </div>
                            </section>

                            {/* Recent Activity */}
                            <section className="space-y-4">
                                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 px-1">Recent Activity</h2>
                                {recentAttempts.length > 0 ? (
                                    <div className="space-y-3">
                                        {recentAttempts.map((attempt) => (
                                            <div
                                                key={attempt.id}
                                                className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between active:scale-[0.98] transition-all cursor-pointer shadow-sm hover:shadow-md"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                                                        <Clock className="w-6 h-6 text-slate-400" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm leading-tight">{attempt.chapters?.name}</h4>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{attempt.chapters?.subjects?.name}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="text-right">
                                                        <span className="block text-base font-black text-primary">{attempt.percentage}%</span>
                                                        <span className="text-[9px] font-bold text-slate-400 uppercase">Score</span>
                                                    </div>
                                                    <ChevronRight className="w-4 h-4 text-slate-300" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-[2rem] border border-dashed border-slate-200 dark:border-slate-800">
                                        <BookOpen className="w-12 h-12 text-slate-200 dark:text-slate-800 mx-auto mb-3" />
                                        <p className="text-slate-400 font-bold">No recent activity yet</p>
                                    </div>
                                )}
                            </section>
                        </>
                    )}
                </div>
            </main>

            <BottomNav />
        </div>
    );
};

export default StudentHome;
