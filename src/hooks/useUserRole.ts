import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type AppRole = "admin" | "moderator" | "user" | "worker";

export function useUserRole() {
  const { user } = useAuth();
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRole = async () => {
      if (!user) {
        setRole(null);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.rpc("get_user_role", {
          _user_id: user.id,
        });

        if (error) {
          console.error("Error fetching user role:", error);
          // Default to 'user' if no role found
          setRole("user");
        } else {
          setRole((data as AppRole) || "user");
        }
      } catch (err) {
        console.error("Error in useUserRole:", err);
        setRole("user");
      } finally {
        setLoading(false);
      }
    };

    fetchRole();
  }, [user]);

  const isWorker = role === "worker";
  const isAdmin = role === "admin";

  return { role, loading, isWorker, isAdmin };
}
