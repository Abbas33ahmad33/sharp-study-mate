import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Shield, LogOut, Settings, Bell } from "lucide-react";
import AppNavbar from "@/components/AppNavbar";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const StudentProfile = () => {
    const { user, userRole, signOut } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await signOut();
        window.location.href = "/auth";
    };

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-background">
            <AppNavbar />

            <main className="flex-1 overflow-y-auto">
                <div className="container mx-auto px-4 py-6 space-y-6 pb-32">
                    <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Your Profile</h1>

                    <Card className="rounded-[2rem] border-none shadow-md overflow-hidden bg-white dark:bg-slate-900">
                        <CardContent className="p-8">
                            <div className="flex flex-col items-center text-center space-y-4">
                                <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center border-4 border-white dark:border-slate-800 shadow-xl">
                                    <User className="w-12 h-12 text-primary" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100">{user?.email?.split('@')[0]}</h2>
                                    <div className="flex items-center justify-center gap-2 mt-1">
                                        <Badge className="bg-primary/10 text-primary border-none font-black uppercase text-[10px] tracking-widest px-3 py-1">
                                            {userRole}
                                        </Badge>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-10 space-y-4">
                                <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center shadow-sm">
                                        <Mail className="w-5 h-5 text-slate-400" />
                                    </div>
                                    <div className="flex-1">
                                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email Address</span>
                                        <span className="font-bold text-slate-700 dark:text-slate-300">{user?.email}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center shadow-sm">
                                        <Shield className="w-5 h-5 text-slate-400" />
                                    </div>
                                    <div className="flex-1">
                                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Account Status</span>
                                        <span className="font-bold text-success">Verified Student</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800 space-y-3">
                                <Button variant="outline" className="w-full justify-start h-14 rounded-2xl font-bold gap-4 border-slate-200">
                                    <Settings className="w-5 h-5 text-slate-400" /> Settings
                                </Button>
                                <Button variant="outline" className="w-full justify-start h-14 rounded-2xl font-bold gap-4 border-slate-200">
                                    <Bell className="w-5 h-5 text-slate-400" /> Notifications
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={handleLogout}
                                    className="w-full justify-start h-14 rounded-2xl font-bold gap-4 mt-4"
                                >
                                    <LogOut className="w-5 h-5" /> Sign Out
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>

            <BottomNav />
        </div>
    );
};

export default StudentProfile;
