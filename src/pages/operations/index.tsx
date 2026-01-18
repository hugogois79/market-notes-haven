import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  Users, 
  Plane, 
  Ship, 
  Car, 
  Briefcase, 
  Home,
  FileText, 
  Calendar,
  AlertTriangle,
  Plus,
  Search,
  Filter,
  UserPlus,
  Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import StaffDirectory from "@/components/operations/StaffDirectory";
import DocumentVault from "@/components/operations/DocumentVault";
import VacationCalendar from "@/components/operations/VacationCalendar";

type StaffProfile = {
  id: string;
  full_name: string;
  role_category: string;
  specific_title: string | null;
  status: string;
  hire_date: string | null;
};

type ExpiringDocument = {
  doc_id: string;
  staff_id: string;
  staff_name: string;
  doc_type: string;
  file_name: string;
  expiry_date: string;
  days_remaining: number;
};

const roleIcons: Record<string, React.ReactNode> = {
  Aviation: <Plane className="w-5 h-5" />,
  Maritime: <Ship className="w-5 h-5" />,
  Ground: <Car className="w-5 h-5" />,
  Office: <Briefcase className="w-5 h-5" />,
  Household: <Home className="w-5 h-5" />,
};

const roleColors: Record<string, string> = {
  Aviation: "bg-sky-500/20 text-sky-400 border-sky-500/30",
  Maritime: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  Ground: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  Office: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  Household: "bg-green-500/20 text-green-400 border-green-500/30",
};

const statusColors: Record<string, string> = {
  Active: "bg-emerald-500/20 text-emerald-400",
  Leave: "bg-amber-500/20 text-amber-400",
  Terminated: "bg-red-500/20 text-red-400",
  Mission: "bg-cyan-500/20 text-cyan-400",
};

const OperationsPage = () => {
  const { user } = useAuth();
  const [staff, setStaff] = useState<StaffProfile[]>([]);
  const [expiringDocs, setExpiringDocs] = useState<ExpiringDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  const fetchStaff = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("staff_profiles")
        .select("*")
        .eq("user_id", user.id)
        .order("full_name");

      if (error) throw error;
      setStaff(data || []);
    } catch (error) {
      console.error("Error fetching staff:", error);
      toast.error("Failed to load staff profiles");
    }
  };

  const fetchExpiringDocuments = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .rpc("get_expiring_documents", { p_user_id: user.id, days_threshold: 30 });

      if (error) throw error;
      setExpiringDocs(data || []);
    } catch (error) {
      console.error("Error fetching expiring documents:", error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchStaff(), fetchExpiringDocuments()]);
      setLoading(false);
    };

    if (user) {
      loadData();
    }
  }, [user]);

  // Stats by role
  const statsByRole = staff.reduce((acc, s) => {
    const role = s.role_category || "Office";
    acc[role] = (acc[role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Stats by status
  const statsByStatus = staff.reduce((acc, s) => {
    const status = s.status || "Active";
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const activeStaff = statsByStatus["Active"] || 0;
  const onLeave = statsByStatus["Leave"] || 0;
  const onMission = statsByStatus["Mission"] || 0;

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-foreground flex items-center gap-3">
            <Shield className="w-10 h-10 text-cyan-500" />
            Operations Command Center
          </h1>
          <p className="text-muted-foreground mt-2">
            Human Capital & Fleet Crew Management
          </p>
        </div>
        <Button onClick={() => setActiveTab("staff")}>
          <UserPlus className="w-4 h-4 mr-2" />
          Add Staff
        </Button>
      </div>

      {/* Quick Links */}
      <div className="flex gap-4 mb-6 flex-wrap">
        <Link to="/operations/staff" className="flex-1 min-w-[200px]">
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-cyan-950/30 border border-cyan-800 hover:bg-cyan-950/50 transition-colors cursor-pointer">
            <Users className="w-5 h-5 text-cyan-500" />
            <span className="uppercase text-[10px] font-medium text-cyan-500 tracking-wider">
              STAFF
            </span>
            <span className="font-semibold text-foreground">Directory</span>
            <Badge variant="secondary" className="ml-auto bg-muted text-muted-foreground text-xs">
              {staff.length}
            </Badge>
          </div>
        </Link>
        <Link to="/operations/documents" className="flex-1 min-w-[200px]">
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-purple-950/30 border border-purple-800 hover:bg-purple-950/50 transition-colors cursor-pointer">
            <FileText className="w-5 h-5 text-purple-500" />
            <span className="uppercase text-[10px] font-medium text-purple-500 tracking-wider">
              VAULT
            </span>
            <span className="font-semibold text-foreground">Documents</span>
            {expiringDocs.length > 0 && (
              <Badge variant="destructive" className="ml-auto animate-pulse">
                {expiringDocs.length}
              </Badge>
            )}
          </div>
        </Link>
        <Link to="/operations/calendar" className="flex-1 min-w-[200px]">
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-amber-950/30 border border-amber-800 hover:bg-amber-950/50 transition-colors cursor-pointer">
            <Calendar className="w-5 h-5 text-amber-500" />
            <span className="uppercase text-[10px] font-medium text-amber-500 tracking-wider">
              SCHEDULE
            </span>
            <span className="font-semibold text-foreground">Vacations</span>
          </div>
        </Link>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="overview">Command Overview</TabsTrigger>
          <TabsTrigger value="staff">Staff Directory</TabsTrigger>
          <TabsTrigger value="documents">Document Vault</TabsTrigger>
          <TabsTrigger value="calendar">Vacation Calendar</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Staff
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{staff.length}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Across all categories
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-emerald-400">
                  Active
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-emerald-400">{activeStaff}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Currently on duty
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-amber-400">
                  On Leave
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-amber-400">{onLeave}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Vacation / Sick leave
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-cyan-400">
                  On Mission
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-cyan-400">{onMission}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Active deployments
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Role Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg">Staff by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(roleIcons).map(([role, icon]) => (
                    <div key={role} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${roleColors[role]}`}>
                          {icon}
                        </div>
                        <span className="font-medium text-foreground">{role}</span>
                      </div>
                      <Badge variant="secondary" className="bg-muted">
                        {statsByRole[role] || 0}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Expiring Documents Alert */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  Expiring Documents
                </CardTitle>
              </CardHeader>
              <CardContent>
                {expiringDocs.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    No documents expiring in the next 30 days
                  </p>
                ) : (
                  <div className="space-y-3">
                    {expiringDocs.slice(0, 5).map((doc) => (
                      <div
                        key={doc.doc_id}
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          doc.days_remaining <= 7
                            ? "bg-red-950/30 border-red-800 animate-pulse"
                            : "bg-amber-950/20 border-amber-800"
                        }`}
                      >
                        <div>
                          <p className="font-medium text-foreground text-sm">
                            {doc.staff_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {doc.doc_type.replace("_", " ")} - {doc.file_name}
                          </p>
                        </div>
                        <Badge
                          variant={doc.days_remaining <= 7 ? "destructive" : "secondary"}
                          className={doc.days_remaining <= 7 ? "animate-pulse" : ""}
                        >
                          {doc.days_remaining}d
                        </Badge>
                      </div>
                    ))}
                    {expiringDocs.length > 5 && (
                      <Button
                        variant="ghost"
                        className="w-full text-sm"
                        onClick={() => setActiveTab("documents")}
                      >
                        View all {expiringDocs.length} expiring documents
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Staff Directory Tab */}
        <TabsContent value="staff">
          <StaffDirectory />
        </TabsContent>

        {/* Document Vault Tab */}
        <TabsContent value="documents">
          <DocumentVault />
        </TabsContent>

        {/* Vacation Calendar Tab */}
        <TabsContent value="calendar">
          <VacationCalendar />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OperationsPage;
