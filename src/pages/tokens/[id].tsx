
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchTokenById, createToken, updateToken, deleteToken, getNotesForToken } from "@/services/tokenService";
import { Note, Token } from "@/types";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Trash, ArrowLeft, Save, Plus, X, Image, FileText, Filter } from "lucide-react";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import NoteCard from "@/components/NoteCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const TokenDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === "new";
  
  const [token, setToken] = useState<Partial<Token>>({
    name: "",
    symbol: "",
    logo_url: "",
    description: "",
    industry: "",
    tags: [],
  });
  
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [relatedNotes, setRelatedNotes] = useState<Note[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  
  useEffect(() => {
    const loadToken = async () => {
      if (isNew) return;
      
      try {
        setLoading(true);
        const fetchedToken = await fetchTokenById(id!);
        if (fetchedToken) {
          setToken(fetchedToken);
          
          // Load related notes
          loadRelatedNotes(fetchedToken.id);
        } else {
          toast.error("Token not found");
          navigate("/tokens");
        }
      } catch (error) {
        console.error("Error loading token:", error);
        toast.error("Failed to load token");
      } finally {
        setLoading(false);
      }
    };
    
    loadToken();
  }, [id, isNew, navigate]);
  
  const loadRelatedNotes = async (tokenId: string) => {
    try {
      setLoadingNotes(true);
      const notes = await getNotesForToken(tokenId);
      setRelatedNotes(notes);
      
      // Extract unique categories from notes
      const categories = Array.from(new Set(notes.map(note => note.category)));
      setAvailableCategories(categories);
    } catch (error) {
      console.error("Error loading related notes:", error);
    } finally {
      setLoadingNotes(false);
    }
  };
  
  // Filter notes by category
  const filteredNotes = selectedCategory === "all" 
    ? relatedNotes 
    : relatedNotes.filter(note => note.category === selectedCategory);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setToken(prev => ({ ...prev, [name]: value }));
  };
  
  const handleAddTag = () => {
    if (!newTag.trim()) return;
    
    // Don't add duplicate tags
    if (token.tags?.includes(newTag.trim())) {
      toast.error("Tag already exists");
      return;
    }
    
    setToken(prev => ({
      ...prev,
      tags: [...(prev.tags || []), newTag.trim()],
    }));
    
    setNewTag("");
  };
  
  const handleRemoveTag = (tagToRemove: string) => {
    setToken(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove) || [],
    }));
  };
  
  const handleSave = async () => {
    try {
      if (!token.name || !token.symbol) {
        toast.error("Name and symbol are required");
        return;
      }
      
      setSaving(true);
      
      let savedToken: Token | null;
      
      if (isNew) {
        savedToken = await createToken({
          name: token.name,
          symbol: token.symbol.toUpperCase(),
          logo_url: token.logo_url,
          description: token.description,
          industry: token.industry,
          tags: token.tags || [],
        });
        
        if (savedToken) {
          toast.success("Token created successfully");
          navigate(`/tokens/${savedToken.id}`);
        } else {
          toast.error("Failed to create token");
        }
      } else {
        savedToken = await updateToken(token as Token);
        
        if (savedToken) {
          setToken(savedToken);
          toast.success("Token updated successfully");
        } else {
          toast.error("Failed to update token");
        }
      }
    } catch (error) {
      console.error("Error saving token:", error);
      toast.error("An error occurred while saving");
    } finally {
      setSaving(false);
    }
  };
  
  const handleDelete = async () => {
    try {
      setSaving(true);
      
      if (!isNew && id) {
        const success = await deleteToken(id);
        
        if (success) {
          toast.success("Token deleted successfully");
          navigate("/tokens");
        } else {
          toast.error("Failed to delete token");
        }
      }
    } catch (error) {
      console.error("Error deleting token:", error);
      toast.error("An error occurred while deleting");
    } finally {
      setSaving(false);
      setShowDeleteAlert(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6 py-2 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate("/tokens")}
          >
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-3xl font-semibold text-[#1EAEDB]">
              {isNew ? "Add New Token" : token.name}
            </h1>
            {!isNew && <p className="text-muted-foreground">{token.symbol}</p>}
          </div>
        </div>
        
        <div className="flex gap-2">
          {!isNew && (
            <Button 
              variant="destructive" 
              onClick={() => setShowDeleteAlert(true)}
              disabled={saving}
            >
              <Trash size={16} className="mr-2" />
              Delete
            </Button>
          )}
          
          <Button 
            variant="brand" 
            onClick={handleSave}
            disabled={saving}
          >
            <Save size={16} className="mr-2" />
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="details" className="w-full">
        <TabsList>
          <TabsTrigger value="details">Token Details</TabsTrigger>
          {!isNew && <TabsTrigger value="portfolios">Portfolios</TabsTrigger>}
          {!isNew && <TabsTrigger value="traders">Traders</TabsTrigger>}
          {!isNew && <TabsTrigger value="notes">Related Notes</TabsTrigger>}
        </TabsList>
        
        <TabsContent value="details" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Token Name*</Label>
                  <Input
                    id="name"
                    name="name"
                    value={token.name}
                    onChange={handleChange}
                    placeholder="e.g., Bitcoin"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="symbol">Symbol*</Label>
                  <Input
                    id="symbol"
                    name="symbol"
                    value={token.symbol}
                    onChange={handleChange}
                    placeholder="e.g., BTC"
                    required
                    className="uppercase"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="logo_url">Logo URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="logo_url"
                    name="logo_url"
                    value={token.logo_url}
                    onChange={handleChange}
                    placeholder="URL to token logo"
                  />
                  {token.logo_url && (
                    <div className="h-10 w-10 flex-shrink-0 border rounded-md overflow-hidden">
                      <img 
                        src={token.logo_url} 
                        alt={token.name} 
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "https://via.placeholder.com/40?text=" + (token.symbol || "?");
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="industry">Industry</Label>
                <Input
                  id="industry"
                  name="industry"
                  value={token.industry}
                  onChange={handleChange}
                  placeholder="e.g., Finance, Gaming, Metaverse"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={token.description}
                  onChange={handleChange}
                  placeholder="Brief description of the token"
                  rows={4}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {token.tags?.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="gap-1">
                      {tag}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 p-0 hover:bg-destructive/10"
                        onClick={() => handleRemoveTag(tag)}
                      >
                        <X size={12} />
                      </Button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add a tag"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                  />
                  <Button 
                    variant="outline" 
                    onClick={handleAddTag}
                    disabled={!newTag.trim()}
                  >
                    <Plus size={16} />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="portfolios" className="mt-4">
          <Card className="p-6">
            <div className="text-center py-8">
              <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Image className="text-primary" size={24} />
              </div>
              <h3 className="text-lg font-medium mb-2">Portfolio Integration Coming Soon</h3>
              <p className="text-muted-foreground">
                The ability to associate tokens with portfolios will be available in a future update.
              </p>
            </div>
          </Card>
        </TabsContent>
        
        <TabsContent value="traders" className="mt-4">
          <Card className="p-6">
            <div className="text-center py-8">
              <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Image className="text-primary" size={24} />
              </div>
              <h3 className="text-lg font-medium mb-2">Trader Integration Coming Soon</h3>
              <p className="text-muted-foreground">
                The ability to associate traders with tokens will be available in a future update.
              </p>
            </div>
          </Card>
        </TabsContent>
        
        <TabsContent value="notes" className="mt-4">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center gap-4">
              <CardTitle className="flex items-center gap-2">
                <FileText size={20} className="text-primary" />
                Related Notes
              </CardTitle>
              
              {availableCategories.length > 0 && (
                <div className="flex items-center gap-2 ml-auto">
                  <Filter size={16} className="text-muted-foreground" />
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {availableCategories.map(category => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {loadingNotes ? (
                <div className="py-8 flex justify-center">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                </div>
              ) : filteredNotes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredNotes.map(note => (
                    <NoteCard key={note.id} note={note} />
                  ))}
                </div>
              ) : relatedNotes.length > 0 ? (
                <div className="text-center py-8">
                  <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Filter className="text-primary" size={24} />
                  </div>
                  <h3 className="text-lg font-medium mb-2">No Notes in This Category</h3>
                  <p className="text-muted-foreground mb-4">
                    There are no notes in the selected category. Try selecting a different category.
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => setSelectedCategory("all")}
                    className="gap-2"
                  >
                    Show All Notes
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <FileText className="text-primary" size={24} />
                  </div>
                  <h3 className="text-lg font-medium mb-2">No Related Notes Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    There are no notes associated with this token yet.
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => navigate("/editor/new")}
                    className="gap-2"
                  >
                    <Plus size={16} />
                    Create Note
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this token?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the token
              and remove the data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TokenDetail;
