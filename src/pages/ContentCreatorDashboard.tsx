import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileQuestion } from "lucide-react";
import MCQsManager from "@/components/admin/MCQsManager";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import AppNavbar from "@/components/AppNavbar";

const ContentCreatorDashboard = () => {
  const { user } = useAuth();
  const [myMcqCount, setMyMcqCount] = useState(0);

  useEffect(() => {
    fetchMyStats();
  }, [user]);

  const fetchMyStats = async () => {
    if (!user) return;
    
    const { count } = await supabase
      .from("mcqs")
      .select("id", { count: "exact", head: true })
      .eq("created_by", user.id);

    setMyMcqCount(count || 0);
  };

  return (
    <div className="min-h-screen bg-gradient-glow">
      <AppNavbar />

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Card className="shadow-card bg-gradient-card border-accent/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">My MCQs</CardTitle>
              <FileQuestion className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{myMcqCount}</div>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Manage MCQs</CardTitle>
            <CardDescription>Create and manage your MCQ contributions</CardDescription>
          </CardHeader>
          <CardContent>
            <MCQsManager onUpdate={fetchMyStats} />
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default ContentCreatorDashboard;
