import { cn } from "@/lib/utils";
import { format, subDays, isToday } from "date-fns";

interface StreakCalendarProps {
  activeDays: string[];
  className?: string;
}

export function StreakCalendar({ activeDays, className }: StreakCalendarProps) {
  const today = new Date();
  const days = Array.from({ length: 30 }, (_, i) => subDays(today, 29 - i));

  const isActive = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return activeDays.includes(dateStr);
  };

  return (
    <div className={cn("", className)}>
      <div className="grid grid-cols-10 gap-1.5">
        {days.map((day, index) => (
          <div
            key={index}
            className={cn(
              "w-6 h-6 rounded-sm transition-all duration-200",
              isActive(day)
                ? "bg-success glow-accent animate-bounce-in"
                : "bg-muted/50",
              isToday(day) && "ring-2 ring-primary ring-offset-1 ring-offset-background"
            )}
            title={format(day, "MMM d, yyyy")}
          />
        ))}
      </div>
      <div className="flex justify-between mt-2 text-xs text-muted-foreground">
        <span>30 days ago</span>
        <span>Today</span>
      </div>
    </div>
  );
}
