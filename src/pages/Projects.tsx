import ExpenseProjectManagement from "@/components/financial/ExpenseProjectManagement";
import { FolderKanban } from "lucide-react";

export default function ProjectsPage() {
  return (
    <div className="w-full h-full flex flex-col">
      <div className="border-b bg-background px-6 py-4">
        <div className="flex items-center gap-3 max-w-[1800px] mx-auto">
          <FolderKanban className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Projects</h1>
            <p className="text-sm text-muted-foreground">
              Manage projects and track expenses
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-6 py-6 max-w-[1800px] mx-auto w-full">
        <ExpenseProjectManagement />
      </div>
    </div>
  );
}
