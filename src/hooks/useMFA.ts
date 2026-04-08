import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Factor {
  id: string;
  friendly_name?: string;
  factor_type: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface EnrollmentData {
  id: string;
  type: string;
  totp: {
    qr_code: string;
    secret: string;
    uri: string;
  };
}

interface ChallengeData {
  id: string;
  expires_at: number;
}

interface UseMFAReturn {
  // State
  isEnrolled: boolean;
  isLoading: boolean;
  factors: Factor[];
  currentAAL: string | null;
  nextAAL: string | null;
  requiresMFA: boolean;
  
  // Enrollment
  enrollmentData: EnrollmentData | null;
  startEnrollment: () => Promise<EnrollmentData | null>;
  verifyEnrollment: (code: string) => Promise<boolean>;
  cancelEnrollment: () => void;
  
  // Challenge/Verify
  challengeData: ChallengeData | null;
  createChallenge: () => Promise<ChallengeData | null>;
  verifyChallenge: (code: string) => Promise<boolean>;
  
  // Unenroll
  unenroll: (factorId: string) => Promise<boolean>;
  
  // Refresh
  refreshFactors: () => Promise<void>;
  checkAAL: () => Promise<{ currentLevel: string | null; nextLevel: string | null }>;
}

export const useMFA = (): UseMFAReturn => {
  const [isLoading, setIsLoading] = useState(true);
  const [factors, setFactors] = useState<Factor[]>([]);
  const [enrollmentData, setEnrollmentData] = useState<EnrollmentData | null>(null);
  const [challengeData, setChallengeData] = useState<ChallengeData | null>(null);
  const [currentAAL, setCurrentAAL] = useState<string | null>(null);
  const [nextAAL, setNextAAL] = useState<string | null>(null);

  const isEnrolled = factors.some((f) => f.status === "verified");
  const requiresMFA = nextAAL === "aal2" && currentAAL !== "aal2";

  const refreshFactors = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) {
        console.error("Error fetching MFA factors:", error);
        return;
      }
      setFactors(data?.totp || []);
    } catch (error) {
      console.error("Error refreshing factors:", error);
    }
  }, []);

  const checkAAL = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (error) {
        console.error("Error checking AAL:", error);
        return { currentLevel: null, nextLevel: null };
      }
      setCurrentAAL(data?.currentLevel || null);
      setNextAAL(data?.nextLevel || null);
      return { currentLevel: data?.currentLevel || null, nextLevel: data?.nextLevel || null };
    } catch (error) {
      console.error("Error checking AAL:", error);
      return { currentLevel: null, nextLevel: null };
    }
  }, []);

  // Initial load
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await Promise.all([refreshFactors(), checkAAL()]);
      setIsLoading(false);
    };
    init();
  }, [refreshFactors, checkAAL]);

  const startEnrollment = async (): Promise<EnrollmentData | null> => {
    try {
      // First, remove any unverified factors to avoid conflict
      const unverifiedFactors = factors.filter((f) => f.status === "unverified");
      for (const factor of unverifiedFactors) {
        try {
          await supabase.auth.mfa.unenroll({ factorId: factor.id });
        } catch (e) {
          console.warn("Failed to remove unverified factor:", e);
        }
      }

      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        issuer: "GVVC One",
        friendlyName: "Google Authenticator",
      });

      if (error) {
        console.error("Error starting MFA enrollment:", error);
        // Check if it's a name conflict - try with a unique name
        if (error.message?.includes("already exists")) {
          const { data: retryData, error: retryError } = await supabase.auth.mfa.enroll({
            factorType: "totp",
            issuer: "GVVC One",
            friendlyName: `Authenticator ${Date.now()}`,
          });
          
          if (retryError) {
            console.error("Error on retry enrollment:", retryError);
            toast.error("Erro ao iniciar configuração 2FA. Por favor, tente novamente.");
            return null;
          }
          
          const enrollment: EnrollmentData = {
            id: retryData.id,
            type: retryData.type,
            totp: {
              qr_code: retryData.totp.qr_code,
              secret: retryData.totp.secret,
              uri: retryData.totp.uri,
            },
          };
          setEnrollmentData(enrollment);
          return enrollment;
        }
        
        toast.error("Erro ao iniciar configuração 2FA");
        return null;
      }

      const enrollment: EnrollmentData = {
        id: data.id,
        type: data.type,
        totp: {
          qr_code: data.totp.qr_code,
          secret: data.totp.secret,
          uri: data.totp.uri,
        },
      };

      setEnrollmentData(enrollment);
      return enrollment;
    } catch (error) {
      console.error("Error in startEnrollment:", error);
      toast.error("Erro ao iniciar configuração 2FA");
      return null;
    }
  };

  const verifyEnrollment = async (code: string): Promise<boolean> => {
    if (!enrollmentData) {
      toast.error("Nenhuma configuração em curso");
      return false;
    }

    try {
      // First create a challenge
      const { data: challengeResult, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: enrollmentData.id,
      });

      if (challengeError) {
        console.error("Error creating challenge:", challengeError);
        toast.error("Erro ao verificar código");
        return false;
      }

      // Then verify with the code
      const { data: verifyResult, error: verifyError } = await supabase.auth.mfa.verify({
        factorId: enrollmentData.id,
        challengeId: challengeResult.id,
        code,
      });

      if (verifyError) {
        console.error("Error verifying code:", verifyError);
        toast.error("Código inválido. Tente novamente.");
        return false;
      }

      // Success - refresh factors and clear enrollment data
      await refreshFactors();
      await checkAAL();
      setEnrollmentData(null);
      toast.success("Autenticação de dois fatores ativada!");
      return true;
    } catch (error) {
      console.error("Error in verifyEnrollment:", error);
      toast.error("Erro ao verificar código");
      return false;
    }
  };

  const cancelEnrollment = () => {
    setEnrollmentData(null);
  };

  const createChallenge = async (): Promise<ChallengeData | null> => {
    // First, ensure we have the latest factors
    let currentFactors = factors;
    if (currentFactors.length === 0) {
      const { data } = await supabase.auth.mfa.listFactors();
      currentFactors = data?.totp || [];
      setFactors(currentFactors);
    }
    
    const verifiedFactor = currentFactors.find((f) => f.status === "verified");
    if (!verifiedFactor) {
      console.error("No verified MFA factor found");
      toast.error("Nenhum fator de autenticação configurado");
      return null;
    }

    try {
      const { data, error } = await supabase.auth.mfa.challenge({
        factorId: verifiedFactor.id,
      });

      if (error) {
        console.error("Error creating challenge:", error);
        toast.error("Erro ao criar desafio de autenticação");
        return null;
      }

      const challenge: ChallengeData = {
        id: data.id,
        expires_at: data.expires_at,
      };

      setChallengeData(challenge);
      return challenge;
    } catch (error) {
      console.error("Error in createChallenge:", error);
      toast.error("Erro ao criar desafio de autenticação");
      return null;
    }
  };

  const verifyChallenge = async (code: string): Promise<boolean> => {
    const verifiedFactor = factors.find((f) => f.status === "verified");
    if (!verifiedFactor) {
      toast.error("Nenhum fator de autenticação configurado");
      return false;
    }

    // Create a new challenge if we don't have one
    let currentChallenge = challengeData;
    if (!currentChallenge) {
      currentChallenge = await createChallenge();
      if (!currentChallenge) return false;
    }

    try {
      const { error } = await supabase.auth.mfa.verify({
        factorId: verifiedFactor.id,
        challengeId: currentChallenge.id,
        code,
      });

      if (error) {
        console.error("Error verifying challenge:", error);
        toast.error("Código inválido. Tente novamente.");
        // Clear challenge so a new one is created next time
        setChallengeData(null);
        return false;
      }

      await checkAAL();
      setChallengeData(null);
      return true;
    } catch (error) {
      console.error("Error in verifyChallenge:", error);
      toast.error("Erro ao verificar código");
      setChallengeData(null);
      return false;
    }
  };

  const unenroll = async (factorId: string): Promise<boolean> => {
    try {
      const { error } = await supabase.auth.mfa.unenroll({
        factorId,
      });

      if (error) {
        console.error("Error unenrolling MFA:", error);
        toast.error("Erro ao desativar autenticação de dois fatores");
        return false;
      }

      await refreshFactors();
      await checkAAL();
      toast.success("Autenticação de dois fatores desativada");
      return true;
    } catch (error) {
      console.error("Error in unenroll:", error);
      toast.error("Erro ao desativar autenticação de dois fatores");
      return false;
    }
  };

  return {
    isEnrolled,
    isLoading,
    factors,
    currentAAL,
    nextAAL,
    requiresMFA,
    enrollmentData,
    startEnrollment,
    verifyEnrollment,
    cancelEnrollment,
    challengeData,
    createChallenge,
    verifyChallenge,
    unenroll,
    refreshFactors,
    checkAAL,
  };
};
