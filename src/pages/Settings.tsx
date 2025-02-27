
import { useState } from "react";
import { toast } from "sonner";
import { 
  Check, 
  Moon, 
  Sun, 
  Monitor, 
  AlignLeft, 
  Save, 
  RefreshCw, 
  Palette, 
  Layout, 
  Bell, 
  Lock, 
  Cloud
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

const Settings = () => {
  const navigate = useNavigate();
  
  // Theme settings
  const [theme, setTheme] = useState<"light" | "dark" | "system">("light");
  
  // Editor settings
  const [defaultCategory, setDefaultCategory] = useState("General");
  const [autosaveInterval, setAutosaveInterval] = useState("30");
  const [spellcheck, setSpellcheck] = useState(true);
  
  // Layout settings
  const [compactSidebar, setCompactSidebar] = useState(false);
  const [expandedView, setExpandedView] = useState(false);
  const [cardLayout, setCardLayout] = useState("grid");
  
  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [backupReminders, setBackupReminders] = useState(true);
  
  // Privacy settings
  const [encryptNotes, setEncryptNotes] = useState(false);
  const [anonymousAnalytics, setAnonymousAnalytics] = useState(true);
  
  // Handle theme change
  const handleThemeChange = (value: "light" | "dark" | "system") => {
    setTheme(value);
    
    // Apply theme change logic
    if (value === "system") {
      const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.documentElement.classList.toggle("dark", systemPrefersDark);
    } else {
      document.documentElement.classList.toggle("dark", value === "dark");
    }
    
    toast.success(`Theme set to ${value} mode`);
  };
  
  // Handle saving all settings
  const handleSaveSettings = () => {
    // In a real implementation, we would save these settings to localStorage or a backend
    const settings = {
      theme,
      editor: {
        defaultCategory,
        autosaveInterval: parseInt(autosaveInterval),
        spellcheck,
      },
      layout: {
        compactSidebar,
        expandedView,
        cardLayout,
      },
      notifications: {
        emailNotifications,
        backupReminders,
      },
      privacy: {
        encryptNotes,
        anonymousAnalytics,
      },
    };
    
    console.log("Saving settings:", settings);
    localStorage.setItem("app_settings", JSON.stringify(settings));
    
    toast.success("Settings saved successfully");
  };
  
  // Handle resetting all settings
  const handleResetSettings = () => {
    setTheme("light");
    setDefaultCategory("General");
    setAutosaveInterval("30");
    setSpellcheck(true);
    setCompactSidebar(false);
    setExpandedView(false);
    setCardLayout("grid");
    setEmailNotifications(false);
    setBackupReminders(true);
    setEncryptNotes(false);
    setAnonymousAnalytics(true);
    
    localStorage.removeItem("app_settings");
    
    toast.success("Settings reset to defaults");
  };
  
  return (
    <div className="container mx-auto py-6 animate-fade-in">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-1">Customize your MarketNotes experience</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => navigate(-1)} 
            className="gap-2"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSaveSettings}
            className="gap-2"
          >
            <Save size={16} />
            Save Changes
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="appearance" className="space-y-4">
        <TabsList className="grid grid-cols-5 lg:w-[600px]">
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="editor">Editor</TabsTrigger>
          <TabsTrigger value="layout">Layout</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
        </TabsList>
        
        <TabsContent value="appearance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>
                Customize how MarketNotes looks and feels
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label>Theme</Label>
                <div className="flex gap-4 mt-2">
                  <div 
                    className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      theme === "light" ? "border-primary" : "border-border"
                    }`}
                    onClick={() => handleThemeChange("light")}
                  >
                    <div className="h-12 w-12 rounded-full bg-card flex items-center justify-center shadow-sm">
                      <Sun size={24} className="text-amber-500" />
                    </div>
                    <span className="text-sm font-medium">Light</span>
                    {theme === "light" && <Check size={16} className="text-primary" />}
                  </div>
                  
                  <div 
                    className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      theme === "dark" ? "border-primary" : "border-border"
                    }`}
                    onClick={() => handleThemeChange("dark")}
                  >
                    <div className="h-12 w-12 rounded-full bg-slate-800 flex items-center justify-center shadow-sm">
                      <Moon size={24} className="text-slate-400" />
                    </div>
                    <span className="text-sm font-medium">Dark</span>
                    {theme === "dark" && <Check size={16} className="text-primary" />}
                  </div>
                  
                  <div 
                    className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      theme === "system" ? "border-primary" : "border-border"
                    }`}
                    onClick={() => handleThemeChange("system")}
                  >
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-slate-100 to-slate-700 flex items-center justify-center shadow-sm">
                      <Monitor size={24} className="text-slate-500" />
                    </div>
                    <span className="text-sm font-medium">System</span>
                    {theme === "system" && <Check size={16} className="text-primary" />}
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-1">
                <Label>Color Scheme</Label>
                <Select defaultValue="purple">
                  <SelectTrigger>
                    <SelectValue placeholder="Select a color scheme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="purple">Purple (Default)</SelectItem>
                    <SelectItem value="blue">Blue</SelectItem>
                    <SelectItem value="green">Green</SelectItem>
                    <SelectItem value="amber">Amber</SelectItem>
                    <SelectItem value="red">Red</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground mt-2">
                  The color scheme affects the accent colors throughout the app.
                </p>
              </div>
              
              <div className="space-y-1">
                <Label>Font Size</Label>
                <Select defaultValue="medium">
                  <SelectTrigger>
                    <SelectValue placeholder="Select a font size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="large">Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="editor" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Editor Settings</CardTitle>
              <CardDescription>
                Customize your note editing experience
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label>Default Category for New Notes</Label>
                <Select value={defaultCategory} onValueChange={setDefaultCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a default category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="General">General</SelectItem>
                    <SelectItem value="Stocks">Stocks</SelectItem>
                    <SelectItem value="Crypto">Crypto</SelectItem>
                    <SelectItem value="Forex">Forex</SelectItem>
                    <SelectItem value="Commodities">Commodities</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-1">
                <Label>Autosave Interval (seconds)</Label>
                <Input 
                  type="number" 
                  value={autosaveInterval}
                  onChange={(e) => setAutosaveInterval(e.target.value)}
                  min="5"
                  max="300"
                />
                <p className="text-sm text-muted-foreground mt-2">
                  Set to 0 to disable autosave
                </p>
              </div>
              
              <div className="flex items-center justify-between space-y-0 pt-2">
                <Label htmlFor="spellcheck">Spell Check</Label>
                <Switch 
                  id="spellcheck" 
                  checked={spellcheck}
                  onCheckedChange={setSpellcheck}
                />
              </div>
              
              <div className="flex items-center justify-between space-y-0 pt-2">
                <Label htmlFor="autofocus">Auto-focus New Notes</Label>
                <Switch id="autofocus" defaultChecked />
              </div>
              
              <div className="flex items-center justify-between space-y-0 pt-2">
                <Label htmlFor="markdown">Enable Markdown Shortcuts</Label>
                <Switch id="markdown" defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="layout" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Layout Settings</CardTitle>
              <CardDescription>
                Customize how content is displayed
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between space-y-0">
                <div className="space-y-0.5">
                  <Label htmlFor="compactSidebar">Compact Sidebar</Label>
                  <p className="text-sm text-muted-foreground">
                    Show sidebar with icons only
                  </p>
                </div>
                <Switch 
                  id="compactSidebar" 
                  checked={compactSidebar}
                  onCheckedChange={setCompactSidebar}
                />
              </div>
              
              <div className="flex items-center justify-between space-y-0 pt-4">
                <div className="space-y-0.5">
                  <Label htmlFor="expandedView">Expanded View</Label>
                  <p className="text-sm text-muted-foreground">
                    Use full screen width for content
                  </p>
                </div>
                <Switch 
                  id="expandedView" 
                  checked={expandedView}
                  onCheckedChange={setExpandedView}
                />
              </div>
              
              <Separator className="my-2" />
              
              <div className="space-y-1">
                <Label>Note Card Layout</Label>
                <div className="flex gap-4 mt-2">
                  <div 
                    className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      cardLayout === "grid" ? "border-primary" : "border-border"
                    }`}
                    onClick={() => setCardLayout("grid")}
                  >
                    <div className="h-20 w-20 rounded-md border border-border flex items-center justify-center">
                      <div className="grid grid-cols-2 gap-1 p-2">
                        <div className="bg-muted h-6 w-6 rounded"></div>
                        <div className="bg-muted h-6 w-6 rounded"></div>
                        <div className="bg-muted h-6 w-6 rounded"></div>
                        <div className="bg-muted h-6 w-6 rounded"></div>
                      </div>
                    </div>
                    <span className="text-sm font-medium">Grid</span>
                    {cardLayout === "grid" && <Check size={16} className="text-primary" />}
                  </div>
                  
                  <div 
                    className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      cardLayout === "list" ? "border-primary" : "border-border"
                    }`}
                    onClick={() => setCardLayout("list")}
                  >
                    <div className="h-20 w-20 rounded-md border border-border flex flex-col items-center justify-center p-2">
                      <div className="bg-muted h-3 w-full rounded mb-2"></div>
                      <div className="bg-muted h-3 w-full rounded mb-2"></div>
                      <div className="bg-muted h-3 w-full rounded mb-2"></div>
                      <div className="bg-muted h-3 w-full rounded"></div>
                    </div>
                    <span className="text-sm font-medium">List</span>
                    {cardLayout === "list" && <Check size={16} className="text-primary" />}
                  </div>
                </div>
              </div>
              
              <div className="space-y-1 pt-2">
                <Label>Sort Notes By</Label>
                <Select defaultValue="updated">
                  <SelectTrigger>
                    <SelectValue placeholder="Select sort order" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="updated">Last Updated</SelectItem>
                    <SelectItem value="created">Date Created</SelectItem>
                    <SelectItem value="title">Title (A-Z)</SelectItem>
                    <SelectItem value="category">Category</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>
                Manage how and when you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between space-y-0">
                <div className="space-y-0.5">
                  <Label htmlFor="emailNotifications">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive important updates via email
                  </p>
                </div>
                <Switch 
                  id="emailNotifications" 
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>
              
              <div className="flex items-center justify-between space-y-0 pt-4">
                <div className="space-y-0.5">
                  <Label htmlFor="backupReminders">Backup Reminders</Label>
                  <p className="text-sm text-muted-foreground">
                    Remind me to back up my notes weekly
                  </p>
                </div>
                <Switch 
                  id="backupReminders" 
                  checked={backupReminders}
                  onCheckedChange={setBackupReminders}
                />
              </div>
              
              <div className="flex items-center justify-between space-y-0 pt-4">
                <div className="space-y-0.5">
                  <Label htmlFor="marketAlerts">Market Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive alerts for significant market events
                  </p>
                </div>
                <Switch id="marketAlerts" defaultChecked />
              </div>
              
              <Separator className="my-2" />
              
              <div className="space-y-1">
                <Label>Email Address for Notifications</Label>
                <Input type="email" placeholder="your.email@example.com" />
                <p className="text-sm text-muted-foreground mt-2">
                  We'll never share your email with anyone else.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="privacy" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Privacy Settings</CardTitle>
              <CardDescription>
                Manage your privacy and security preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between space-y-0">
                <div className="space-y-0.5">
                  <Label htmlFor="encryptNotes">Encrypt Notes</Label>
                  <p className="text-sm text-muted-foreground">
                    Encrypt your notes for additional security
                  </p>
                </div>
                <Switch 
                  id="encryptNotes" 
                  checked={encryptNotes}
                  onCheckedChange={setEncryptNotes}
                />
              </div>
              
              <div className="flex items-center justify-between space-y-0 pt-4">
                <div className="space-y-0.5">
                  <Label htmlFor="anonymousAnalytics">Anonymous Analytics</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow anonymous usage data to improve the app
                  </p>
                </div>
                <Switch 
                  id="anonymousAnalytics" 
                  checked={anonymousAnalytics}
                  onCheckedChange={setAnonymousAnalytics}
                />
              </div>
              
              <Separator className="my-2" />
              
              <div className="space-y-2">
                <Button variant="outline" className="w-full gap-2">
                  <Cloud className="h-4 w-4" />
                  Export All Data
                </Button>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full gap-2">
                      <Lock className="h-4 w-4" />
                      Delete All Data
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete all your
                        notes and personal data from our servers.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => toast.error("This is a demo. No data was deleted.")}
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Reset Settings</CardTitle>
              <CardDescription>
                Restore all settings to their default values
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <RefreshCw size={16} />
                    Reset to Defaults
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Reset all settings?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will reset all your preferences to the default values. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleResetSettings}>
                      Reset
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
