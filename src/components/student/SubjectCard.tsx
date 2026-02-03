import { ArrowRight, Atom, BookOpen, Calculator, Dna, FlaskConical, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

interface Subject {
    id: string;
    name: string;
    description: string | null;
    chapters: any[]; // Using any[] for now to avoid circular deps, can be typed better if shared
    totalQuestions?: number;
    totalAttempts?: number;
    avgProgress?: number;
}

interface SubjectCardProps {
    subject: Subject;
    onClick: () => void;
    isExpanded?: boolean;
}

// Helper to determine style based on subject name
const getSubjectStyle = (name: string) => {
    const lowerName = name.toLowerCase();

    if (lowerName.includes("physics")) {
        return {
            gradient: "bg-gradient-to-br from-blue-500 to-blue-700",
            icon: Atom,
            subtitle: "Study Materials & Experiments"
        };
    } else if (lowerName.includes("chemistry")) {
        return {
            gradient: "bg-gradient-to-br from-green-500 to-emerald-700",
            icon: FlaskConical,
            subtitle: "Reactions & Periodic Table"
        };
    } else if (lowerName.includes("biology") || lowerName.includes("life")) {
        return {
            gradient: "bg-gradient-to-br from-orange-500 to-red-600",
            icon: Dna,
            subtitle: "Life Sciences & Anatomy"
        };
    } else if (lowerName.includes("math")) {
        return {
            gradient: "bg-gradient-to-br from-purple-500 to-indigo-700",
            icon: Calculator,
            subtitle: "Formulas & Problem Solving"
        };
    } else {
        // Default fallback
        return {
            gradient: "bg-gradient-to-br from-slate-700 to-slate-900",
            icon: GraduationCap,
            subtitle: "Course Materials"
        };
    }
};

const SubjectCard = ({ subject, onClick }: SubjectCardProps) => {
    const { gradient, icon: Icon, subtitle } = getSubjectStyle(subject.name);
    const progress = subject.avgProgress || 0;

    return (
        <div
            onClick={onClick}
            className={cn(
                "relative group cursor-pointer overflow-hidden rounded-xl transition-all duration-300 hover:shadow-lg active:scale-95 shadow-md",
                "h-[130px] sm:h-[160px] w-full flex flex-col items-center justify-between text-center p-2.5",
                gradient
            )}
        >
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-12 h-12 bg-black/10 rounded-full blur-xl translate-y-1/2 -translate-x-1/2" />

            {/* Main Icon */}
            <div className="flex-1 flex items-center justify-center w-full pt-1">
                <div className="p-2 rounded-full bg-white/10 backdrop-blur-md border border-white/10 shadow-inner group-hover:scale-110 transition-transform duration-500">
                    <Icon strokeWidth={1.5} className="w-5 h-5 sm:w-6 sm:h-6 text-white drop-shadow-md" />
                </div>
            </div>

            {/* Content */}
            <div className="w-full space-y-1.5 relative z-10 transition-transform duration-300">
                <div>
                    <h3 className="text-xs sm:text-sm font-bold text-white tracking-tight drop-shadow-sm leading-tight line-clamp-1">
                        {subject.name}
                    </h3>
                    <p className="hidden sm:block text-[8px] text-white/80 font-medium tracking-wide uppercase line-clamp-1">
                        {subtitle}
                    </p>
                </div>

                {/* Progress Bar Section */}
                <div className="w-full space-y-0.5">
                    <div className="flex justify-between text-[8px] font-semibold text-white/90 uppercase tracking-wider px-0.5">
                        <span>{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-1 bg-black/20 backdrop-blur-sm" indicatorClassName="bg-white" />
                </div>
            </div>
        </div>
    );
};

export default SubjectCard;
