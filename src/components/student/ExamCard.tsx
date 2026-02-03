import { Clock, Calendar, Building, Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface ExamCardProps {
    exam: {
        id: string;
        title: string;
        exam_date?: string;
        opens_at?: string;
        closes_at?: string;
        duration_minutes?: number;
        institutes: {
            name: string;
        };
    };
}

const ExamCard = ({ exam }: ExamCardProps) => {
    const navigate = useNavigate();
    const now = new Date();
    const opensAt = exam.opens_at ? new Date(exam.opens_at) : null;
    const closesAt = exam.closes_at ? new Date(exam.closes_at) : null;

    let status: 'upcoming' | 'live' | 'expired' = 'live';
    let statusText = '';

    if (opensAt && now < opensAt) {
        status = 'upcoming';
        statusText = `Opens: ${opensAt.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`;
    } else if (closesAt && now > closesAt) {
        status = 'expired';
        statusText = 'Expired';
    } else if (closesAt) {
        status = 'live';
        statusText = `Ends: ${closesAt.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`;
    }

    const handleClick = () => {
        if (status === 'upcoming') {
            toast.error("This exam hasn't started yet");
            return;
        }
        if (status === 'expired') {
            toast.error("This exam has ended");
            return;
        }
        navigate(`/exam/${exam.id}`);
    };

    return (
        <Card
            onClick={handleClick}
            className={`relative cursor-pointer overflow-hidden border-0 h-[140px] sm:h-[180px] w-full bg-gradient-to-br ${status === 'upcoming'
                ? 'from-blue-500 to-indigo-600'
                : status === 'expired'
                    ? 'from-gray-500 to-gray-600 grayscale'
                    : 'from-amber-500 to-orange-600'
                } text-white shadow-md transition-all duration-300 hover:shadow-lg active:scale-95 group rounded-xl`}
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
                        {statusText && (
                            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${status === 'live' ? 'bg-green-500/40' : 'bg-black/20'
                                }`}>
                                {statusText}
                            </span>
                        )}
                        {exam.duration_minutes && (
                            <span className="text-[8px] font-semibold bg-black/20 px-1.5 py-0.5 rounded text-white/90">
                                {exam.duration_minutes}m
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default ExamCard;
