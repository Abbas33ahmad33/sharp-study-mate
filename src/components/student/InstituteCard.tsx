import { School, CheckCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface InstituteCardProps {
    institute: {
        id: string;
        is_approved: boolean;
        institutes: {
            name: string;
            institute_code: string;
        };
    };
}

const InstituteCard = ({ institute }: InstituteCardProps) => {
    const isApproved = institute.is_approved;

    return (
        <Card className="relative cursor-pointer overflow-hidden border-0 h-[130px] sm:h-[160px] w-full bg-gradient-to-br from-indigo-500 to-purple-700 text-white shadow-md transition-all duration-300 hover:shadow-lg active:scale-95 group rounded-xl">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-12 h-12 bg-black/10 rounded-full blur-xl translate-y-1/2 -translate-x-1/2" />

            <div className="relative z-10 w-full h-full p-2.5 flex flex-col items-center justify-between text-center">
                {/* Main Icon */}
                <div className="flex-1 flex items-center justify-center w-full pt-1">
                    <div className="p-2 rounded-full bg-white/10 backdrop-blur-md border border-white/10 shadow-inner group-hover:scale-110 transition-transform duration-500 relative">
                        <School strokeWidth={1.5} className="w-5 h-5 sm:w-6 sm:h-6 text-white drop-shadow-md" />
                        {/* Status Badge as minimal indicator */}
                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center border-2 border-indigo-600 ${isApproved ? "bg-emerald-500" : "bg-amber-500"}`}>
                            {isApproved ? <CheckCircle className="w-2.5 h-2.5 text-white" /> : <Clock className="w-2.5 h-2.5 text-white" />}
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="w-full space-y-1 relative z-10">
                    <h3 className="text-xs sm:text-sm font-bold text-white tracking-tight drop-shadow-sm leading-tight line-clamp-1">
                        {institute.institutes.name}
                    </h3>
                    <p className="text-[8px] text-white/80 font-medium tracking-wide uppercase line-clamp-1 bg-white/10 px-1.5 py-0.5 rounded-full inline-block">
                        Code: {institute.institutes.institute_code}
                    </p>
                </div>
            </div>
        </Card>
    );
};

export default InstituteCard;
