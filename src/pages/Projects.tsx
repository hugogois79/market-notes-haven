import ExpenseProjectManagement from "@/components/financial/ExpenseProjectManagement";

export default function ProjectsPage() {
  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1 overflow-auto px-6 py-6 max-w-[1800px] mx-auto w-full">
        <ExpenseProjectManagement />
      </div>
    </div>
  );
}
