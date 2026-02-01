import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  BookOpen, 
  ChevronDown, 
  GraduationCap, 
  Building2, 
  User, 
  LogOut,
  LayoutDashboard,
  Menu,
  X
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Subject {
  id: string;
  name: string;
}

interface Chapter {
  id: string;
  name: string;
  subject_id: string;
}

export const Navbar = () => {
  const navigate = useNavigate();
  const { user, signOut, userRole } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const isAdmin = userRole === "admin";
  const isContentCreator = userRole === "content_creator";
  const isInstitute = userRole === "institute";

  useEffect(() => {
    fetchSubjects();
    
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (selectedSubject) {
      fetchChapters(selectedSubject);
    }
  }, [selectedSubject]);

  const fetchSubjects = async () => {
    const { data } = await supabase
      .from("subjects")
      .select("id, name")
      .is("institute_id", null)
      .order("name");
    if (data) setSubjects(data);
  };

  const fetchChapters = async (subjectId: string) => {
    const { data } = await supabase
      .from("chapters")
      .select("id, name, subject_id")
      .eq("subject_id", subjectId)
      .order("order_index");
    if (data) setChapters(data);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const getDashboardRoute = () => {
    if (isAdmin) return "/admin";
    if (isContentCreator) return "/content-creator";
    if (isInstitute) return "/institute";
    return "/student";
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-background/95 backdrop-blur-md shadow-md border-b border-border"
          : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <div
            className="flex items-center gap-2 cursor-pointer group"
            onClick={() => navigate("/")}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg group-hover:shadow-glow transition-all duration-300">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className={`text-xl font-bold transition-colors ${isScrolled ? "text-foreground" : "text-white"}`}>
              SkillSharp
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {/* Subjects Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className={`gap-1 ${isScrolled ? "text-foreground hover:bg-muted" : "text-white/90 hover:text-white hover:bg-white/10"}`}
                >
                  <GraduationCap className="w-4 h-4" />
                  Subjects
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-popover border border-border shadow-lg">
                <DropdownMenuLabel>Browse Subjects</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {subjects.length === 0 ? (
                  <DropdownMenuItem disabled>No subjects available</DropdownMenuItem>
                ) : (
                  subjects.map((subject) => (
                    <DropdownMenuItem
                      key={subject.id}
                      onClick={() => {
                        if (user) {
                          navigate("/student");
                        } else {
                          navigate("/auth");
                        }
                      }}
                      className="cursor-pointer"
                    >
                      {subject.name}
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Chapters Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className={`gap-1 ${isScrolled ? "text-foreground hover:bg-muted" : "text-white/90 hover:text-white hover:bg-white/10"}`}
                >
                  <BookOpen className="w-4 h-4" />
                  Chapters
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64 bg-popover border border-border shadow-lg max-h-80 overflow-y-auto">
                <DropdownMenuLabel>Select Subject First</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {subjects.map((subject) => (
                  <DropdownMenuItem
                    key={subject.id}
                    onClick={() => {
                      setSelectedSubject(subject.id);
                      if (user) {
                        navigate("/student");
                      } else {
                        navigate("/auth");
                      }
                    }}
                    className="cursor-pointer"
                  >
                    <span className="font-medium">{subject.name}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Institutes */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className={`gap-1 ${isScrolled ? "text-foreground hover:bg-muted" : "text-white/90 hover:text-white hover:bg-white/10"}`}
                >
                  <Building2 className="w-4 h-4" />
                  Institutes
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-popover border border-border shadow-lg">
                <DropdownMenuLabel>Institute Options</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => user ? navigate("/student") : navigate("/auth")}
                  className="cursor-pointer"
                >
                  Join an Institute
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => navigate("/auth")}
                  className="cursor-pointer"
                >
                  Register as Institute
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Auth Section */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className={`gap-2 ${isScrolled ? "text-foreground hover:bg-muted" : "text-white/90 hover:text-white hover:bg-white/10"}`}
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-popover border border-border shadow-lg">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => navigate(getDashboardRoute())}
                    className="cursor-pointer"
                  >
                    <LayoutDashboard className="w-4 h-4 mr-2" />
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="cursor-pointer text-destructive focus:text-destructive"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button
                  variant="ghost"
                  onClick={() => navigate("/auth")}
                  className={isScrolled ? "text-foreground hover:bg-muted" : "text-white/90 hover:text-white hover:bg-white/10"}
                >
                  Sign In
                </Button>
                <Button
                  onClick={() => navigate("/auth")}
                  className="bg-white text-primary hover:bg-white/90 shadow-md"
                >
                  Get Started
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className={`md:hidden ${isScrolled ? "text-foreground" : "text-white"}`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-background border-b border-border shadow-lg animate-in slide-in-from-top-2">
            <div className="p-4 space-y-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between">
                    <span className="flex items-center gap-2">
                      <GraduationCap className="w-4 h-4" />
                      Subjects
                    </span>
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-full bg-popover border border-border shadow-lg">
                  {subjects.map((subject) => (
                    <DropdownMenuItem
                      key={subject.id}
                      onClick={() => {
                        setMobileMenuOpen(false);
                        user ? navigate("/student") : navigate("/auth");
                      }}
                    >
                      {subject.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between">
                    <span className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      Chapters
                    </span>
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-full bg-popover border border-border shadow-lg">
                  {subjects.map((subject) => (
                    <DropdownMenuItem
                      key={subject.id}
                      onClick={() => {
                        setMobileMenuOpen(false);
                        user ? navigate("/student") : navigate("/auth");
                      }}
                    >
                      {subject.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between">
                    <span className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      Institutes
                    </span>
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-full bg-popover border border-border shadow-lg">
                  <DropdownMenuItem onClick={() => { setMobileMenuOpen(false); user ? navigate("/student") : navigate("/auth"); }}>
                    Join an Institute
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { setMobileMenuOpen(false); navigate("/auth"); }}>
                    Register as Institute
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="pt-4 border-t border-border space-y-2">
                {user ? (
                  <>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => { setMobileMenuOpen(false); navigate(getDashboardRoute()); }}
                    >
                      <LayoutDashboard className="w-4 h-4 mr-2" />
                      Dashboard
                    </Button>
                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={() => { setMobileMenuOpen(false); handleSignOut(); }}
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => { setMobileMenuOpen(false); navigate("/auth"); }}
                    >
                      Sign In
                    </Button>
                    <Button
                      className="w-full"
                      onClick={() => { setMobileMenuOpen(false); navigate("/auth"); }}
                    >
                      Get Started
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
