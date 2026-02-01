import { motion } from "framer-motion";
import { AlertCircle, ChevronRight, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Term {
  id: string;
  term: string;
  definition: string;
  reviewCount: number;
}

interface DifficultTermsProps {
  terms: Term[];
  onPractice?: (termId: string) => void;
}

export function DifficultTerms({ terms, onPractice }: DifficultTermsProps) {
  if (terms.length === 0) {
    return (
      <div className="glass-card p-6 text-center">
        <Brain className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
        <p className="text-muted-foreground">No difficult terms yet!</p>
        <p className="text-sm text-muted-foreground mt-1">
          Terms you struggle with will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {terms.slice(0, 5).map((term, index) => (
        <motion.div
          key={term.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="glass-card p-4 group hover:border-warning/30 transition-colors"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle className="w-4 h-4 text-warning flex-shrink-0" />
                <span className="font-medium text-foreground truncate">
                  {term.term}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-warning/20 text-warning">
                  {term.reviewCount}x
                </span>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {term.definition}
              </p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onPractice?.(term.id)}
              className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              Practice
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
