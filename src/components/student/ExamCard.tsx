import { Clock, Calendar, Building, Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

interface ExamCardProps {
    exam: {
        id: string;
        title: string;
        exam_date?: string;
        duration_minutes?: number;
        institutes: {
            name: string;
        };
    };
}

const ExamCard = ({ exam }: ExamCardProps) => {
    const navigate = useNavigate();

    return (
        <Card
            onClick={() => navigate(`/exam/${exam.id}`)}
            className="relative cursor-pointer overflow-hidden border-0 h-[130px] sm:h-[160px] w-full bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-md transition-all duration-300 hover:shadow-lg active:scale-95 group rounded-xl"
        >
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-12 h-12 bg-black/10 rounded-full blur-xl translate-y-1/2 -translate-x-1/2" />

            <div className="relative z-10 w-full h-full p-2.5 flex flex-col items-center justify-between text-center">
                {/* Main Icon */}
                <div className="flex-1 flex items-center justify-center w-full pt-1">
                    <div className="p-2 rounded-full bg-white/10 backdrop-blur-md border border-white/10 shadow-inner group-hover:scale-110 transition-transform duration-500">
                        <Clock strokeWidth={1.5} className="w-5 h-5 sm:w-6 sm:h-6 text-white drop-shadow-md" />
                    </div>
                </div>

                {/* Content */}
                <div className="w-full space-y-1.5 relative z-10 text-center">
                    <div>
                        <h3 className="text-xs sm:text-sm font-bold text-white tracking-tight drop-shadow-sm leading-tight line-clamp-1">
                            {exam.title}
                        </h3>
                        <p className="text-[8px] text-white/80 font-medium tracking-wide uppercase line-clamp-1">
                            {exam.institutes.name}
                        </p>
                    </div>

                    {/* Info Pills */}
                    <div className="flex items-center justify-center gap-1.5 flex-wrap">
                        {exam.duration_minutes && (
                            <span className="text-[8px] font-semibold bg-black/20 px-1.5 py-0.5 rounded text-white/90">
                                {exam.duration_minutes}m
                            </span>
                        )}
                        {exam.exam_date && (
                            <span className="text-[8px] font-semibold bg-white/20 px-1.5 py-0.5 rounded text-white/90">
                                {new Date(exam.exam_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default ExamCard;
