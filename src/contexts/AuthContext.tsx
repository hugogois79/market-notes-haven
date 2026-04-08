
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";

// Session expires after 24 hours
const SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000;
const SESSION_START_KEY = "session_start_time";

type AuthContextType = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if session has expired based on stored timestamp
  const checkSessionExpiration = async (): Promise<boolean> => {
    const sessionStartTime = localStorage.getItem(SESSION_START_KEY);
    
    if (sessionStartTime) {
      const elapsed = Date.now() - parseInt(sessionStartTime);
      
      if (elapsed > SESSION_MAX_AGE_MS) {
        // Session expired - sign out
        console.log("Session expired after 24 hours, signing out...");
        localStorage.removeItem(SESSION_START_KEY);
        await supabase.auth.signOut();
        return true;
      }
    }
    
    return false;
  };

  // Set session start time when user logs in
  const setSessionStartTime = () => {
    localStorage.setItem(SESSION_START_KEY, Date.now().toString());
  };

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        // First check if session has expired
        const expired = await checkSessionExpiration();
        if (expired) {
          setLoading(false);
          return;
        }

        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);
        
        // If there's an active session but no start time, set it now
        if (session && !localStorage.getItem(SESSION_START_KEY)) {
          setSessionStartTime();
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error getting initial session:", error);
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Set session start time on sign in
        if (event === "SIGNED_IN" && session) {
          setSessionStartTime();
        }

        // Clear session start time on sign out
        if (event === "SIGNED_OUT") {
          localStorage.removeItem(SESSION_START_KEY);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Periodic check for session expiration (every hour)
  useEffect(() => {
    const interval = setInterval(() => {
      checkSessionExpiration();
    }, 60 * 60 * 1000); // Check every hour

    return () => clearInterval(interval);
  }, []);

  const signOut = async () => {
    localStorage.removeItem(SESSION_START_KEY);
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
