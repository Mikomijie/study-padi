import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  Download, 
  Flame, 
  GraduationCap, 
  Trophy, 
  Star, 
  Brain, 
  Sparkles,
  Crown,
  Target,
  Zap,
  Award,
  Medal,
  LucideIcon
} from "lucide-react";
import { useState } from "react";

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  isEarned: boolean;
  earnedAt?: string;
}

interface BadgeGridProps {
  badges: Badge[];
}

// Map emoji strings to Lucide icons
const iconMap: Record<string, LucideIcon> = {
  "🔥": Flame,
  "🎓": GraduationCap,
  "🏆": Trophy,
  "⭐": Star,
  "🧠": Brain,
  "🌟": Sparkles,
  "👑": Crown,
  "🎯": Target,
  "⚡": Zap,
  "🥇": Award,
  "🏅": Medal,
};

function getBadgeIcon(icon: string): LucideIcon {
  return iconMap[icon] || Star;
}

export function BadgeGrid({ badges }: BadgeGridProps) {
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);

  const handleDownload = (badge: Badge) => {
    // Create a canvas to render the badge as PNG
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext("2d");
    
    if (ctx) {
      // Background gradient
      const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
      gradient.addColorStop(0, "#3A6B5A");
      gradient.addColorStop(1, "#2F5B4C");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(128, 128, 120, 0, Math.PI * 2);
      ctx.fill();
      
      // Inner circle
      ctx.beginPath();
      ctx.arc(128, 128, 100, 0, Math.PI * 2);
      ctx.fillStyle = "#152823";
      ctx.fill();
      
      // Badge icon (simplified - using text representation)
      ctx.font = "bold 48px Inter";
      ctx.fillStyle = "#6BC2A4";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("★", 128, 100);
      
      // Name
      ctx.font = "bold 16px Inter";
      ctx.fillStyle = "#F4F7F5";
      ctx.fillText(badge.name, 128, 160);
      
      // Description (truncated)
      ctx.font = "12px Inter";
      ctx.fillStyle = "#A7B8B1";
      const desc = badge.description.length > 30 
        ? badge.description.substring(0, 27) + "..." 
        : badge.description;
      ctx.fillText(desc, 128, 185);
      
      // Download
      const link = document.createElement("a");
      link.download = `${badge.name.toLowerCase().replace(/\s+/g, "-")}-badge.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    }
  };

  return (
    <>
      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-7 gap-2 sm:gap-3">
        {badges.map((badge, index) => {
          const IconComponent = getBadgeIcon(badge.icon);
          return (
            <motion.button
              key={badge.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => badge.isEarned && setSelectedBadge(badge)}
              className={cn(
                "aspect-square rounded-lg flex items-center justify-center transition-all duration-200 min-h-[44px]",
                badge.isEarned
                  ? "badge-earned glass-card hover:border-primary/50"
                  : "badge-locked bg-muted/30 cursor-not-allowed"
              )}
              disabled={!badge.isEarned}
              title={badge.isEarned ? badge.name : "Locked"}
            >
              <IconComponent className={cn(
                "w-6 h-6 sm:w-7 sm:h-7",
                badge.isEarned ? "text-primary" : "text-muted-foreground"
              )} />
            </motion.button>
          );
        })}
      </div>

      <Dialog open={!!selectedBadge} onOpenChange={() => setSelectedBadge(null)}>
        <DialogContent className="glass-card-elevated sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {selectedBadge && (
                <>
                  {(() => {
                    const IconComponent = getBadgeIcon(selectedBadge.icon);
                    return <IconComponent className="w-8 h-8 text-primary" />;
                  })()}
                  <span>{selectedBadge?.name}</span>
                </>
              )}
            </DialogTitle>
            <DialogDescription className="pt-2">
              {selectedBadge?.description}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col items-center py-6">
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full gradient-bg-primary flex items-center justify-center glow-primary mb-4">
              {selectedBadge && (
                (() => {
                  const IconComponent = getBadgeIcon(selectedBadge.icon);
                  return <IconComponent className="w-12 h-12 sm:w-16 sm:h-16 text-primary-foreground" />;
                })()
              )}
            </div>
            {selectedBadge?.earnedAt && (
              <p className="text-sm text-muted-foreground">
                Earned on {new Date(selectedBadge.earnedAt).toLocaleDateString()}
              </p>
            )}
          </div>

          <Button
            onClick={() => selectedBadge && handleDownload(selectedBadge)}
            className="w-full gradient-bg-primary text-primary-foreground min-h-[44px]"
          >
            <Download className="w-4 h-4 mr-2" />
            Download Badge
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
