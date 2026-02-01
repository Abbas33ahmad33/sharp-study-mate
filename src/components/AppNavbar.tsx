import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
  ChevronRight,
  GraduationCap,
  Building2,
  User,
  LogOut,
  LayoutDashboard,
  Menu,
  Home,
  FileText,
  Users,
  Settings,
  Sparkles,
  Sun,
  Moon,
  Palette
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import ThemeSelector from "@/components/ThemeSelector";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface Subject {
  id: string;
  name: string;
}

interface Chapter {
  id: string;
  name: string;
  subject_id: string;
}

export const AppNavbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut, userRole } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<{ [key: string]: Chapter[] }>({});
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedSubjects, setExpandedSubjects] = useState<{ [key: string]: boolean }>({});

  const isAdmin = userRole === "admin";
  const isContentCreator = userRole === "content_creator";
  const isInstitute = userRole === "institute";

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    const { data } = await supabase
      .from("subjects")
      .select("id, name")
      .is("institute_id", null)
      .order("name");
    if (data) {
      setSubjects(data);
      data.forEach(subject => fetchChaptersForSubject(subject.id));
    }
  };

  const fetchChaptersForSubject = async (subjectId: string) => {
    const { data } = await supabase
      .from("chapters")
      .select("id, name, subject_id")
      .eq("subject_id", subjectId)
      .order("order_index");
    if (data) {
      setChapters(prev => ({ ...prev, [subjectId]: data }));
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success("Logged out successfully");
    navigate("/");
  };

  const getDashboardRoute = () => {
    if (isAdmin) return "/admin";
    if (isContentCreator) return "/content-creator";
    if (isInstitute) return "/institute";
    return "/student";
  };

  const isActive = (path: string) => location.pathname === path;

  const toggleSubjectExpanded = (subjectId: string) => {
    setExpandedSubjects(prev => ({ ...prev, [subjectId]: !prev[subjectId] }));
  };

  const handleChapterClick = (chapterId: string) => {
    setMobileMenuOpen(false);
    navigate(`/test/${chapterId}`);
  };

  const handleNavClick = (path: string) => {
    setMobileMenuOpen(false);
    navigate(path);
  };

  const NavItem = ({ icon: Icon, label, onClick, active }: { icon: any, label: string, onClick: () => void, active?: boolean }) => (
    <Button
      variant={active ? "secondary" : "ghost"}
      size="sm"
      onClick={onClick}
      className={`h-10 gap-2 font-medium transition-all ${active ? 'bg-primary/10 text-primary' : ''}`}
    >
      <Icon className="w-4 h-4" />
      <span className="hidden lg:inline">{label}</span>
    </Button>
  );

  // Mobile navigation item with optional expandable submenu
  const MobileNavSection = ({
    icon: Icon,
    label,
    children,
    onClick
  }: {
    icon: any,
    label: string,
    children?: React.ReactNode,
    onClick?: () => void
  }) => {
    const [isOpen, setIsOpen] = useState(false);

    if (!children) {
      return (
        <Button
          variant="ghost"
          className="w-full justify-start h-14 text-base font-medium gap-3 hover:bg-primary/5 active:bg-primary/10 touch-manipulation"
          onClick={onClick}
        >
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Icon className="w-5 h-5 text-primary" />
          </div>
          <span className="truncate">{label}</span>
        </Button>
      );
    }

    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="w-full justify-between h-14 text-base font-medium gap-3 hover:bg-primary/5 active:bg-primary/10 touch-manipulation"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <span className="truncate">{label}</span>
            </div>
            <ChevronRight className={`w-5 h-5 opacity-60 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pl-4 space-y-1 animate-accordion-down">
          {children}
        </CollapsibleContent>
      </Collapsible>
    );
  };

  // Mobile sub-item for chapters
  const MobileSubItem = ({ label, onClick }: { label: string, onClick: () => void }) => (
    <Button
      variant="ghost"
      size="sm"
      className="w-full justify-start h-12 text-sm font-normal gap-2 pl-14 hover:bg-muted/50 active:bg-muted touch-manipulation"
      onClick={onClick}
    >
      <div className="w-2 h-2 rounded-full bg-primary/40" />
      <span className="truncate">{label}</span>
    </Button>
  );

  return (
    <nav className="sticky top-0 z-50 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 pt-[var(--safe-top)] shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div
            className="flex items-center gap-2.5 cursor-pointer group active:scale-95 transition-transform"
            onClick={() => navigate(getDashboardRoute())}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-hero flex items-center justify-center shadow-md">
              <BookOpen className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-black tracking-tight hidden sm:block">SkillSharp</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            <NavItem
              icon={Home}
              label="Dashboard"
              onClick={() => navigate(getDashboardRoute())}
              active={isActive(getDashboardRoute())}
            />

            {/* Subjects Dropdown - For students */}
            {!isAdmin && !isInstitute && !isContentCreator && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-10 gap-1.5 font-medium">
                    <GraduationCap className="w-4 h-4" />
                    <span className="hidden lg:inline">Subjects</span>
                    <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64 max-h-[70vh] overflow-y-auto bg-popover/95 backdrop-blur-xl border shadow-elevated z-50">
                  <DropdownMenuLabel className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    Browse Subjects
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {subjects.length === 0 ? (
                    <DropdownMenuItem disabled className="text-muted-foreground">No subjects available</DropdownMenuItem>
                  ) : (
                    subjects.map((subject) => (
                      <DropdownMenu key={subject.id}>
                        <DropdownMenuTrigger asChild>
                          <div className="flex items-center justify-between px-2 py-2.5 cursor-pointer hover:bg-muted rounded-md mx-1 transition-colors">
                            <span className="font-medium text-sm">{subject.name}</span>
                            <ChevronDown className="w-4 h-4 opacity-60" />
                          </div>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent side="right" className="w-56 bg-popover/95 backdrop-blur-xl border shadow-elevated z-50">
                          <DropdownMenuLabel>Chapters</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {(chapters[subject.id] || []).length === 0 ? (
                            <DropdownMenuItem disabled>No chapters available</DropdownMenuItem>
                          ) : (
                            (chapters[subject.id] || []).map((chapter) => (
                              <DropdownMenuItem
                                key={chapter.id}
                                onClick={() => navigate(`/test/${chapter.id}`)}
                                className="cursor-pointer"
                              >
                                {chapter.name}
                              </DropdownMenuItem>
                            ))
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Quick Practice - For students */}
            {!isAdmin && !isInstitute && !isContentCreator && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-10 gap-1.5 font-medium">
                    <BookOpen className="w-4 h-4" />
                    <span className="hidden lg:inline">Practice</span>
                    <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64 max-h-[70vh] overflow-y-auto bg-popover/95 backdrop-blur-xl border shadow-elevated z-50">
                  <DropdownMenuLabel>Quick Practice</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {subjects.map((subject) => (
                    <div key={subject.id}>
                      <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">{subject.name}</DropdownMenuLabel>
                      {(chapters[subject.id] || []).map((chapter) => (
                        <DropdownMenuItem
                          key={chapter.id}
                          onClick={() => navigate(`/test/${chapter.id}`)}
                          className="cursor-pointer pl-4"
                        >
                          {chapter.name}
                        </DropdownMenuItem>
                      ))}
                    </div>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Institute Actions - For students */}
            {!isAdmin && !isInstitute && !isContentCreator && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-10 gap-1.5 font-medium">
                    <Building2 className="w-4 h-4" />
                    <span className="hidden lg:inline">Institutes</span>
                    <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-popover/95 backdrop-blur-xl border shadow-elevated z-50">
                  <DropdownMenuLabel>Institute Options</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/student")} className="cursor-pointer gap-2">
                    <Building2 className="w-4 h-4" />
                    My Institutes
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/student")} className="cursor-pointer gap-2">
                    <FileText className="w-4 h-4" />
                    Institute Exams
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Admin-specific menus */}
            {isAdmin && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-10 gap-1.5 font-medium">
                    <Settings className="w-4 h-4" />
                    <span className="hidden lg:inline">Manage</span>
                    <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-popover/95 backdrop-blur-xl border shadow-elevated z-50">
                  <DropdownMenuLabel>Content Management</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/admin")} className="cursor-pointer gap-2">
                    <GraduationCap className="w-4 h-4" /> Subjects
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/admin")} className="cursor-pointer gap-2">
                    <BookOpen className="w-4 h-4" /> Chapters
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/admin")} className="cursor-pointer gap-2">
                    <FileText className="w-4 h-4" /> MCQs
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>User Management</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => navigate("/admin")} className="cursor-pointer gap-2">
                    <Users className="w-4 h-4" /> Users
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/admin")} className="cursor-pointer gap-2">
                    <Building2 className="w-4 h-4" /> Institutes
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Institute-specific menus */}
            {isInstitute && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-10 gap-1.5 font-medium">
                    <Settings className="w-4 h-4" />
                    <span className="hidden lg:inline">Manage</span>
                    <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-popover/95 backdrop-blur-xl border shadow-elevated z-50">
                  <DropdownMenuLabel>Institute Management</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/institute")} className="cursor-pointer gap-2">
                    <Users className="w-4 h-4" /> Students
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/institute")} className="cursor-pointer gap-2">
                    <FileText className="w-4 h-4" /> Exams
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* User Menu & Mobile Toggle */}
          <div className="flex items-center gap-2">
            {/* Theme Selector */}
            <ThemeSelector />

            {/* User Dropdown - Desktop */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-10 gap-2 hidden sm:flex">
                  <div className="w-8 h-8 rounded-full bg-gradient-hero flex items-center justify-center shadow-sm">
                    <User className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-popover/95 backdrop-blur-xl border shadow-elevated z-50">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">My Account</p>
                    <p className="text-xs text-muted-foreground capitalize">{userRole || "Student"}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate(getDashboardRoute())} className="cursor-pointer gap-2">
                  <LayoutDashboard className="w-4 h-4" /> Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/")} className="cursor-pointer gap-2">
                  <Home className="w-4 h-4" /> Home Page
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="cursor-pointer text-destructive focus:text-destructive gap-2"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Menu Button */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden w-10 h-10"
                >
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[85vw] max-w-sm p-0 bg-white dark:bg-slate-900 shadow-2xl border-r">
                <div className="flex flex-col h-full">
                  {/* Mobile Header */}
                  <div className="p-4 border-b flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-hero flex items-center justify-center">
                        <User className="w-5 h-5 text-primary-foreground" />
                      </div>
                      <div>
                        <p className="font-semibold">My Account</p>
                        <p className="text-xs text-muted-foreground capitalize">{userRole || "Student"}</p>
                      </div>
                    </div>
                    {/* Theme toggle in mobile header */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleTheme}
                      className="w-10 h-10 rounded-full"
                    >
                      {theme === "light" ? (
                        <Moon className="w-5 h-5" />
                      ) : (
                        <Sun className="w-5 h-5" />
                      )}
                    </Button>
                  </div>

                  {/* Mobile Nav Items */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-1">
                    {/* Dashboard - Always visible */}
                    <MobileNavSection
                      icon={Home}
                      label="Dashboard"
                      onClick={() => handleNavClick(getDashboardRoute())}
                    />

                    {/* Student-specific navigation */}
                    {!isAdmin && !isInstitute && !isContentCreator && (
                      <>
                        {/* Browse Subjects with expandable chapters */}
                        <MobileNavSection icon={GraduationCap} label="Browse Subjects">
                          {subjects.length === 0 ? (
                            <div className="pl-14 py-3 text-sm text-muted-foreground">
                              No subjects available
                            </div>
                          ) : (
                            subjects.map((subject) => (
                              <Collapsible key={subject.id}>
                                <CollapsibleTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full justify-between h-11 text-sm font-medium gap-2 pl-14 hover:bg-muted/50"
                                  >
                                    <span className="truncate">{subject.name}</span>
                                    <ChevronRight className="w-4 h-4 opacity-60" />
                                  </Button>
                                </CollapsibleTrigger>
                                <CollapsibleContent className="space-y-1">
                                  {(chapters[subject.id] || []).length === 0 ? (
                                    <div className="pl-20 py-2 text-xs text-muted-foreground">
                                      No chapters
                                    </div>
                                  ) : (
                                    (chapters[subject.id] || []).map((chapter) => (
                                      <MobileSubItem
                                        key={chapter.id}
                                        label={chapter.name}
                                        onClick={() => handleChapterClick(chapter.id)}
                                      />
                                    ))
                                  )}
                                </CollapsibleContent>
                              </Collapsible>
                            ))
                          )}
                        </MobileNavSection>

                        {/* Quick Practice with chapters */}
                        <MobileNavSection icon={BookOpen} label="Quick Practice">
                          {subjects.map((subject) => (
                            <div key={subject.id}>
                              <div className="pl-14 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                {subject.name}
                              </div>
                              {(chapters[subject.id] || []).map((chapter) => (
                                <MobileSubItem
                                  key={chapter.id}
                                  label={chapter.name}
                                  onClick={() => handleChapterClick(chapter.id)}
                                />
                              ))}
                            </div>
                          ))}
                        </MobileNavSection>

                        {/* My Institutes */}
                        <MobileNavSection
                          icon={Building2}
                          label="My Institutes"
                          onClick={() => handleNavClick("/student")}
                        />

                        {/* Institute Exams */}
                        <MobileNavSection
                          icon={FileText}
                          label="Institute Exams"
                          onClick={() => handleNavClick("/student")}
                        />
                      </>
                    )}

                    {/* Admin-specific navigation */}
                    {isAdmin && (
                      <>
                        <MobileNavSection icon={Settings} label="Content Management">
                          <MobileSubItem label="Subjects" onClick={() => handleNavClick("/admin")} />
                          <MobileSubItem label="Chapters" onClick={() => handleNavClick("/admin")} />
                          <MobileSubItem label="MCQs" onClick={() => handleNavClick("/admin")} />
                        </MobileNavSection>
                        <MobileNavSection icon={Users} label="User Management">
                          <MobileSubItem label="Users" onClick={() => handleNavClick("/admin")} />
                          <MobileSubItem label="Institutes" onClick={() => handleNavClick("/admin")} />
                        </MobileNavSection>
                      </>
                    )}

                    {/* Institute-specific navigation */}
                    {isInstitute && (
                      <>
                        <MobileNavSection
                          icon={Users}
                          label="Manage Students"
                          onClick={() => handleNavClick("/institute")}
                        />
                        <MobileNavSection
                          icon={FileText}
                          label="Manage Exams"
                          onClick={() => handleNavClick("/institute")}
                        />
                      </>
                    )}
                  </div>

                  {/* Mobile Footer */}
                  <div className="p-4 border-t space-y-2">
                    <Button
                      variant="outline"
                      className="w-full h-12 justify-start gap-3"
                      onClick={() => handleNavClick("/")}
                    >
                      <Home className="w-4 h-4" />
                      Home Page
                    </Button>
                    <Button
                      variant="destructive"
                      className="w-full h-12 justify-start gap-3"
                      onClick={() => { setMobileMenuOpen(false); handleSignOut(); }}
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default AppNavbar;
