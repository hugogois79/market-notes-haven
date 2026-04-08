import { useState, useEffect } from "react";
import { 
  Users, 
  Plane, 
  Ship, 
  Car, 
  Briefcase, 
  Home,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import StaffForm from "./StaffForm";
import StaffSlidePanel from "./StaffSlidePanel";

export type StaffProfile = {
  id: string;
  user_id: string;
  full_name: string;
  role_category: string;
  specific_title: string | null;
  status: string;
  contact_info: any;
  base_salary: number | null;
  hire_date: string | null;
  avatar_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

const roleIcons: Record<string, React.ReactNode> = {
  Aviation: <Plane className="w-4 h-4" />,
  Maritime: <Ship className="w-4 h-4" />,
  Ground: <Car className="w-4 h-4" />,
  Office: <Briefcase className="w-4 h-4" />,
  Household: <Home className="w-4 h-4" />,
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

const StaffDirectory = () => {
  const { user } = useAuth();
  const [staff, setStaff] = useState<StaffProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffProfile | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<StaffProfile | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  const fetchStaff = async () => {
    if (!user) return;
    
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchStaff();
    }
  }, [user]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this staff member?")) return;
    
    try {
      const { error } = await supabase
        .from("staff_profiles")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      toast.success("Staff member deleted");
      fetchStaff();
    } catch (error) {
      console.error("Error deleting staff:", error);
      toast.error("Failed to delete staff member");
    }
  };

  const handleEdit = (staffMember: StaffProfile) => {
    setEditingStaff(staffMember);
    setFormOpen(true);
  };

  const handleView = (staffMember: StaffProfile) => {
    setSelectedStaff(staffMember);
    setPanelOpen(true);
  };

  const filteredStaff = staff.filter((s) => {
    const matchesSearch = s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.specific_title?.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRole = filterRole === "all" || s.role_category === filterRole;
    const matchesStatus = filterStatus === "all" || s.status === filterStatus;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row gap-4 justify-between">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search staff..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-[200px]"
            />
          </div>
          <Select value={filterRole} onValueChange={setFilterRole}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="Aviation">Aviation</SelectItem>
              <SelectItem value="Maritime">Maritime</SelectItem>
              <SelectItem value="Ground">Ground</SelectItem>
              <SelectItem value="Office">Office</SelectItem>
              <SelectItem value="Household">Household</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Leave">On Leave</SelectItem>
              <SelectItem value="Mission">On Mission</SelectItem>
              <SelectItem value="Terminated">Terminated</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => { setEditingStaff(null); setFormOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Add Staff
        </Button>
      </div>

      {/* Staff Grid */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : filteredStaff.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No staff members found. Add your first team member.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStaff.map((staffMember) => (
            <Card 
              key={staffMember.id} 
              className="bg-card border-border hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => handleView(staffMember)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={staffMember.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/20 text-primary">
                        {getInitials(staffMember.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {staffMember.full_name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {staffMember.specific_title || staffMember.role_category}
                      </p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleView(staffMember); }}>
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEdit(staffMember); }}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={(e) => { e.stopPropagation(); handleDelete(staffMember.id); }}
                        className="text-red-500"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="flex items-center gap-2 mt-4">
                  <Badge className={`${roleColors[staffMember.role_category]} border`}>
                    {roleIcons[staffMember.role_category]}
                    <span className="ml-1">{staffMember.role_category}</span>
                  </Badge>
                  <Badge className={statusColors[staffMember.status]}>
                    {staffMember.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingStaff ? "Edit Staff Member" : "Add New Staff Member"}
            </DialogTitle>
          </DialogHeader>
          <StaffForm 
            staff={editingStaff} 
            onSuccess={() => {
              setFormOpen(false);
              setEditingStaff(null);
              fetchStaff();
            }}
            onCancel={() => {
              setFormOpen(false);
              setEditingStaff(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Slide Panel */}
      <StaffSlidePanel 
        staff={selectedStaff}
        open={panelOpen}
        onClose={() => {
          setPanelOpen(false);
          setSelectedStaff(null);
        }}
        onEdit={() => {
          setPanelOpen(false);
          if (selectedStaff) handleEdit(selectedStaff);
        }}
        onRefresh={fetchStaff}
      />
    </div>
  );
};

export default StaffDirectory;
