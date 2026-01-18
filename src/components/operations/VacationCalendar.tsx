import { useState, useEffect } from "react";
import { 
  Calendar, 
  Plus, 
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Plane,
  Ship,
  Car,
  Briefcase,
  Home
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isWithinInterval, parseISO } from "date-fns";
import VacationForm from "./VacationForm";

type StaffProfile = {
  id: string;
  full_name: string;
  role_category: string;
};

type VacationLog = {
  id: string;
  staff_id: string;
  start_date: string;
  end_date: string;
  vacation_type: string;
  approval_status: string;
  notes: string | null;
  staff_profiles?: StaffProfile;
};

const roleIcons: Record<string, React.ReactNode> = {
  Aviation: <Plane className="w-3 h-3" />,
  Maritime: <Ship className="w-3 h-3" />,
  Ground: <Car className="w-3 h-3" />,
  Office: <Briefcase className="w-3 h-3" />,
  Household: <Home className="w-3 h-3" />,
};

const vacationColors: Record<string, string> = {
  Paid: "bg-emerald-500/60",
  Sick: "bg-amber-500/60",
  Unpaid: "bg-slate-500/60",
};

const VacationCalendar = () => {
  const { user } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [vacations, setVacations] = useState<VacationLog[]>([]);
  const [staff, setStaff] = useState<StaffProfile[]>([]);
  const [conflicts, setConflicts] = useState<{ date: string; roles: string[] }[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);

  const fetchData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Fetch staff
      const { data: staffData, error: staffError } = await supabase
        .from("staff_profiles")
        .select("id, full_name, role_category")
        .eq("user_id", user.id)
        .order("role_category", { ascending: true });

      if (staffError) throw staffError;
      setStaff(staffData || []);

      // Fetch vacations for the current month range (with buffer)
      const monthStart = subMonths(startOfMonth(currentMonth), 1);
      const monthEnd = addMonths(endOfMonth(currentMonth), 1);

      const { data: vacationData, error: vacationError } = await supabase
        .from("vacation_logs")
        .select(`
          *,
          staff_profiles (
            id,
            full_name,
            role_category
          )
        `)
        .eq("user_id", user.id)
        .gte("end_date", format(monthStart, "yyyy-MM-dd"))
        .lte("start_date", format(monthEnd, "yyyy-MM-dd"))
        .eq("approval_status", "Approved");

      if (vacationError) throw vacationError;
      setVacations(vacationData || []);

      // Detect conflicts
      detectConflicts(vacationData || [], staffData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load calendar data");
    } finally {
      setLoading(false);
    }
  };

  const detectConflicts = (vacs: VacationLog[], staffList: StaffProfile[]) => {
    const conflictDays: { date: string; roles: string[] }[] = [];
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    days.forEach((day) => {
      const dateStr = format(day, "yyyy-MM-dd");
      const roleConflicts: Record<string, string[]> = {};

      vacs.forEach((vac) => {
        if (
          isWithinInterval(day, {
            start: parseISO(vac.start_date),
            end: parseISO(vac.end_date),
          })
        ) {
          const role = vac.staff_profiles?.role_category || "Unknown";
          if (!roleConflicts[role]) roleConflicts[role] = [];
          roleConflicts[role].push(vac.staff_profiles?.full_name || "");
        }
      });

      // Check if any role has 2+ people on vacation
      const conflictingRoles = Object.entries(roleConflicts)
        .filter(([_, names]) => names.length >= 2)
        .map(([role, _]) => role);

      if (conflictingRoles.length > 0) {
        conflictDays.push({ date: dateStr, roles: conflictingRoles });
      }
    });

    setConflicts(conflictDays);
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, currentMonth]);

  const getVacationsForStaff = (staffId: string) => {
    return vacations.filter((v) => v.staff_id === staffId);
  };

  const isVacationDay = (staffId: string, day: Date) => {
    const staffVacations = getVacationsForStaff(staffId);
    return staffVacations.find((v) =>
      isWithinInterval(day, {
        start: parseISO(v.start_date),
        end: parseISO(v.end_date),
      })
    );
  };

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const hasConflict = (dateStr: string) => {
    return conflicts.find((c) => c.date === dateStr);
  };

  // Group staff by role
  const staffByRole = staff.reduce((acc, s) => {
    const role = s.role_category || "Office";
    if (!acc[role]) acc[role] = [];
    acc[role].push(s);
    return acc;
  }, {} as Record<string, StaffProfile[]>);

  return (
    <div className="space-y-6">
      {/* Conflict Alert */}
      {conflicts.length > 0 && (
        <Card className="bg-red-950/30 border-red-800">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 animate-pulse" />
            <span className="text-red-200">
              <strong>{conflicts.length}</strong> day{conflicts.length > 1 ? "s" : ""} with role coverage conflicts detected
            </span>
          </CardContent>
        </Card>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h2 className="text-xl font-semibold text-foreground min-w-[200px] text-center">
            {format(currentMonth, "MMMM yyyy")}
          </h2>
          <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Vacation
        </Button>
      </div>

      {/* Gantt-style Calendar */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : staff.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No staff members found. Add staff first.
        </div>
      ) : (
        <Card className="bg-card border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="sticky left-0 bg-card z-10 p-2 text-left text-sm font-medium text-muted-foreground min-w-[200px]">
                    Staff
                  </th>
                  {days.map((day) => {
                    const dateStr = format(day, "yyyy-MM-dd");
                    const conflict = hasConflict(dateStr);
                    return (
                      <th 
                        key={dateStr} 
                        className={`p-1 text-center text-xs font-medium min-w-[30px] ${
                          conflict ? "bg-red-950/50" : ""
                        }`}
                      >
                        <div className={conflict ? "text-red-400" : "text-muted-foreground"}>
                          {format(day, "d")}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {format(day, "EEE").charAt(0)}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {Object.entries(staffByRole).map(([role, roleStaff]) => (
                  <>
                    <tr key={`header-${role}`} className="bg-muted/30">
                      <td 
                        colSpan={days.length + 1} 
                        className="p-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                      >
                        <div className="flex items-center gap-2">
                          {roleIcons[role]}
                          {role}
                        </div>
                      </td>
                    </tr>
                    {roleStaff.map((staffMember) => (
                      <tr key={staffMember.id} className="border-b border-border/50 hover:bg-muted/20">
                        <td className="sticky left-0 bg-card z-10 p-2 text-sm font-medium text-foreground">
                          {staffMember.full_name}
                        </td>
                        {days.map((day) => {
                          const dateStr = format(day, "yyyy-MM-dd");
                          const vacation = isVacationDay(staffMember.id, day);
                          const conflict = hasConflict(dateStr);
                          return (
                            <td 
                              key={dateStr} 
                              className={`p-0 ${conflict ? "bg-red-950/20" : ""}`}
                            >
                              {vacation && (
                                <div 
                                  className={`h-6 ${vacationColors[vacation.vacation_type]} rounded-sm mx-0.5`}
                                  title={`${vacation.vacation_type} Leave${vacation.notes ? `: ${vacation.notes}` : ""}`}
                                />
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Legend */}
      <div className="flex items-center gap-6 text-sm text-muted-foreground">
        <span className="font-medium">Legend:</span>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-emerald-500/60" />
          <span>Paid Leave</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-amber-500/60" />
          <span>Sick Leave</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-slate-500/60" />
          <span>Unpaid Leave</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-950/50 border border-red-800" />
          <span>Coverage Conflict</span>
        </div>
      </div>

      {/* Add Vacation Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Vacation Request</DialogTitle>
          </DialogHeader>
          <VacationForm 
            onSuccess={() => {
              setFormOpen(false);
              fetchData();
            }}
            onCancel={() => setFormOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VacationCalendar;
