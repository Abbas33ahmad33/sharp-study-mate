import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Target, TrendingUp, Award, Megaphone, Users, CheckCircle, ArrowRight, Sparkles } from "lucide-react";
import heroImage from "@/assets/hero-bg.jpg";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";

interface Announcement {
  id: string;
  title: string;
  message: string;
  contact_info: string | null;
}

const Index = () => {
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    const { data } = await supabase
      .from("announcements")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1);

    if (data) setAnnouncements(data);
  };

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <Navbar />

      {/* Hero Section - Mobile Optimized */}
      <section
        className="relative min-h-[100dvh] flex items-center justify-center bg-cover bg-center"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-secondary/80 to-accent/70" />
        
        {/* Animated background elements - hidden on mobile for performance */}
        <div className="absolute inset-0 overflow-hidden hidden sm:block">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-white/5 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        <div className="relative z-10 container mx-auto px-4 text-center text-white pt-16 sm:pt-20 pb-20">
          {/* Trust badge - smaller on mobile */}
          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white/10 backdrop-blur-sm rounded-full mb-6 sm:mb-8 border border-white/20">
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="text-xs sm:text-sm font-medium">Trusted by 10,000+ Students</span>
          </div>
          
          {/* Logo and Title - stacked on mobile */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20 shadow-2xl">
              <BookOpen className="w-7 h-7 sm:w-10 sm:h-10" />
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight">SkillSharp</h1>
          </div>
          
          {/* Tagline - responsive sizing */}
          <p className="text-lg sm:text-2xl md:text-3xl mb-3 sm:mb-4 font-light px-2">
            Master MCQs with <span className="font-semibold text-accent">Instant Feedback</span>
          </p>
          <p className="text-sm sm:text-lg md:text-xl mb-8 sm:mb-12 text-white/80 max-w-2xl mx-auto leading-relaxed px-4">
            The comprehensive MCQ platform designed to help students practice, learn, and excel
          </p>
          
          {/* CTA Buttons - full width on mobile */}
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 justify-center px-4 sm:px-0">
            <Button
              size="lg"
              onClick={() => navigate("/auth")}
              className="w-full sm:w-auto text-base sm:text-lg bg-white text-primary hover:bg-white/90 shadow-xl hover:shadow-2xl transition-all duration-300 group h-12 sm:h-14"
            >
              Get Started Free
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate("/auth")}
              className="w-full sm:w-auto text-base sm:text-lg bg-white/10 text-white border-white/30 hover:bg-white/20 backdrop-blur-sm h-12 sm:h-14"
            >
              Sign In
            </Button>
          </div>

          {/* Stats - compact on mobile */}
          <div className="mt-10 sm:mt-16 grid grid-cols-3 gap-3 sm:gap-8 max-w-sm sm:max-w-2xl mx-auto">
            <div className="text-center p-2 sm:p-0 rounded-lg sm:rounded-none bg-white/5 sm:bg-transparent">
              <div className="text-xl sm:text-3xl md:text-4xl font-bold mb-0.5 sm:mb-1">500+</div>
              <div className="text-white/70 text-[10px] sm:text-sm">Questions</div>
            </div>
            <div className="text-center p-2 sm:p-0 rounded-lg sm:rounded-none bg-white/5 sm:bg-transparent sm:border-x sm:border-white/20">
              <div className="text-xl sm:text-3xl md:text-4xl font-bold mb-0.5 sm:mb-1">50+</div>
              <div className="text-white/70 text-[10px] sm:text-sm">Subjects</div>
            </div>
            <div className="text-center p-2 sm:p-0 rounded-lg sm:rounded-none bg-white/5 sm:bg-transparent">
              <div className="text-xl sm:text-3xl md:text-4xl font-bold mb-0.5 sm:mb-1">100+</div>
              <div className="text-white/70 text-[10px] sm:text-sm">Institutes</div>
            </div>
          </div>
        </div>

        {/* Scroll indicator - hidden on very small screens */}
        <div className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 animate-bounce hidden xs:block">
          <div className="w-5 h-8 sm:w-6 sm:h-10 rounded-full border-2 border-white/50 flex items-start justify-center p-1.5 sm:p-2">
            <div className="w-1 h-1.5 sm:h-2 bg-white/80 rounded-full" />
          </div>
        </div>
      </section>

      {/* Announcements/Contact Section */}
      {announcements.length > 0 && (
        <section className="py-16 bg-gradient-to-b from-muted/50 to-background">
          <div className="container mx-auto px-4">
            {announcements.map((announcement) => (
              <Card key={announcement.id} className="max-w-3xl mx-auto shadow-xl border-2 border-primary/10 overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-primary via-secondary to-accent" />
                <CardHeader>
                  <CardTitle className="text-2xl flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Megaphone className="w-5 h-5 text-primary" />
                    </div>
                    {announcement.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-lg whitespace-pre-wrap leading-relaxed">{announcement.message}</p>
                  {announcement.contact_info && (
                    <div className="p-4 bg-muted/50 rounded-xl border">
                      <p className="font-semibold mb-2 text-primary">Contact Information:</p>
                      <p className="whitespace-pre-wrap text-muted-foreground">
                        {announcement.contact_info}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Features Section - Mobile Optimized */}
      <section className="py-12 sm:py-24 bg-background relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-muted/30 to-transparent" />
        
        <div className="container mx-auto px-4 relative">
          <div className="text-center mb-8 sm:mb-16">
            <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-primary/10 rounded-full mb-3 sm:mb-4">
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
              <span className="text-xs sm:text-sm font-medium text-primary">Why Choose Us</span>
            </div>
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4 px-4">
              Everything You Need to <span className="text-primary">Excel</span>
            </h2>
            <p className="text-muted-foreground text-sm sm:text-lg max-w-2xl mx-auto px-4">
              A comprehensive platform designed to help students excel in their studies
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-8 max-w-6xl mx-auto">
            <Card className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/20 overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-primary to-primary/50 scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
              <CardContent className="pt-8 text-center">
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Target className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">Instant Feedback</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Get immediate results on every answer with detailed explanations to improve your understanding
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-secondary/20 overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-secondary to-secondary/50 scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
              <CardContent className="pt-8 text-center">
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-secondary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <TrendingUp className="w-8 h-8 text-secondary" />
                </div>
                <h3 className="text-xl font-bold mb-3">Track Progress</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Monitor your performance across subjects and chapters with detailed analytics dashboard
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-accent/20 overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-accent to-accent/50 scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
              <CardContent className="pt-8 text-center">
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-accent/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Award className="w-8 h-8 text-accent" />
                </div>
                <h3 className="text-xl font-bold mb-3">Structured Learning</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Organized content by subjects and chapters for systematic and effective preparation
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section - Mobile Optimized */}
      <section className="py-12 sm:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 sm:mb-16">
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4">
              How It <span className="text-primary">Works</span>
            </h2>
            <p className="text-muted-foreground text-sm sm:text-lg max-w-2xl mx-auto">
              Get started in just three simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-3 max-w-5xl mx-auto">
            {/* Step 1 */}
            <div className="relative flex md:flex-col items-center md:items-stretch gap-4 md:gap-0">
              <div className="w-14 h-14 sm:w-16 sm:h-16 flex-shrink-0 md:mx-auto md:mb-6 rounded-full bg-primary text-white flex items-center justify-center text-xl sm:text-2xl font-bold shadow-lg">
                1
              </div>
              <div className="text-left md:text-center flex-1">
                <h3 className="text-lg sm:text-xl font-bold mb-1 sm:mb-3">Sign Up</h3>
                <p className="text-muted-foreground text-sm sm:text-base">Create your free account in seconds</p>
              </div>
              <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-primary to-transparent" />
            </div>

            {/* Step 2 */}
            <div className="relative flex md:flex-col items-center md:items-stretch gap-4 md:gap-0">
              <div className="w-14 h-14 sm:w-16 sm:h-16 flex-shrink-0 md:mx-auto md:mb-6 rounded-full bg-secondary text-white flex items-center justify-center text-xl sm:text-2xl font-bold shadow-lg">
                2
              </div>
              <div className="text-left md:text-center flex-1">
                <h3 className="text-lg sm:text-xl font-bold mb-1 sm:mb-3">Choose Subject</h3>
                <p className="text-muted-foreground text-sm sm:text-base">Select from our wide range of subjects</p>
              </div>
              <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-secondary to-transparent" />
            </div>

            {/* Step 3 */}
            <div className="flex md:flex-col items-center md:items-stretch gap-4 md:gap-0">
              <div className="w-14 h-14 sm:w-16 sm:h-16 flex-shrink-0 md:mx-auto md:mb-6 rounded-full bg-accent text-white flex items-center justify-center text-xl sm:text-2xl font-bold shadow-lg">
                3
              </div>
              <div className="text-left md:text-center flex-1">
                <h3 className="text-lg sm:text-xl font-bold mb-1 sm:mb-3">Start Learning</h3>
                <p className="text-muted-foreground text-sm sm:text-base">Practice MCQs and track your progress</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section - Mobile Optimized */}
      <section className="py-12 sm:py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-16 items-center max-w-6xl mx-auto">
            <div>
              <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-success/10 rounded-full mb-3 sm:mb-4">
                <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-success" />
                <span className="text-xs sm:text-sm font-medium text-success">Benefits</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-bold mb-4 sm:mb-6">
                Why Students Love <span className="text-primary">SkillSharp</span>
              </h2>
              <div className="space-y-3 sm:space-y-4">
                {[
                  "Practice unlimited MCQs across all subjects",
                  "Get instant feedback with explanations",
                  "Track your progress with analytics",
                  "Join institutes for exclusive content",
                  "Take mock exams to prepare",
                  "Learn at your own pace, anytime",
                ].map((benefit, index) => (
                  <div key={index} className="flex items-center gap-2.5 sm:gap-3">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-success" />
                    </div>
                    <span className="text-sm sm:text-lg">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-3xl blur-3xl" />
              <Card className="relative shadow-2xl border-2 overflow-hidden">
                <div className="h-1.5 sm:h-2 bg-gradient-to-r from-primary via-secondary to-accent" />
                <CardContent className="p-5 sm:p-8">
                  <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                      <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div>
                      <div className="font-bold text-base sm:text-lg">Join 10,000+ Students</div>
                      <div className="text-muted-foreground text-xs sm:text-sm">Learning with SkillSharp</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div className="p-3 sm:p-4 bg-muted/50 rounded-xl text-center">
                      <div className="text-xl sm:text-2xl font-bold text-primary">95%</div>
                      <div className="text-xs sm:text-sm text-muted-foreground">Success Rate</div>
                    </div>
                    <div className="p-3 sm:p-4 bg-muted/50 rounded-xl text-center">
                      <div className="text-xl sm:text-2xl font-bold text-secondary">4.9</div>
                      <div className="text-xs sm:text-sm text-muted-foreground">User Rating</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Mobile Optimized */}
      <section className="py-12 sm:py-24 bg-gradient-to-br from-primary via-secondary to-accent relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        
        <div className="container mx-auto px-4 relative text-center text-white">
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4">Ready to Excel?</h2>
          <p className="text-sm sm:text-xl mb-6 sm:mb-10 text-white/90 max-w-2xl mx-auto px-4">
            Join thousands of students improving their test scores with SkillSharp
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 justify-center px-4 sm:px-0">
            <Button
              size="lg"
              onClick={() => navigate("/auth")}
              className="w-full sm:w-auto text-base sm:text-lg bg-white text-primary hover:bg-white/90 shadow-xl group h-12 sm:h-14"
            >
              Start Learning Now
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate("/auth")}
              className="w-full sm:w-auto text-base sm:text-lg bg-transparent text-white border-white/50 hover:bg-white/10 h-12 sm:h-14"
            >
              Contact Us
            </Button>
          </div>
        </div>
      </section>

      {/* Footer - Mobile Optimized */}
      <footer className="bg-card border-t py-8 sm:py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between sm:gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <span className="text-lg sm:text-xl font-bold">SkillSharp</span>
            </div>
            <p className="text-muted-foreground text-center text-sm sm:text-base">
              &copy; 2025 SkillSharp. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">Privacy</a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">Terms</a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
