import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, FolderOpen, FileQuestion, Users, Building2, DollarSign } from "lucide-react";
import SubjectsManager from "@/components/admin/SubjectsManager";
import ChaptersManager from "@/components/admin/ChaptersManager";
import MCQsManager from "@/components/admin/MCQsManager";
import UsersManager from "@/components/admin/UsersManager";
import AnnouncementsManager from "@/components/admin/AnnouncementsManager";
import InstitutesManager from "@/components/admin/InstitutesManager";
import PaymentRequestsManager from "@/components/admin/PaymentRequestsManager";
import AppNavbar from "@/components/AppNavbar";

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    subjects: 0,
    chapters: 0,
    mcqs: 0,
    students: 0,
    institutes: 0,
    payment_requests: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const [subjects, chapters, mcqs, students, institutes, paymentRequests] = await Promise.all([
      supabase.from("subjects").select("id", { count: "exact", head: true }),
      supabase.from("chapters").select("id", { count: "exact", head: true }),
      supabase.from("mcqs").select("id", { count: "exact", head: true }),
      supabase.from("user_roles").select("id", { count: "exact", head: true }).eq("role", "student"),
      supabase.from("institutes").select("id", { count: "exact", head: true }),
      supabase.from("payment_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
    ]);

    setStats({
      subjects: subjects.count || 0,
      chapters: chapters.count || 0,
      mcqs: mcqs.count || 0,
      students: students.count || 0,
      institutes: institutes.count || 0,
      payment_requests: paymentRequests.count || 0,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-glow">
      <AppNavbar />

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4 mb-4 sm:mb-8">
          <Card className="shadow-card bg-gradient-card border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Subjects</CardTitle>
              <BookOpen className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.subjects}</div>
            </CardContent>
          </Card>

          <Card className="shadow-card bg-gradient-card border-secondary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Chapters</CardTitle>
              <FolderOpen className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.chapters}</div>
            </CardContent>
          </Card>

          <Card className="shadow-card bg-gradient-card border-accent/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total MCQs</CardTitle>
              <FileQuestion className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.mcqs}</div>
            </CardContent>
          </Card>

          <Card className="shadow-card bg-gradient-card border-success/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Registered Students</CardTitle>
              <Users className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.students}</div>
            </CardContent>
          </Card>

          <Card className="shadow-card bg-gradient-card border-info/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Institutes</CardTitle>
              <Building2 className="h-4 w-4 text-info" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.institutes}</div>
            </CardContent>
          </Card>

          <Card className="shadow-card bg-gradient-card border-yellow-500/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
              <DollarSign className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-700">{stats.payment_requests}</div>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="px-3 sm:px-6">
            <CardTitle className="text-lg sm:text-xl">Content Management</CardTitle>
            <CardDescription className="text-sm">Manage subjects, chapters, and MCQs</CardDescription>
          </CardHeader>
          <CardContent className="px-2 sm:px-6">
            <Tabs defaultValue="subjects" className="w-full">
              <div className="overflow-x-auto -mx-2 px-2 pb-2">
                <TabsList className="inline-flex w-auto min-w-full sm:grid sm:w-full sm:grid-cols-7 gap-1">
                  <TabsTrigger value="subjects" className="text-xs sm:text-sm whitespace-nowrap">Subjects</TabsTrigger>
                  <TabsTrigger value="chapters" className="text-xs sm:text-sm whitespace-nowrap">Chapters</TabsTrigger>
                  <TabsTrigger value="mcqs" className="text-xs sm:text-sm whitespace-nowrap">MCQs</TabsTrigger>
                  <TabsTrigger value="users" className="text-xs sm:text-sm whitespace-nowrap">Users</TabsTrigger>
                  <TabsTrigger value="institutes" className="text-xs sm:text-sm whitespace-nowrap">Institutes</TabsTrigger>
                  <TabsTrigger value="announcements" className="text-xs sm:text-sm whitespace-nowrap">Announce</TabsTrigger>
                  <TabsTrigger value="payments" className="text-xs sm:text-sm whitespace-nowrap">Payments</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="subjects" className="mt-6">
                <SubjectsManager onUpdate={fetchStats} />
              </TabsContent>

              <TabsContent value="chapters" className="mt-6">
                <ChaptersManager onUpdate={fetchStats} />
              </TabsContent>

              <TabsContent value="mcqs" className="mt-6">
                <MCQsManager onUpdate={fetchStats} />
              </TabsContent>

              <TabsContent value="users" className="mt-6">
                <UsersManager />
              </TabsContent>

              <TabsContent value="institutes" className="mt-6">
                <InstitutesManager />
              </TabsContent>

              <TabsContent value="announcements" className="mt-6">
                <AnnouncementsManager />
              </TabsContent>

              <TabsContent value="payments" className="mt-6">
                <PaymentRequestsManager />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AdminDashboard;