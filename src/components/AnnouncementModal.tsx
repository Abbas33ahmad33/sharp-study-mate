import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, X } from "lucide-react";

// ==========================================
// 📢 ANNOUNCEMENT CONFIGURATION
// Create your popup message here!
// ==========================================
const ANNOUNCEMENT_CONFIG = {
    // 1. Set this to true to enable the popup, false to disable it
    isActive: true,

    // 2. Change this version number (e.g., "v1", "v2") to show the popup again to everyone
    //    (Even if they saw "v1", they will see "v2")
    version: "v1",

    // 3. Your Message Content
    title: "Welcome to SkillSharp!",
    message: "We've updated our dashboard with new features! Check out the new 'My Institutes' section and practice tailored MCQs.",

    // 4. Button Text
    buttonText: "Got it, thanks!"
};

const AnnouncementModal = () => {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        // Check if the announcement is active
        if (!ANNOUNCEMENT_CONFIG.isActive) return;

        // Check if the user has already seen THIS version of the announcement
        const seenVersion = localStorage.getItem("skillsharp_announcement_seen");

        if (seenVersion !== ANNOUNCEMENT_CONFIG.version) {
            // If versions don't match (or they haven't seen any), show the popup
            // Use a small timeout to let the app load first
            const timer = setTimeout(() => {
                setIsOpen(true);
            }, 1500);

            return () => clearTimeout(timer);
        }
    }, []);

    const handleClose = () => {
        setIsOpen(false);
        // Remember that the user has seen this version
        localStorage.setItem("skillsharp_announcement_seen", ANNOUNCEMENT_CONFIG.version);
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md rounded-[2rem] border-0 shadow-2xl bg-white dark:bg-slate-900 overflow-hidden">
                {/* Decorative Header Background */}
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent pointer-events-none" />
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                <DialogHeader className="relative pt-6 px-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-hero flex items-center justify-center shadow-lg shadow-primary/20 mb-4 mx-auto animate-pop">
                        <Sparkles className="w-7 h-7 text-white" />
                    </div>
                    <DialogTitle className="text-2xl font-black text-center text-slate-900 dark:text-slate-100">
                        {ANNOUNCEMENT_CONFIG.title}
                    </DialogTitle>
                    <DialogDescription className="text-center text-base font-medium text-slate-500 dark:text-slate-400 mt-2">
                        {ANNOUNCEMENT_CONFIG.message}
                    </DialogDescription>
                </DialogHeader>

                <DialogFooter className="relative pb-6 px-4 sm:justify-center">
                    <Button
                        onClick={handleClose}
                        className="w-full sm:w-auto min-w-[140px] rounded-xl font-bold h-12 text-base shadow-lg shadow-primary/20 hover:shadow-primary/30 active:scale-95 transition-all"
                    >
                        {ANNOUNCEMENT_CONFIG.buttonText}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default AnnouncementModal;
