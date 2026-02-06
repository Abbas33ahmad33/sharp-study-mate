import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Target, TrendingUp, Award, Megaphone, Users, CheckCircle, ArrowRight, Sparkles, Zap, Shield, Globe } from "lucide-react";
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
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    fetchAnnouncements();
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
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
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20 selection:text-primary overflow-x-hidden">
      <Navbar />

      {/* 🌟 HERO SECTION */}
      <section className="relative min-h-[100dvh] flex items-center justify-center pt-20 overflow-hidden">
        {/* Dynamic Mesh Background */}
        <div className="absolute inset-0 z-0 opacity-40 dark:opacity-20 pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] bg-purple-500/30 rounded-full blur-[120px] animate-blob mix-blend-multiply dark:mix-blend-screen will-change-transform" />
          <div className="absolute top-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-blue-500/30 rounded-full blur-[120px] animate-blob animation-delay-2000 mix-blend-multiply dark:mix-blend-screen will-change-transform" />
          <div className="absolute bottom-[-20%] left-[20%] w-[60vw] h-[60vw] bg-pink-500/30 rounded-full blur-[120px] animate-blob animation-delay-4000 mix-blend-multiply dark:mix-blend-screen will-change-transform" />
        </div>

        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px] z-0 pointer-events-none"></div>

        <div className="container relative z-10 px-4 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-background/50 backdrop-blur-md border border-border shadow-sm mb-8 hover:bg-background/80 transition-all cursor-default animate-fade-in-up">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">The #1 MCQ Platform</span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tighter text-slate-900 dark:text-white mb-6 animate-fade-in-up animation-delay-100">
            Master Every <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 animate-gradient-x">Challenge.</span>
          </h1>

          <p className="text-lg sm:text-2xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-in-up animation-delay-200">
            Experience the future of learning with instant feedback, AI-driven analytics, and a community of top achievers.
          </p>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up animation-delay-300">
            <Button
              size="lg"
              onClick={() => navigate("/auth")}
              className="w-full sm:w-auto h-14 px-8 text-lg rounded-2xl bg-slate-900 text-white hover:bg-slate-800 hover:scale-105 transition-all shadow-xl shadow-slate-900/20 active:scale-95"
            >
              Start Learning Free
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/auth")}
              className="w-full sm:w-auto h-14 px-8 text-lg rounded-2xl border-2 hover:bg-muted/50 transition-all active:scale-95"
            >
              Explore Institutes
            </Button>
          </div>

          {/* Floating UI Elements (Decorative) */}
          <div className="absolute top-1/2 left-0 -translate-y-1/2 -translate-x-12 hidden lg:block opacity-80 animate-float-slow">
            <Card className="w-64 p-4 border-l-4 border-l-green-500 shadow-2xl skew-y-3 bg-white/90 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-bold text-sm">Correct Answer!</p>
                  <p className="text-xs text-muted-foreground">+50 points earned</p>
                </div>
              </div>
            </Card>
          </div>

          <div className="absolute top-1/3 right-0 -translate-y-1/2 translate-x-12 hidden lg:block opacity-80 animate-float-delayed">
            <Card className="w-64 p-4 border-l-4 border-l-blue-500 shadow-2xl -skew-y-3 bg-white/90 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-bold text-sm">Daily Streak</p>
                  <p className="text-xs text-muted-foreground">🔥 7 Day Streak!</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* 📢 ANNOUNCEMENTS */}
      {announcements.length > 0 && (
        <section className="py-8 bg-muted/30 border-y border-border/50">
          <div className="container mx-auto px-4">
            {announcements.map((msg) => (
              <div key={msg.id} className="max-w-4xl mx-auto flex items-start sm:items-center gap-4 p-4 rounded-2xl bg-background border border-border shadow-sm">
                <div className="p-2 bg-primary/10 rounded-xl shrink-0">
                  <Megaphone className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-sm sm:text-base">{msg.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 md:line-clamp-none">{msg.message}</p>
                </div>
                <Button size="sm" variant="ghost" className="shrink-0" onClick={() => navigate("/student")}>View</Button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 🍱 BENTO GRID FEATURES */}
      <section className="py-24 relative">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight mb-4">Everything you need to <span className="text-primary">excel.</span></h2>
            <p className="text-lg text-muted-foreground">We've built the most powerful platform for students to practice, track, and improve.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-6xl mx-auto">
            {/* Feature 1 - Large Left */}
            <div className="md:col-span-2 group relative overflow-hidden rounded-[2.5rem] bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 hover:shadow-2xl transition-all duration-500">
              <div className="relative z-10 flex flex-col h-full justify-between">
                <div className="mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-4">
                    <Target className="w-6 h-6 text-blue-500" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Precision Learning</h3>
                  <p className="text-muted-foreground max-w-md">Our AI analyzes your performance to suggest the exact topics you need to focus on next.</p>
                </div>
                <div className="w-full bg-white dark:bg-slate-800 rounded-xl p-4 shadow-lg border border-slate-200 dark:border-slate-700 transform group-hover:scale-[1.02] transition-transform duration-500">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-bold text-slate-500">Progress</span>
                    <span className="text-sm font-bold text-blue-500">92%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 w-[92%] rounded-full" />
                  </div>
                </div>
              </div>
              <div className="absolute right-[-20%] bottom-[-20%] w-[300px] h-[300px] bg-blue-500/20 blur-[100px] rounded-full group-hover:bg-blue-500/30 transition-colors" />
            </div>

            {/* Feature 2 - Tall Right */}
            <div className="md:row-span-2 group relative overflow-hidden rounded-[2.5rem] bg-slate-900 text-white p-8 hover:shadow-2xl transition-all duration-500">
              <div className="relative z-10 flex flex-col h-full">
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mb-6">
                  <Zap className="w-6 h-6 text-yellow-400" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Instant Feedback</h3>
                <p className="text-slate-400 mb-8">Never wait for results. Get detailed explanations instantly.</p>

                <div className="mt-auto space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                      <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      </div>
                      <div className="w-20 h-2 bg-white/10 rounded-full" />
                      <div className="w-12 h-2 bg-white/10 rounded-full ml-auto" />
                    </div>
                  ))}
                </div>
              </div>
              <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-b from-transparent to-black/50 pointer-events-none" />
            </div>

            {/* Feature 3 - Small */}
            <div className="group relative overflow-hidden rounded-[2.5rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 hover:shadow-xl transition-all duration-500">
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-4">
                  <Award className="w-6 h-6 text-purple-500" />
                </div>
                <h3 className="text-xl font-bold mb-2">Gamified Growth</h3>
                <p className="text-muted-foreground text-sm">Earn badges, keep streaks, and climb the leaderboard.</p>
              </div>
              <div className="absolute right-[-10%] top-[-10%] w-[100px] h-[100px] bg-purple-500/20 blur-[50px] rounded-full" />
            </div>

            {/* Feature 4 - Small */}
            <div className="group relative overflow-hidden rounded-[2.5rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 hover:shadow-xl transition-all duration-500">
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-pink-500/10 flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-pink-500" />
                </div>
                <h3 className="text-xl font-bold mb-2">Community</h3>
                <p className="text-muted-foreground text-sm">Join thousands of students and share your journey.</p>
              </div>
              <div className="absolute left-[-10%] bottom-[-10%] w-[100px] h-[100px] bg-pink-500/20 blur-[50px] rounded-full" />
            </div>
          </div>
        </div>
      </section>

      {/* 🌍 STATS SECTION */}
      <section className="py-20 border-y border-border/40 bg-slate-50 dark:bg-slate-900/50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: "Active Students", value: "10,000+", icon: Users },
              { label: "Questions Solved", value: "1.2M+", icon: Target },
              { label: "Institutes", value: "500+", icon: Globe },
              { label: "Success Rate", value: "98%", icon: TrendingUp },
            ].map((stat, i) => (
              <div key={i} className="text-center group cursor-default">
                <div className="w-12 h-12 mx-auto mb-4 bg-background rounded-2xl shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <stat.icon className="w-6 h-6 text-primary" />
                </div>
                <div className="text-3xl sm:text-4xl font-black tracking-tight mb-1">{stat.value}</div>
                <div className="text-sm font-bold uppercase tracking-widest text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 bg-background border-t border-border">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold">S</div>
            <span className="font-bold text-lg">SkillSharp</span>
          </div>
          <div className="text-sm text-muted-foreground text-center md:text-right">
            &copy; {new Date().getFullYear()} SkillSharp. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
