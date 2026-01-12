import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type AppRole = "admin" | "moderator" | "user" | "worker";

const ROLE_FETCH_TIMEOUT_MS = 6000; // 6 seconds timeout

export function useUserRole() {
  const { user, loading: authLoading } = useAuth();
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [timedOut, setTimedOut] = useState(false);
  const fetchAttempted = useRef(false);

  useEffect(() => {
    // If auth is still loading, wait
    if (authLoading) {
      return;
    }

    // If no user, immediately set role to null and stop loading
    if (!user) {
      setRole(null);
      setLoading(false);
      fetchAttempted.current = false;
      return;
    }

    // Prevent duplicate fetches
    if (fetchAttempted.current) {
      return;
    }
    fetchAttempted.current = true;

    const controller = new AbortController();
    let timeoutId: NodeJS.Timeout;

    const fetchRole = async () => {
      try {
        // Set up timeout
        timeoutId = setTimeout(() => {
          console.warn("useUserRole: fetch timed out, defaulting to 'user'");
          setTimedOut(true);
          setRole("user");
          setLoading(false);
          controller.abort();
        }, ROLE_FETCH_TIMEOUT_MS);

        const { data, error } = await supabase.rpc("get_user_role", {
          _user_id: user.id,
        });

        // Clear timeout if successful
        clearTimeout(timeoutId);

        if (controller.signal.aborted) {
          return; // Already timed out
        }

        if (error) {
          console.error("Error fetching user role:", error);
          setRole("user");
        } else {
          setRole((data as AppRole) || "user");
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          console.error("Error in useUserRole:", err);
          setRole("user");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchRole();

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [user, authLoading]);

  // Reset fetch attempted when user changes
  useEffect(() => {
    fetchAttempted.current = false;
  }, [user?.id]);

  const isWorker = role === "worker";
  const isAdmin = role === "admin";

  return { role, loading, isWorker, isAdmin, timedOut };
}
