import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import InstituteCard from "@/components/student/InstituteCard";
import AppNavbar from "@/components/AppNavbar";
import JoinInstituteDialog from "@/components/student/JoinInstituteDialog";
import { School, ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const StudentInstitutes = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [myInstitutes, setMyInstitutes] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchMyInstitutes = useCallback(async () => {
        if (!user) return;

        try {
            const { data } = await supabase
                .from("institute_students")
                .select("id, is_approved, joined_at, institutes(id, name, institute_code)")
                .eq("student_id", user.id)
                .order("joined_at", { ascending: false });

            setMyInstitutes(data || []);
        } catch (error) {
            console.error("Error fetching institutes:", error);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchMyInstitutes();
    }, [fetchMyInstitutes]);

    return (
        <div className="min-h-screen bg-background pb-20">
            <AppNavbar />
            <main className="container mx-auto px-4 sm:px-6 pt-24 pb-12 space-y-8">
                <div className="flex items-center gap-2 mb-6">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/student/subjects')} className="rounded-full">
                        <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">My Institutes</h1>
                        <p className="text-muted-foreground mt-1">Manage your institute memberships</p>
                    </div>
                </div>

                <div className="flex justify-end mb-6">
                    <JoinInstituteDialog onJoined={fetchMyInstitutes} />
                </div>

                {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="h-40 rounded-xl bg-muted/50 animate-pulse" />
                        ))}
                    </div>
                ) : myInstitutes.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {myInstitutes.map((enrollment) => (
                            <InstituteCard key={enrollment.id} institute={enrollment} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-muted/20 rounded-3xl border border-dashed border-border/50">
                        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                            <School className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold">No Institutes Joined</h3>
                        <p className="text-muted-foreground max-w-sm mx-auto mt-2 mb-6">
                            Join an institute to access exclusive exams and study materials.
                        </p>
                        <JoinInstituteDialog onJoined={fetchMyInstitutes} />
                    </div>
                )}
            </main>
        </div>
    );
};

export default StudentInstitutes;
