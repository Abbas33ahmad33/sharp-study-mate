import { BookOpen, CheckCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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

interface ChapterCardProps {
    chapter: Chapter;
    onStart: () => void;
    onReset: () => void;
    accentColor?: string;
}

const ChapterCard = ({ chapter, onStart, onReset, accentColor = "text-slate-900 dark:text-slate-100" }: ChapterCardProps) => {
    const hasProgress = chapter.attempts_count !== undefined && chapter.attempts_count > 0;
    const progressPercent = Math.round(chapter.progress || 0);

    return (
        <div className="group relative rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-primary/50 hover:shadow-md transition-all duration-300 overflow-hidden">
            <div className="p-5">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                            <div className={cn("w-1.5 h-1.5 rounded-full", accentColor.replace("text-", "bg-"))} />
                            <h4 className={cn("font-bold text-lg leading-tight", accentColor)}>{chapter.name}</h4>
                        </div>

                        <div className="flex items-center gap-4 text-xs font-medium text-slate-500 dark:text-slate-400">
                            <span className="flex items-center gap-1">
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
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChapterCard;
