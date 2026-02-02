import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, Megaphone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Announcement {
    id: string;
    title: string;
    message: string;
    is_active: boolean;
    created_at: string;
    contact_info?: string; // Optional: can use this for "coupon code" or extra details
}

const AnnouncementModal = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [announcement, setAnnouncement] = useState<Announcement | null>(null);

    useEffect(() => {
        const fetchAnnouncement = async () => {
            // Fetch the most recent active announcement
            const { data, error } = await supabase
                .from("announcements")
                .select("*")
                .eq("is_active", true)
                .order("created_at", { ascending: false })
                .limit(1)
                .maybeSingle();

            if (error || !data) return;

            // Check if user has already seen THIS specific announcement ID
            const seenId = localStorage.getItem("skillsharp_last_seen_announcement");

            // If the ID is different (new announcement), show it!
            if (seenId !== data.id) {
                setAnnouncement(data);
                // Small delay for better UX (let page load first)
                setTimeout(() => setIsOpen(true), 1500);
            }
        };

        fetchAnnouncement();
    }, []);

    const handleClose = () => {
        if (!announcement) return;
        setIsOpen(false);
        // Mark this specific announcement as seen
        localStorage.setItem("skillsharp_last_seen_announcement", announcement.id);
    };

    if (!announcement) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="sm:max-w-md rounded-[2rem] border-0 shadow-2xl bg-white dark:bg-slate-900 overflow-hidden">
                {/* Decorative Header Background */}
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent pointer-events-none" />
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                <DialogHeader className="relative pt-6 px-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-hero flex items-center justify-center shadow-lg shadow-primary/20 mb-4 mx-auto animate-pop">
                        <Sparkles className="w-7 h-7 text-white" />
                    </div>
                    <DialogTitle className="text-2xl font-black text-center text-slate-900 dark:text-slate-100 leading-tight">
                        {announcement.title}
                    </DialogTitle>
                    <DialogDescription className="text-center text-base font-medium text-slate-500 dark:text-slate-400 mt-3 leading-relaxed">
                        {announcement.message}
                    </DialogDescription>

                    {/* Optional: Show extra details/code if present */}
                    {announcement.contact_info && (
                        <div className="mt-4 mx-auto bg-primary/5 border border-primary/10 rounded-xl p-3 text-center">
                            <p className="text-sm font-bold text-primary tracking-wide uppercase">Code</p>
                            <p className="text-lg font-mono font-black text-slate-900 dark:text-slate-100 select-all">
                                {announcement.contact_info}
                            </p>
                        </div>
                    )}
                </DialogHeader>

                <DialogFooter className="relative pb-6 px-4 sm:justify-center mt-2">
                    <Button
                        onClick={handleClose}
                        className="w-full sm:w-auto min-w-[140px] rounded-xl font-bold h-12 text-base shadow-lg shadow-primary/20 hover:shadow-primary/30 active:scale-95 transition-all"
                    >
                        Got it, thanks!
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default AnnouncementModal;
