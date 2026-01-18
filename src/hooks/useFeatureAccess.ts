import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface FeaturePermissions {
  expenses: boolean;
  receipt_generator: boolean;
  calendar: boolean;
  finance: boolean;
  legal: boolean;
  projects: boolean;
  notes: boolean;
  tao: boolean;
  operations: boolean;
}

export const defaultPermissions: FeaturePermissions = {
  expenses: false,
  receipt_generator: false,
  calendar: false,
  finance: false,
  legal: false,
  projects: false,
  notes: false,
  tao: false,
  operations: false,
};

export function useFeatureAccess() {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<FeaturePermissions>(defaultPermissions);
  const [isRequester, setIsRequester] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const fetchPermissions = async () => {
      if (!user) {
        setPermissions(defaultPermissions);
        setIsRequester(false);
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        // Check if user is admin via role
        const { data: roleData } = await supabase.rpc("get_user_role", {
          _user_id: user.id,
        });

        const userIsAdmin = roleData === "admin";
        setIsAdmin(userIsAdmin);

        // If admin, grant all permissions
        if (userIsAdmin) {
          setPermissions({
            expenses: true,
            receipt_generator: true,
            calendar: true,
            finance: true,
            legal: true,
            projects: true,
            notes: true,
            tao: true,
            operations: true,
          });
          setIsRequester(true);
          setLoading(false);
          return;
        }

        // Get expense_user record for permissions
        const { data: expenseUser, error } = await supabase
          .from("expense_users")
          .select("is_requester, feature_permissions")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) {
          console.error("Error fetching user permissions:", error);
          setLoading(false);
          return;
        }

        if (expenseUser) {
          setIsRequester(expenseUser.is_requester || false);
          
          // Parse feature_permissions - handle both JSON string and object
          const perms = expenseUser.feature_permissions;
          if (perms && typeof perms === "object") {
            setPermissions({
              ...defaultPermissions,
              ...perms,
            } as FeaturePermissions);
          }
        }
      } catch (err) {
        console.error("Error in useFeatureAccess:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, [user]);

  const hasAccess = (feature: keyof FeaturePermissions): boolean => {
    if (isAdmin) return true;
    return permissions[feature] || false;
  };

  return {
    permissions,
    isRequester,
    isAdmin,
    loading,
    hasAccess,
  };
}
