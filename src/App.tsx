import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import AdminDashboard from "./pages/AdminDashboard";
import ContentCreatorDashboard from "./pages/ContentCreatorDashboard";
import InstituteDashboard from "./pages/InstituteDashboard";
import InstituteExamDetails from "./pages/InstituteExamDetails";
import ExamAnalytics from "./pages/ExamAnalytics";
import StudentHome from "./pages/StudentHome";
import StudentSubjects from "./pages/StudentSubjects";
import StudentSubjectDetails from "./pages/StudentSubjectDetails";

import StudentProfile from "./pages/StudentProfile";
import StudentExamInterface from "./pages/StudentExamInterface";
import TestInterface from "./pages/TestInterface";
import StudentInstitutes from "./pages/StudentInstitutes";
import StudentExams from "./pages/StudentExams";
import StudentPayments from "./pages/StudentPayments";
import Leaderboard from "./pages/Leaderboard";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import PageTransition from "./components/PageTransition";
import TopLoader from "./components/TopLoader";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10,  // 10 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <TopLoader />
        <PageTransition>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/content-creator"
              element={
                <ProtectedRoute requireContentCreator>
                  <ContentCreatorDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/institute"
              element={
                <ProtectedRoute requireInstitute>
                  <InstituteDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/institute/exam/:examId"
              element={
                <ProtectedRoute requireInstitute>
                  <InstituteExamDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="/institute/exam/:examId/analytics"
              element={
                <ProtectedRoute requireInstitute>
                  <ExamAnalytics />
                </ProtectedRoute>
              }
            />
            <Route
              path="/exam/:examId"
              element={
                <ProtectedRoute>
                  <StudentExamInterface />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student"
              element={
                <ProtectedRoute>
                  <StudentHome />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/subjects"
              element={
                <ProtectedRoute>
                  <StudentSubjects />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/subject/:subjectId"
              element={
                <ProtectedRoute>
                  <StudentSubjectDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/institutes"
              element={
                <ProtectedRoute>
                  <StudentInstitutes />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/exams"
              element={
                <ProtectedRoute>
                  <StudentExams />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/exams"
              element={
                <ProtectedRoute>
                  <StudentExams />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/profile"
              element={
                <ProtectedRoute>
                  <StudentProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/payments"
              element={
                <ProtectedRoute>
                  <StudentPayments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/leaderboard"
              element={
                <ProtectedRoute>
                  <Leaderboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/test/:chapterId"
              element={
                <ProtectedRoute>
                  <TestInterface />
                </ProtectedRoute>
              }
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </PageTransition>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
