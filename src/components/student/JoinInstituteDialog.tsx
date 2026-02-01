import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { School, Send } from "lucide-react";
import { toast } from "sonner";

interface JoinInstituteDialogProps {
  onJoined?: () => void;
}

const JoinInstituteDialog = ({ onJoined }: JoinInstituteDialogProps) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [instituteCode, setInstituteCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !instituteCode.trim()) return;

    setLoading(true);
    try {
      // Find institute by code
      const { data: institute, error: findError } = await supabase
        .from("institutes")
        .select("id, name")
        .eq("institute_code", instituteCode.toUpperCase())
        .eq("is_active", true)
        .maybeSingle();

      if (findError) throw findError;

      if (!institute) {
        toast.error("Institute not found. Please check the code and try again.");
        return;
      }

      // Check if already enrolled
      const { data: existing } = await supabase
        .from("institute_students")
        .select("id, is_approved")
        .eq("institute_id", institute.id)
        .eq("student_id", user.id)
        .maybeSingle();

      if (existing) {
        if (existing.is_approved) {
          toast.info("You are already a member of this institute.");
        } else {
          toast.info("Your request is already pending approval.");
        }
        return;
      }

      // Create enrollment request
      const { error: insertError } = await supabase.from("institute_students").insert({
        institute_id: institute.id,
        student_id: user.id,
        is_approved: false,
      });

      if (insertError) throw insertError;

      toast.success(`Request sent to ${institute.name}! Waiting for approval.`);
      setInstituteCode("");
      setOpen(false);
      onJoined?.();
    } catch (error: any) {
      console.error("Error joining institute:", error);
      toast.error(error.message || "Failed to send request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 text-xs sm:text-sm" size="sm">
          <School className="w-4 h-4" />
          <span className="hidden sm:inline">Join Institute</span>
          <span className="sm:hidden">Join</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="mx-2 sm:mx-auto max-w-[95vw] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Join an Institute</DialogTitle>
          <DialogDescription className="text-sm">
            Enter the institute code provided by your school or coaching center. Once your request
            is approved, you'll have access to their exams.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="institute-code">Institute Code</Label>
              <Input
                id="institute-code"
                placeholder="e.g., INST1234"
                value={instituteCode}
                onChange={(e) => setInstituteCode(e.target.value.toUpperCase())}
                required
              />
              <p className="text-xs text-muted-foreground">
                Ask your institute admin for their unique code
              </p>
            </div>
          </div>
          <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !instituteCode.trim()} className="w-full sm:w-auto">
              <Send className="w-4 h-4 mr-2" />
              {loading ? "Sending..." : "Send Request"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default JoinInstituteDialog;
