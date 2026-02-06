import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Crown, ArrowLeft, TrendingUp, Users } from "lucide-react";
import AppNavbar from "@/components/AppNavbar";
import BottomNav from "@/components/BottomNav";
import { toast } from "sonner";

interface LeaderboardEntry {
    user_id: string;
    full_name: string;
    email: string;
    total_attempts: number;
    total_score: number;
    avg_score: number;
    rank: number;
}

const Leaderboard = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [userRank, setUserRank] = useState<LeaderboardEntry | null>(null);

    useEffect(() => {
        fetchLeaderboard();
    }, []);

    const fetchLeaderboard = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            const { data, error } = await (supabase as any)
                .from("leaderboard")
                .select("*")
                .limit(50);

            if (error) throw error;
            setLeaderboard(data || []);

            if (user) {
                const currentUserRank = data?.find((entry: any) => entry.user_id === user.id);
                if (currentUserRank) {
                    setUserRank(currentUserRank);
                } else {
                    // If not in top 50, fetch individual rank (optional fetch)
                    const { data: individualRank } = await (supabase as any)
                        .from("leaderboard")
                        .select("*")
                        .eq("user_id", user.id)
                        .single();
                    if (individualRank) setUserRank(individualRank);
                }
            }
        } catch (error) {
            console.error("Error fetching leaderboard:", error);
            toast.error("Failed to load rankings");
        } finally {
            setLoading(false);
        }
    };

    const getRankIcon = (rank: number) => {
        switch (rank) {
            case 1: return <Crown className="w-8 h-8 text-yellow-500 animate-bounce" />;
            case 2: return <Medal className="w-7 h-7 text-gray-400" />;
            case 3: return <Medal className="w-6 h-6 text-amber-600" />;
            default: return <span className="text-lg font-bold text-muted-foreground w-6 text-center">{rank}</span>;
        }
    };

    const getRankColor = (rank: number) => {
        switch (rank) {
            case 1: return "bg-gradient-to-br from-yellow-100 to-yellow-50 border-yellow-200 shadow-yellow-100";
            case 2: return "bg-gradient-to-br from-gray-100 to-gray-50 border-gray-200 shadow-gray-100";
            case 3: return "bg-gradient-to-br from-orange-100 to-orange-50 border-orange-200 shadow-orange-100";
            default: return "bg-card border-border/50";
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    const topThree = leaderboard.slice(0, 3);
    const theRest = leaderboard.slice(3);

    return (
        <div className="min-h-screen bg-gradient-glow bg-gradient-animated pb-24">
            <AppNavbar />

            <main className="container max-w-2xl mx-auto px-4 py-6">
                <div className="flex items-center gap-4 mb-8">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-xl">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div className="flex-1 text-center pr-10">
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                            Global Rankings
                        </h1>
                        <p className="text-muted-foreground text-sm font-medium mt-1">Battle for the top spot! 🏆</p>
                    </div>
                </div>

                {/* User Current Rank Summary */}
                {userRank && (
                    <Card className="mb-8 border-2 border-primary/20 bg-primary/5 shadow-premium overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Trophy className="w-20 h-20 text-primary rotate-12" />
                        </div>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between gap-4">
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-primary">Your Current Rank</p>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-4xl font-black">#{userRank.rank}</span>
                                        <span className="text-muted-foreground text-sm">among {leaderboard.length}+ students</span>
                                    </div>
                                </div>
                                <div className="text-right space-y-1">
                                    <p className="text-sm font-medium text-muted-foreground">Total XP</p>
                                    <p className="text-2xl font-bold text-primary">{Math.round(userRank.total_score)} XP</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Top 3 Podium Cards */}
                <div className="flex flex-col gap-4 mb-8">
                    {topThree.map((entry) => (
                        <Card
                            key={entry.user_id}
                            className={`border-2 transform transition-all hover:scale-[1.02] active:scale-[0.98] shadow-premium ${getRankColor(entry.rank)}`}
                        >
                            <CardContent className="p-5 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="flex-shrink-0 w-12 flex justify-center">
                                        {getRankIcon(entry.rank)}
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-bold text-lg truncate leading-tight">{entry.full_name}</h3>
                                        <div className="flex items-center gap-3 mt-1">
                                            <Badge variant="secondary" className="bg-white/50 text-[10px] sm:text-xs">
                                                {entry.total_attempts} Tests
                                            </Badge>
                                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                <TrendingUp className="w-3 h-3" />
                                                Avg: {Math.round(entry.avg_score)}%
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right pr-2">
                                    <p className="font-black text-xl text-primary">{Math.round(entry.total_score)}</p>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">XP</p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* The Rest of the List */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between px-4 py-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        <span>Rank & Name</span>
                        <span>Total XP</span>
                    </div>
                    {theRest.map((entry) => (
                        <div
                            key={entry.user_id}
                            className="flex items-center justify-between p-4 bg-card border border-border/50 rounded-2xl shadow-sm hover:shadow-md transition-shadow group"
                        >
                            <div className="flex items-center gap-4 min-w-0">
                                <span className="text-muted-foreground font-black text-sm w-6 text-center group-hover:text-primary transition-colors">
                                    {entry.rank}
                                </span>
                                <div className="min-w-0">
                                    <p className="font-semibold text-sm truncate">{entry.full_name}</p>
                                    <p className="text-[10px] text-muted-foreground">{entry.total_attempts} attempts</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-sm">{Math.round(entry.total_score)}</p>
                            </div>
                        </div>
                    ))}

                    {leaderboard.length === 0 && !loading && (
                        <div className="text-center py-12">
                            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                            <p className="text-muted-foreground">No rankings available yet. Be the first!</p>
                        </div>
                    )}
                </div>
            </main>

            <BottomNav />
        </div>
    );
};

export default Leaderboard;
