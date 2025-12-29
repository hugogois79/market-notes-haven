import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import MainLayout from "@/layouts/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, LogOut, Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getUserProfile, updateUserProfile, getUserLinkedTokens, unlinkTokenFromUser, UserProfile, uploadProfilePhoto } from "@/services/supabaseService";
import { fetchTokens } from "@/services/tokenService";
import { Token } from "@/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const Profile = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [linkedTokens, setLinkedTokens] = useState<Token[]>([]);
  const [availableTokens, setAvailableTokens] = useState<Token[]>([]);
  const [selectedToken, setSelectedToken] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) {
        navigate("/auth");
        return;
      }

      try {
        setLoading(true);
        
        // Load user profile
        const profileData = await getUserProfile();
        setProfile(profileData);
        
        // Load linked tokens
        const tokens = await getUserLinkedTokens();
        setLinkedTokens(tokens);
        
        // Load available tokens for linking
        const allTokens = await fetchTokens();
        const linkedTokenIds = tokens.map((token: Token) => token.id);
        const available = allTokens.filter(token => !linkedTokenIds.includes(token.id));
        setAvailableTokens(available);
      } catch (error) {
        console.error("Error loading profile:", error);
        toast.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user, navigate]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    try {
      setLoading(true);
      const updatedProfile = await updateUserProfile(profile);
      
      if (updatedProfile) {
        setProfile(updatedProfile);
        toast.success("Profile updated successfully");
      } else {
        toast.error("Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (!profile) return;
    
    const { name, value } = e.target;
    setProfile({
      ...profile,
      [name]: value
    });
  };

  const handleSelectChange = (name: string, value: string) => {
    if (!profile) return;
    
    setProfile({
      ...profile,
      [name]: value
    });
  };

  const handleRemoveToken = async (tokenId: string) => {
    try {
      const success = await unlinkTokenFromUser(tokenId);
      
      if (success) {
        setLinkedTokens(linkedTokens.filter(token => token.id !== tokenId));
        setAvailableTokens([...availableTokens, linkedTokens.find(token => token.id === tokenId)!]);
        toast.success("Token removed successfully");
      } else {
        toast.error("Failed to remove token");
      }
    } catch (error) {
      console.error("Error removing token:", error);
      toast.error("Failed to remove token");
    }
  };

  const handleAddToken = async () => {
    if (!selectedToken) return;
    
    try {
      // This would be implemented in a function to link token to user
      // For now, we'll just update the UI
      const tokenToAdd = availableTokens.find(token => token.id === selectedToken);
      if (tokenToAdd) {
        setLinkedTokens([...linkedTokens, tokenToAdd]);
        setAvailableTokens(availableTokens.filter(token => token.id !== selectedToken));
        setSelectedToken("");
        toast.success("Token added successfully");
      }
    } catch (error) {
      console.error("Error adding token:", error);
      toast.error("Failed to add token");
    }
  };

  const getInitials = (name?: string | null) => {
    if (!name) return "U";
    return name.substring(0, 2).toUpperCase();
  };

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success("Sessão terminada");
      navigate("/auth");
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Erro ao terminar sessão");
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error("Formato inválido. Use JPG, PNG ou WEBP.");
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ficheiro demasiado grande. Máximo 5MB.");
      return;
    }

    setIsUploading(true);
    try {
      const photoUrl = await uploadProfilePhoto(file);
      if (photoUrl && profile) {
        setProfile({ ...profile, avatar_url: photoUrl });
        // Also update the profile in database
        await updateUserProfile({ ...profile, avatar_url: photoUrl });
        toast.success("Foto actualizada com sucesso");
      } else {
        toast.error("Erro ao fazer upload da foto");
      }
    } catch (error) {
      console.error("Error uploading photo:", error);
      toast.error("Erro ao fazer upload da foto");
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-[calc(100vh-4rem)]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container max-w-4xl py-6">
        <h1 className="text-3xl font-bold mb-6">User Profile</h1>
        
        {profile && (
          <form onSubmit={handleUpdateProfile}>
            <div className="grid gap-6 md:grid-cols-2">
              {/* Profile Card */}
              <Card className="md:col-span-2">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Avatar with upload overlay */}
                    <div className="relative group">
                      <Avatar className="h-16 w-16">
                        {profile.avatar_url ? (
                          <AvatarImage src={profile.avatar_url} alt={profile.username || ""} />
                        ) : (
                          <AvatarFallback className="text-lg">
                            {getInitials(profile.full_name || profile.username)}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      >
                        {isUploading ? (
                          <Loader2 className="h-6 w-6 text-white animate-spin" />
                        ) : (
                          <Camera className="h-6 w-6 text-white" />
                        )}
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={handlePhotoUpload}
                      />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{profile.full_name || profile.username || "User Profile"}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">{user?.email}</p>
                    </div>
                  </div>
                  
                  {/* Logout button */}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                        <LogOut className="h-4 w-4 mr-2" />
                        Terminar Sessão
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Terminar Sessão</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem a certeza que pretende terminar a sessão?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleLogout} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          Terminar Sessão
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    {/* Basic Info */}
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="username">Username</Label>
                        <Input
                          id="username"
                          name="username"
                          value={profile.username || ""}
                          onChange={handleChange}
                          className="mt-1"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="full_name">Full Name</Label>
                        <Input
                          id="full_name"
                          name="full_name"
                          value={profile.full_name || ""}
                          onChange={handleChange}
                          className="mt-1"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="contact_info">Contact Information</Label>
                        <Input
                          id="contact_info"
                          name="contact_info"
                          value={profile.contact_info || ""}
                          onChange={handleChange}
                          className="mt-1"
                        />
                      </div>
                    </div>
                    
                    {/* Additional Info */}
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="type">Type</Label>
                        <Select 
                          name="type" 
                          value={profile.type || "Individual"} 
                          onValueChange={(value) => handleSelectChange("type", value)}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Individual">Individual</SelectItem>
                            <SelectItem value="Organization">Organization</SelectItem>
                            <SelectItem value="Business">Business</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="status">Status</Label>
                        <Select 
                          name="status" 
                          value={profile.status || "Active"} 
                          onValueChange={(value) => handleSelectChange("status", value)}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Active">Active</SelectItem>
                            <SelectItem value="Inactive">Inactive</SelectItem>
                            <SelectItem value="Pending">Pending</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Bio */}
                  <div>
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      name="bio"
                      value={profile.bio || ""}
                      onChange={handleChange}
                      className="mt-1 min-h-24"
                      placeholder="Tell us about yourself"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Linked Tokens */}
              <Card>
                <CardHeader>
                  <CardTitle>Linked Tokens</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {linkedTokens.length > 0 ? (
                        linkedTokens.map((token) => (
                          <Badge key={token.id} variant="outline" className="flex items-center gap-1 px-3 py-1">
                            {token.logo_url && (
                              <img src={token.logo_url} alt={token.name} className="w-4 h-4 mr-1" />
                            )}
                            {token.name} ({token.symbol})
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-4 w-4 ml-1 text-muted-foreground"
                              onClick={() => handleRemoveToken(token.id)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </Badge>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No tokens linked to your profile.</p>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <Select value={selectedToken} onValueChange={setSelectedToken}>
                        <SelectTrigger className="flex-grow">
                          <SelectValue placeholder="Select a token to add" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableTokens.map((token) => (
                            <SelectItem key={token.id} value={token.id}>
                              {token.name} ({token.symbol})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button 
                        type="button" 
                        onClick={handleAddToken}
                        disabled={!selectedToken}
                      >
                        Add
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Save Button */}
              <div className="md:col-span-2 flex justify-end">
                <Button type="submit" disabled={loading}>
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </form>
        )}
      </div>
    </MainLayout>
  );
};

export default Profile;
