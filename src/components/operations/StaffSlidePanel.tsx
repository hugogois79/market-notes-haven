import { useState, useEffect } from "react";
import { 
  X, 
  Edit, 
  FileText, 
  Calendar, 
  StickyNote,
  Phone,
  Mail,
  DollarSign,
  CalendarDays,
  Eye,
  EyeOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { StaffProfile } from "./StaffDirectory";
import { format, differenceInDays } from "date-fns";

type Document = {
  id: string;
  doc_type: string;
  file_name: string;
  file_url: string;
  issue_date: string | null;
  expiry_date: string | null;
  is_verified: boolean;
};

type VacationLog = {
  id: string;
  start_date: string;
  end_date: string;
  vacation_type: string;
  approval_status: string;
  notes: string | null;
};

type Props = {
  staff: StaffProfile | null;
  open: boolean;
  onClose: () => void;
  onEdit: () => void;
  onRefresh: () => void;
};

const roleColors: Record<string, string> = {
  Aviation: "bg-sky-500/20 text-sky-400",
  Maritime: "bg-blue-500/20 text-blue-400",
  Ground: "bg-amber-500/20 text-amber-400",
  Office: "bg-purple-500/20 text-purple-400",
  Household: "bg-green-500/20 text-green-400",
};

const statusColors: Record<string, string> = {
  Active: "bg-emerald-500/20 text-emerald-400",
  Leave: "bg-amber-500/20 text-amber-400",
  Terminated: "bg-red-500/20 text-red-400",
  Mission: "bg-cyan-500/20 text-cyan-400",
};

const StaffSlidePanel = ({ staff, open, onClose, onEdit, onRefresh }: Props) => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [vacations, setVacations] = useState<VacationLog[]>([]);
  const [blurSensitive, setBlurSensitive] = useState(true);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [loadingVacations, setLoadingVacations] = useState(false);

  useEffect(() => {
    if (staff && open) {
      fetchDocuments();
      fetchVacations();
    }
  }, [staff, open]);

  const fetchDocuments = async () => {
    if (!staff) return;
    setLoadingDocs(true);
    try {
      const { data, error } = await supabase
        .from("contracts_docs")
        .select("*")
        .eq("staff_id", staff.id)
        .order("expiry_date", { ascending: true });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error("Error fetching documents:", error);
    } finally {
      setLoadingDocs(false);
    }
  };

  const fetchVacations = async () => {
    if (!staff) return;
    setLoadingVacations(true);
    try {
      const { data, error } = await supabase
        .from("vacation_logs")
        .select("*")
        .eq("staff_id", staff.id)
        .order("start_date", { ascending: false });

      if (error) throw error;
      setVacations(data || []);
    } catch (error) {
      console.error("Error fetching vacations:", error);
    } finally {
      setLoadingVacations(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getDocExpiryBadge = (expiryDate: string | null) => {
    if (!expiryDate) return null;
    const days = differenceInDays(new Date(expiryDate), new Date());
    if (days < 0) {
      return <Badge variant="destructive">Expired</Badge>;
    }
    if (days <= 7) {
      return <Badge variant="destructive" className="animate-pulse">{days}d left</Badge>;
    }
    if (days <= 30) {
      return <Badge className="bg-amber-500/20 text-amber-400">{days}d left</Badge>;
    }
    return <Badge variant="secondary">{days}d left</Badge>;
  };

  if (!staff) return null;

  const daysSinceHire = staff.hire_date 
    ? differenceInDays(new Date(), new Date(staff.hire_date))
    : null;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg overflow-hidden flex flex-col">
        <SheetHeader className="space-y-4 pb-4 border-b border-border">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={staff.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/20 text-primary text-xl">
                  {getInitials(staff.full_name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <SheetTitle className="text-xl">{staff.full_name}</SheetTitle>
                <p className="text-muted-foreground">
                  {staff.specific_title || staff.role_category}
                </p>
                <div className="flex gap-2 mt-2">
                  <Badge className={roleColors[staff.role_category]}>
                    {staff.role_category}
                  </Badge>
                  <Badge className={statusColors[staff.status]}>
                    {staff.status}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setBlurSensitive(!blurSensitive)}
            >
              {blurSensitive ? (
                <>
                  <Eye className="w-4 h-4 mr-2" />
                  Show Sensitive
                </>
              ) : (
                <>
                  <EyeOff className="w-4 h-4 mr-2" />
                  Hide Sensitive
                </>
              )}
            </Button>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 pr-4">
          <Tabs defaultValue="info" className="mt-4">
            <TabsList className="w-full">
              <TabsTrigger value="info" className="flex-1">Info</TabsTrigger>
              <TabsTrigger value="documents" className="flex-1">
                Documents
                {documents.length > 0 && (
                  <Badge variant="secondary" className="ml-2">{documents.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="vacations" className="flex-1">Vacations</TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="space-y-4 mt-4">
              {/* Contact Info */}
              <Card className="bg-card">
                <CardContent className="p-4 space-y-3">
                  <h4 className="font-semibold text-foreground flex items-center gap-2">
                    Contact Information
                  </h4>
                  {staff.contact_info?.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span className={blurSensitive ? "blur-sm select-none" : ""}>
                        {String(staff.contact_info.phone)}
                      </span>
                    </div>
                  )}
                  {staff.contact_info?.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span className={blurSensitive ? "blur-sm select-none" : ""}>
                        {String(staff.contact_info.email)}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Employment Info */}
              <Card className="bg-card">
                <CardContent className="p-4 space-y-3">
                  <h4 className="font-semibold text-foreground">Employment Details</h4>
                  {staff.hire_date && (
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="w-4 h-4 text-muted-foreground" />
                        <span>Hire Date</span>
                      </div>
                      <span className="text-muted-foreground">
                        {format(new Date(staff.hire_date), "MMM d, yyyy")}
                        {daysSinceHire !== null && (
                          <span className="ml-2 text-xs">({daysSinceHire} days)</span>
                        )}
                      </span>
                    </div>
                  )}
                  {staff.base_salary && (
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-muted-foreground" />
                        <span>Base Salary</span>
                      </div>
                      <span className={blurSensitive ? "blur-sm select-none" : "text-muted-foreground"}>
                        €{staff.base_salary.toLocaleString()}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Notes */}
              {staff.notes && (
                <Card className="bg-card">
                  <CardContent className="p-4">
                    <h4 className="font-semibold text-foreground flex items-center gap-2 mb-2">
                      <StickyNote className="w-4 h-4" />
                      Notes
                    </h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {staff.notes}
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="documents" className="space-y-3 mt-4">
              {loadingDocs ? (
                <p className="text-muted-foreground text-center py-8">Loading...</p>
              ) : documents.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No documents uploaded</p>
              ) : (
                documents.map((doc) => (
                  <Card key={doc.id} className="bg-card">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-foreground">
                            {doc.doc_type.replace("_", " ")}
                          </p>
                          <p className={`text-sm text-muted-foreground ${
                            doc.doc_type === "Passport" && blurSensitive ? "blur-sm" : ""
                          }`}>
                            {doc.file_name}
                          </p>
                          {doc.expiry_date && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Expires: {format(new Date(doc.expiry_date), "MMM d, yyyy")}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {getDocExpiryBadge(doc.expiry_date)}
                          {doc.is_verified && (
                            <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-400">
                              Verified
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="vacations" className="space-y-3 mt-4">
              {loadingVacations ? (
                <p className="text-muted-foreground text-center py-8">Loading...</p>
              ) : vacations.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No vacation records</p>
              ) : (
                vacations.map((vac) => (
                  <Card key={vac.id} className="bg-card">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-foreground">
                            {format(new Date(vac.start_date), "MMM d")} - {format(new Date(vac.end_date), "MMM d, yyyy")}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {vac.vacation_type} Leave
                          </p>
                          {vac.notes && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {vac.notes}
                            </p>
                          )}
                        </div>
                        <Badge className={
                          vac.approval_status === "Approved" 
                            ? "bg-emerald-500/20 text-emerald-400"
                            : vac.approval_status === "Denied"
                            ? "bg-red-500/20 text-red-400"
                            : "bg-amber-500/20 text-amber-400"
                        }>
                          {vac.approval_status}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default StaffSlidePanel;
