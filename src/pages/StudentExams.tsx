import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Calendar, School, ChevronRight } from "lucide-react";
import AppNavbar from "@/components/AppNavbar";
import BottomNav from "@/components/BottomNav";

const StudentExams = () => {
    const { user } = useAuth();
    const [exams, setExams] = useState<any[]>([]);

    useEffect(() => {
        const fetchExams = async () => {
            if (!user) return;
            const { data: studentInstitutes } = await supabase
                .from("institute_students")
                .select("institute_id")
                .eq("student_id", user.id)
                .eq("is_approved", true);

            if (studentInstitutes && studentInstitutes.length > 0) {
                const instituteIds = studentInstitutes.map(si => si.institute_id);
                const { data } = await supabase
                    .from("institute_exams")
                    .select("*, institutes(name)")
                    .in("institute_id", instituteIds)
                    .eq("is_active", true)
                    .order("exam_date", { ascending: false });
                setExams(data || []);
            }
        };
        fetchExams();
    }, [user]);

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-background">
            <AppNavbar />

            <main className="flex-1 overflow-y-auto">
                <div className="container mx-auto px-4 py-6 space-y-6 pb-32">
                    <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Institute Exams</h1>
                    <div className="space-y-4">
                        {exams.length > 0 ? (
                            exams.map((exam) => (
                                <Card key={exam.id} className="overflow-hidden rounded-2xl border-none shadow-sm hover:shadow-md transition-shadow">
                                    <CardContent className="p-0">
                                        <div className="flex">
                                            <div className="w-2 bg-primary" />
                                            <div className="p-5 flex-1 flex items-center justify-between">
                                                <div className="space-y-1">
                                                    <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">{exam.title}</h3>
                                                    <div className="flex items-center gap-3 text-xs font-bold text-slate-400 uppercase tracking-widest">
                                                        <span className="flex items-center gap-1"><School className="w-3.5 h-3.5" /> {exam.institutes?.name}</span>
                                                        <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {new Date(exam.exam_date).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                                <ChevronRight className="w-5 h-5 text-slate-300" />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        ) : (
                            <div className="text-center py-20">
                                <FileText className="w-12 h-12 text-slate-200 dark:text-slate-800 mx-auto mb-4" />
                                <p className="font-bold text-slate-400">No active exams assigned by your institutes.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <BottomNav />
        </div>
    );
};

export default StudentExams;
