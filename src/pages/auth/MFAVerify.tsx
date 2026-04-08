import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { MFAVerification } from "@/components/auth/MFAVerification";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const MFAVerify = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleSuccess = () => {
    toast.success("Autenticação verificada!");
    navigate("/");
  };

  const handleCancel = async () => {
    // Sign out since MFA wasn't completed
    await supabase.auth.signOut();
    navigate("/auth");
  };

  // If no user, redirect to auth
  if (!user) {
    navigate("/auth");
    return null;
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-background p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
          <img
            src="/lovable-uploads/975730be-0cc6-45cc-95c5-6f382241b98c.png"
            alt="Grand Victoria Ventures Capital"
            className="h-24 object-contain"
          />
        </div>
        
        <MFAVerification onSuccess={handleSuccess} onCancel={handleCancel} />
      </div>
    </div>
  );
};

export default MFAVerify;
