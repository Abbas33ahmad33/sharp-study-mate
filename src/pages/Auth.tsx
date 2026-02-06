import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  BookOpen,
  LogIn,
  UserPlus,
  Building2,
  GraduationCap,
  Eye,
  EyeOff,
  ArrowLeft,
  Sparkles,
  Shield,
  Users
} from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [signupType, setSignupType] = useState<"student" | "institute" | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Login states
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Student signup states
  const [studentName, setStudentName] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [studentPassword, setStudentPassword] = useState("");
  const [studentMobile, setStudentMobile] = useState("");
  const [instituteCode, setInstituteCode] = useState("");

  // Institute signup states
  const [instituteName, setInstituteName] = useState("");
  const [instituteEmail, setInstituteEmail] = useState("");
  const [institutePassword, setInstitutePassword] = useState("");

  const [resetEmail, setResetEmail] = useState("");
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    const instituteParam = searchParams.get("institute");
    const examParam = searchParams.get("exam");

    if (instituteParam) {
      setInstituteCode(instituteParam);
      setSignupType("student");
    }

    if (examParam) {
      localStorage.setItem("pending_exam_code", examParam);
    }

    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get('type');

    if (type === 'recovery') {
      setIsPasswordRecovery(true);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        checkUserRoleAndRedirect(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        checkUserRoleAndRedirect(session.user.id);
      } else if (event === "PASSWORD_RECOVERY") {
        setIsPasswordRecovery(true);
      }
    });

    return () => subscription.unsubscribe();
  }, [searchParams]);

  const checkUserRoleAndRedirect = async (userId: string) => {
    const pendingExamCode = localStorage.getItem("pending_exam_code");
    if (pendingExamCode) {
      await enrollInExam(userId, pendingExamCode);
      localStorage.removeItem("pending_exam_code");
    }

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    if (roles && roles.length > 0) {
      const isAdmin = roles.some((r) => r.role === "admin");
      const isInstitute = roles.some((r) => r.role === "institute");
      const isContentCreator = roles.some((r) => r.role === "content_creator");

      if (isAdmin) navigate("/admin");
      else if (isInstitute) navigate("/institute");
      else if (isContentCreator) navigate("/content-creator");
      else navigate("/student");
    } else {
      navigate("/student");
    }
  };

  const enrollInExam = async (userId: string, examCode: string) => {
    try {
      const { data: exam } = await supabase
        .from("institute_exams")
        .select("id")
        .eq("exam_code", examCode)
        .single();

      if (exam) {
        await supabase.from("exam_enrollments").insert({
          exam_id: exam.id,
          student_id: userId,
        });
        toast.success("You've been enrolled in the exam!");
      }
    } catch (error) {
      console.error("Error enrolling in exam:", error);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });

      if (error) throw error;

      if (data.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("is_active")
          .eq("id", data.user.id)
          .single();

        if (profile && !profile.is_active) {
          await supabase.auth.signOut({ scope: 'global' });
          toast.error("Your account has been blocked. Please contact support.");
          setLoading(false);
          return;
        }
      }

      toast.success("Welcome back!");
    } catch (error: any) {
      toast.error(error.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleStudentSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: studentEmail,
        password: studentPassword,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: studentName,
            mobile_number: studentMobile,
            user_type: "student",
          },
        },
      });

      if (authError) throw authError;

      if (instituteCode && authData.user) {
        const { data: institute } = await supabase
          .from("institutes")
          .select("id")
          .eq("institute_code", instituteCode)
          .single();

        if (institute) {
          await supabase.from("institute_students").insert({
            institute_id: institute.id,
            student_id: authData.user.id,
            is_approved: false,
          });
          toast.success("Account created! Waiting for institute approval.");
        } else {
          toast.warning("Account created, but institute code not found.");
        }
      } else {
        toast.success("Account created successfully!");
      }
    } catch (error: any) {
      toast.error(error.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  const handleInstituteSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: codeData } = await supabase.rpc("generate_institute_code");

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: instituteEmail,
        password: institutePassword,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: instituteName,
            user_type: "institute",
          },
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        const { error: instituteError } = await supabase.from("institutes").insert({
          name: instituteName,
          email: instituteEmail,
          institute_code: codeData,
          created_by: authData.user.id,
        });

        if (instituteError) {
          toast.error("Failed to create institute record");
          return;
        }

        toast.success("Institute registered successfully!");
      }
    } catch (error: any) {
      toast.error(error.message || "Institute signup failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/auth`,
      });

      if (error) throw error;
      toast.success("Password reset email sent!");
      setShowResetPassword(false);
      setResetEmail("");
    } catch (error: any) {
      toast.error(error.message || "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success("Password updated successfully!");
      setIsPasswordRecovery(false);
      setNewPassword("");
      window.history.replaceState(null, "", window.location.pathname);
    } catch (error: any) {
      toast.error(error.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  // Password recovery UI
  if (isPasswordRecovery) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-glow bg-gradient-animated p-4 safe-top safe-bottom">
        <div className="w-full max-w-md animate-fade-in">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-hero shadow-glow mb-4">
              <BookOpen className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold text-gradient">SkillSharp</h1>
            <p className="text-muted-foreground mt-2">Set your new password</p>
          </div>

          <Card className="shadow-elevated border-0 bg-card/95 backdrop-blur-xl">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-xl">Update Password</CardTitle>
              <CardDescription>Enter your new password below</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label className="label-float">New Password</Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={6}
                      className="input-premium pr-12"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                <Button type="submit" className="w-full h-12 btn-touch text-base font-semibold" disabled={loading}>
                  {loading ? "Updating..." : "Update Password"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Main auth UI
  if (!signupType && searchParams.get("institute") === null) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-glow bg-gradient-animated safe-top safe-bottom">
        {/* Header */}
        <div className="flex items-center justify-center pt-8 pb-4 px-4">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-hero shadow-glow mb-4 animate-pulse-glow">
              <BookOpen className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold text-gradient">SkillSharp</h1>
            <p className="text-muted-foreground mt-1 text-sm">Master MCQs with instant feedback</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex items-start justify-center px-4 pt-4 pb-8">
          <div className="w-full max-w-md animate-slide-up">
            <Card className="shadow-elevated border-0 bg-card/95 backdrop-blur-xl overflow-hidden">
              <CardContent className="p-0">
                <Tabs defaultValue="login" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 rounded-none bg-muted/50 p-1 h-14">
                    <TabsTrigger value="login" className="h-12 text-base font-medium rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm">
                      Sign In
                    </TabsTrigger>
                    <TabsTrigger value="signup" className="h-12 text-base font-medium rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm">
                      Sign Up
                    </TabsTrigger>
                  </TabsList>

                  <div className="p-6">
                    <TabsContent value="login" className="mt-0">
                      <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                          <Label className="label-float">Email</Label>
                          <Input
                            type="email"
                            placeholder="your@email.com"
                            value={loginEmail}
                            onChange={(e) => setLoginEmail(e.target.value)}
                            required
                            className="input-premium"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="label-float">Password</Label>
                          <div className="relative">
                            <Input
                              type={showPassword ? "text" : "password"}
                              placeholder="••••••••"
                              value={loginPassword}
                              onChange={(e) => setLoginPassword(e.target.value)}
                              required
                              className="input-premium pr-12"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </Button>
                          </div>
                        </div>
                        <Button type="submit" className="w-full h-12 btn-touch text-base font-semibold" disabled={loading}>
                          <LogIn className="mr-2 h-5 w-5" />
                          {loading ? "Signing in..." : "Sign In"}
                        </Button>
                        <Button
                          type="button"
                          variant="link"
                          className="w-full text-sm"
                          onClick={() => setShowResetPassword(true)}
                        >
                          Forgot Password?
                        </Button>
                      </form>
                    </TabsContent>

                    <TabsContent value="signup" className="mt-0">
                      <div className="space-y-4">
                        <p className="text-center text-muted-foreground text-sm">
                          Choose how you want to register
                        </p>

                        <Button
                          variant="outline"
                          className="w-full h-auto py-5 flex items-center gap-4 justify-start px-5 border-2 hover:border-primary/50 hover:bg-primary/5 transition-all btn-touch"
                          onClick={() => setSignupType("student")}
                        >
                          <div className="w-12 h-12 rounded-xl bg-gradient-hero flex items-center justify-center shrink-0">
                            <GraduationCap className="w-6 h-6 text-primary-foreground" />
                          </div>
                          <div className="text-left">
                            <span className="font-semibold text-base block">Student</span>
                            <span className="text-muted-foreground text-xs">Practice MCQs & take exams</span>
                          </div>
                        </Button>

                        <Button
                          variant="outline"
                          className="w-full h-auto py-5 flex items-center gap-4 justify-start px-5 border-2 hover:border-secondary/50 hover:bg-secondary/5 transition-all btn-touch"
                          onClick={() => setSignupType("institute")}
                        >
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-secondary to-accent flex items-center justify-center shrink-0">
                            <Building2 className="w-6 h-6 text-secondary-foreground" />
                          </div>
                          <div className="text-left">
                            <span className="font-semibold text-base block">Institute</span>
                            <span className="text-muted-foreground text-xs">Create exams & manage students</span>
                          </div>
                        </Button>
                      </div>
                    </TabsContent>
                  </div>
                </Tabs>
              </CardContent>
            </Card>

            {/* Reset Password Modal */}
            {showResetPassword && (
              <Card className="shadow-elevated border-0 bg-card/95 backdrop-blur-xl mt-4 animate-scale-in">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Reset Password</CardTitle>
                  <CardDescription>We'll send you a reset link</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleResetPassword} className="space-y-4">
                    <div className="space-y-2">
                      <Label className="label-float">Email</Label>
                      <Input
                        type="email"
                        placeholder="your@email.com"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        required
                        className="input-premium"
                      />
                    </div>
                    <div className="flex gap-3">
                      <Button type="submit" className="flex-1 h-12 btn-touch" disabled={loading}>
                        {loading ? "Sending..." : "Send Link"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="h-12 btn-touch"
                        onClick={() => setShowResetPassword(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Features */}
            <div className="mt-8 grid grid-cols-3 gap-3">
              <div className="text-center p-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <p className="text-xs text-muted-foreground">Instant Feedback</p>
              </div>
              <div className="text-center p-3">
                <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center mx-auto mb-2">
                  <Shield className="w-5 h-5 text-secondary" />
                </div>
                <p className="text-xs text-muted-foreground">Secure Platform</p>
              </div>
              <div className="text-center p-3">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center mx-auto mb-2">
                  <Users className="w-5 h-5 text-accent" />
                </div>
                <p className="text-xs text-muted-foreground">For Everyone</p>
              </div>
            </div>

            <div className="text-center mt-6">
              <Button variant="link" onClick={() => navigate("/")} className="text-muted-foreground">
                Back to Home
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Student or Institute signup form
  return (
    <div className="min-h-screen flex flex-col bg-gradient-glow bg-gradient-animated safe-top safe-bottom">
      {/* Header with back button */}
      <div className="flex items-center justify-between p-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSignupType(null)}
          className="w-10 h-10 rounded-full"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-hero flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-bold">SkillSharp</span>
        </div>
        <div className="w-10" />
      </div>

      {/* Form Content */}
      <div className="flex-1 flex items-start justify-center px-4 pt-4 pb-8">
        <div className="w-full max-w-md animate-slide-up">
          <div className="text-center mb-6">
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 ${signupType === "student" ? "bg-gradient-hero" : "bg-gradient-to-br from-secondary to-accent"
              }`}>
              {signupType === "student" ? (
                <GraduationCap className="w-8 h-8 text-primary-foreground" />
              ) : (
                <Building2 className="w-8 h-8 text-secondary-foreground" />
              )}
            </div>
            <h2 className="text-2xl font-bold">
              {signupType === "student" ? "Student Registration" : "Institute Registration"}
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              {signupType === "student"
                ? "Create your account to start learning"
                : "Register your institute to manage exams"
              }
            </p>
          </div>

          <Card className="shadow-elevated border-0 bg-card/95 backdrop-blur-xl">
            <CardContent className="p-6">
              {signupType === "student" ? (
                <form onSubmit={handleStudentSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="label-float">Full Name</Label>
                    <Input
                      placeholder="Enter your full name"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      required
                      className="input-premium"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="label-float">Email</Label>
                    <Input
                      type="email"
                      placeholder="your@email.com"
                      value={studentEmail}
                      onChange={(e) => setStudentEmail(e.target.value)}
                      required
                      className="input-premium"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="label-float">Mobile Number</Label>
                    <Input
                      type="tel"
                      placeholder="Your mobile number"
                      value={studentMobile}
                      onChange={(e) => setStudentMobile(e.target.value)}
                      className="input-premium"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="label-float">Password</Label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Min. 6 characters"
                        value={studentPassword}
                        onChange={(e) => setStudentPassword(e.target.value)}
                        required
                        minLength={6}
                        className="input-premium pr-12"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="label-float">Institute Code (Optional)</Label>
                    <Input
                      placeholder="Enter if joining an institute"
                      value={instituteCode}
                      onChange={(e) => setInstituteCode(e.target.value)}
                      className="input-premium font-mono"
                    />
                  </div>
                  <Button type="submit" className="w-full h-12 btn-touch text-base font-semibold mt-6" disabled={loading}>
                    <UserPlus className="mr-2 h-5 w-5" />
                    {loading ? "Creating Account..." : "Create Account"}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleInstituteSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="label-float">Institute Name</Label>
                    <Input
                      placeholder="Your institute name"
                      value={instituteName}
                      onChange={(e) => setInstituteName(e.target.value)}
                      required
                      className="input-premium"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="label-float">Email</Label>
                    <Input
                      type="email"
                      placeholder="institute@email.com"
                      value={instituteEmail}
                      onChange={(e) => setInstituteEmail(e.target.value)}
                      required
                      className="input-premium"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="label-float">Password</Label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Min. 6 characters"
                        value={institutePassword}
                        onChange={(e) => setInstitutePassword(e.target.value)}
                        required
                        minLength={6}
                        className="input-premium pr-12"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full h-12 btn-touch text-base font-semibold mt-6" disabled={loading}>
                    <Building2 className="mr-2 h-5 w-5" />
                    {loading ? "Registering..." : "Register Institute"}
                  </Button>
                </form>
              )}

              <div className="mt-6 text-center">
                <Button variant="link" onClick={() => setSignupType(null)} className="text-muted-foreground">
                  ← Back to options
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Auth;
