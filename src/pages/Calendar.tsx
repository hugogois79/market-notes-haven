import YearCalendar from "@/components/financial/YearCalendar";

export default function CalendarPage() {
  return (
    <div className="w-full h-full flex flex-col">
      <div className="border-b bg-background px-6 py-4">
        <div className="max-w-[1800px] mx-auto">
          <h1 className="text-2xl font-bold">Calendário Anual</h1>
          <p className="text-sm text-muted-foreground">
            Year-at-a-Glance View
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-6 py-6 max-w-[1800px] mx-auto w-full">
        <YearCalendar />
      </div>
    </div>
  );
}