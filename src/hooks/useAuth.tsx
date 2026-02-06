import { useState, useEffect, useCallback, useRef } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<"admin" | "student" | "content_creator" | "institute" | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  const generateSessionToken = () => {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  };

  const getDeviceInfo = () => {
    const ua = navigator.userAgent;
    const isMobile = /Mobile|Android|iPhone|iPad/.test(ua);
    const browser = ua.match(/(Chrome|Safari|Firefox|Edge|Opera)/)?.[1] || "Unknown";
    return `${isMobile ? "Mobile" : "Desktop"} - ${browser}`;
  };

  const registerSession = useCallback(async (userId: string, token: string) => {
    try {
      // Remove token temporarily to prevent Realtime listener from triggering "other device" logout
      // during the cleanup of old sessions.
      localStorage.removeItem("session_token");

      // First, delete any existing session for this user (force single session)
      await supabase
        .from("user_sessions")
        .delete()
        .eq("user_id", userId);

      // Then insert the new session
      const { error } = await supabase
        .from("user_sessions")
        .insert({
          user_id: userId,
          session_token: token,
          device_info: getDeviceInfo(),
        });

      if (error) {
        console.error("Error registering session:", error);
      } else {
        // Store token in localStorage
        localStorage.setItem("session_token", token);
        setSessionToken(token);
      }
    } catch (error) {
      console.error("Error in registerSession:", error);
    }
  }, []);

  const validateSession = useCallback(async (userId: string): Promise<boolean> => {
    try {
      const storedToken = localStorage.getItem("session_token");

      // If no stored token, this is a fresh start - allow it
      if (!storedToken) return true;

      const { data, error } = await supabase
        .from("user_sessions")
        .select("session_token")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        console.error("Error validating session:", error);
        // On error, be lenient and allow the session
        return true;
      }

      // If no session exists in DB but we have a token, re-register
      if (!data) {
        return true; // Will trigger re-registration
      }

      // If tokens don't match, session is invalid
      if (data.session_token !== storedToken) {
        return false;
      }

      // Update last_active_at
      await supabase
        .from("user_sessions")
        .update({ last_active_at: new Date().toISOString() })
        .eq("user_id", userId);

      return true;
    } catch (error) {
      console.error("Error in validateSession:", error);
      // On error, be lenient
      return true;
    }
  }, []);

  const handleSessionInvalidation = useCallback(async () => {
    toast.error("Your session was ended because you logged in from another device.", {
      duration: 5000,
    });
    localStorage.removeItem("session_token");
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setUserRole(null);
    setSessionToken(null);
  }, []);

  const isSigningOut = useRef(false);

  useEffect(() => {
    // Set up auth state listener FIRST
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (isSigningOut.current) return;

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        if (event === "SIGNED_IN") {
          // New login - register a new session
          const newToken = generateSessionToken();
          setTimeout(() => {
            registerSession(session.user.id, newToken);
            fetchUserRole(session.user.id);
          }, 0);
        } else {
          // Existing session - validate it
          setTimeout(() => {
            validateSession(session.user.id).then((isValid) => {
              if (!isValid && localStorage.getItem("session_token")) {
                handleSessionInvalidation();
              } else {
                fetchUserRole(session.user.id);
              }
            });
          }, 0);
        }
      } else {
        setUserRole(null);
        setLoading(false);
      }
    });

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        const storedToken = localStorage.getItem("session_token");

        if (!storedToken) {
          // No token stored - register a new session
          const newToken = generateSessionToken();
          registerSession(session.user.id, newToken);
          fetchUserRole(session.user.id);
        } else {
          // Token exists - validate and continue
          validateSession(session.user.id).then((isValid) => {
            if (!isValid) {
              handleSessionInvalidation();
            } else {
              fetchUserRole(session.user.id);
            }
          });
        }
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [registerSession, validateSession, handleSessionInvalidation]);

  // Set up realtime subscription to detect session changes
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel("session-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_sessions",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const storedToken = localStorage.getItem("session_token");

          if (payload.eventType === "DELETE") {
            // Session was deleted - likely logged in elsewhere
            if (storedToken) {
              handleSessionInvalidation();
            }
          } else if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
            const newToken = (payload.new as { session_token: string })?.session_token;
            if (storedToken && newToken && newToken !== storedToken) {
              handleSessionInvalidation();
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, handleSessionInvalidation]);

  const fetchUserRole = async (userId: string) => {
    try {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      if (roles && roles.length > 0) {
        const isAdmin = roles.some((r) => r.role === "admin");
        const isInstitute = roles.some((r) => r.role === "institute");
        const isContentCreator = roles.some((r) => r.role === "content_creator");
        setUserRole(isAdmin ? "admin" : isInstitute ? "institute" : isContentCreator ? "content_creator" : "student");
      } else {
        setUserRole("student");
      }
    } catch (error) {
      console.error("Error fetching user role:", error);
      setUserRole("student");
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    if (isSigningOut.current) return;
    isSigningOut.current = true;

    try {
      // Remove session from database
      if (user?.id) {
        await supabase
          .from("user_sessions")
          .delete()
          .eq("user_id", user.id);
      }

      // Clear local state first
      localStorage.removeItem("session_token");
      setUser(null);
      setSession(null);
      setUserRole(null);
      setSessionToken(null);

      // Perform global sign out out
      await supabase.auth.signOut({ scope: 'global' });
    } catch (error) {
      console.error("Error during sign out:", error);
    } finally {
      isSigningOut.current = false;
    }
  };

  return {
    user,
    session,
    loading,
    userRole,
    signOut,
    sessionToken,
  };
};
