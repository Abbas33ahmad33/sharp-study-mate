import { Home, BookOpen, FileText, User } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

const BottomNav = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { userRole } = useAuth();

    // Only show for students for now, or adapt routes based on role
    const getDashboardRoute = () => {
        if (userRole === "admin") return "/admin";
        if (userRole === "institute") return "/institute";
        return "/student";
    };

    const navItems = [
        {
            label: "Home",
            icon: Home,
            path: "/student",
        },
        {
            label: "Subjects",
            icon: BookOpen,
            path: "/student/subjects",
        },
        {
            label: "Exams",
            icon: FileText,
            path: "/student/exams",
        },
        {
            label: "Profile",
            icon: User,
            path: "/student/profile",
        },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 block md:hidden px-4 pb-[calc(var(--safe-bottom)+1.5rem)]">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-6 py-2 rounded-3xl flex items-center justify-between shadow-xl shadow-slate-200/50 dark:shadow-black/40">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    const Icon = item.icon;

                    return (
                        <button
                            key={item.label}
                            onClick={() => navigate(item.path)}
                            className="flex flex-col items-center gap-1 group relative py-1 transition-all active:scale-90 touch-none"
                        >
                            <div className={cn(
                                "p-2.5 rounded-2xl transition-all duration-300",
                                isActive
                                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 -translate-y-1.5"
                                    : "text-slate-400 hover:text-primary/70"
                            )}>
                                <Icon className={cn("w-6 h-6", isActive && "animate-pulse-glow")} strokeWidth={isActive ? 2.5 : 2} />
                            </div>
                            <span className={cn(
                                "text-[9px] font-black uppercase tracking-widest transition-all duration-300",
                                isActive ? "text-primary opacity-100 scale-100" : "text-slate-400 opacity-60 scale-95"
                            )}>
                                {item.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default BottomNav;
