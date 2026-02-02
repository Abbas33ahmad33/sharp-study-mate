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
        <div className="fixed bottom-0 left-0 right-0 z-50 block md:hidden px-2 sm:px-4 pb-[calc(var(--safe-bottom)+0.25rem)] pointer-events-none">
            <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200 dark:border-slate-800 p-1.5 rounded-[2rem] flex items-center justify-between shadow-2xl shadow-slate-900/10 dark:shadow-black/40 max-w-lg mx-auto pointer-events-auto w-full">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    const Icon = item.icon;

                    return (
                        <button
                            key={item.label}
                            onClick={() => navigate(item.path)}
                            className="flex-1 flex flex-col items-center gap-1 group relative py-2 transition-all active:scale-95 touch-manipulation"
                        >
                            <div className={cn(
                                "p-2 rounded-2xl transition-all duration-300 relative",
                                isActive
                                    ? "shadow-lg -translate-y-1"
                                    : "hover:bg-slate-100 dark:hover:bg-slate-800"
                            )} style={isActive ? { backgroundColor: '#0000FF' } : {}}>
                                <Icon
                                    className={cn("w-5 h-5 transition-all duration-300", isActive && "scale-110")}
                                    strokeWidth={isActive ? 2.5 : 2}
                                    style={{ color: isActive ? '#FFFFFF' : '#94a3b8' }}
                                />
                                {isActive && (
                                    <div className="absolute inset-0 rounded-2xl animate-pulse" style={{ backgroundColor: '#0000FF', opacity: 0.3 }} />
                                )}
                            </div>
                            <span className={cn(
                                "text-[10px] font-bold uppercase tracking-wider transition-all duration-300 leading-none mt-0.5",
                                isActive ? "opacity-100 scale-100 translate-y-0" : "opacity-60 scale-90 translate-y-0.5"
                            )} style={{ color: isActive ? '#0000FF' : '#94a3b8' }}>
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
