import { motion } from "framer-motion";
import { Book, Clock, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface CourseCardProps {
  id: string;
  title: string;
  sectionsCompleted: number;
  totalSections: number;
  lastAccessed?: string;
  onClick?: () => void;
  delay?: number;
}

export function CourseCard({
  title,
  sectionsCompleted,
  totalSections,
  lastAccessed,
  onClick,
  delay = 0,
}: CourseCardProps) {
  const progress = totalSections > 0 ? (sectionsCompleted / totalSections) * 100 : 0;
  const isCompleted = sectionsCompleted === totalSections && totalSections > 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.4 }}
      className={cn(
        "glass-card p-5 group hover:border-primary/30 transition-all cursor-pointer",
        isCompleted && "border-success/30"
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-2.5 rounded-lg",
            isCompleted ? "bg-success/20" : "bg-primary/10"
          )}>
            <Book className={cn(
              "w-5 h-5",
              isCompleted ? "text-success" : "text-primary"
            )} />
          </div>
          <div>
            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
              {title}
            </h3>
            <p className="text-sm text-muted-foreground">
              {sectionsCompleted}/{totalSections} sections
            </p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
      </div>

      <Progress value={progress} className="h-2 mb-3" />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="w-3.5 h-3.5" />
          <span>{lastAccessed || "Not started"}</span>
        </div>
        <span className={cn(
          "text-sm font-medium",
          isCompleted ? "text-success" : "gradient-text-primary"
        )}>
          {Math.round(progress)}%
        </span>
      </div>
    </motion.div>
  );
}
