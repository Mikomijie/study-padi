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
import { Download } from "lucide-react";
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

export function BadgeGrid({ badges }: BadgeGridProps) {
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);

  const handleDownload = (badge: Badge) => {
    // Create a canvas to render the badge as PNG
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext("2d");
    
    if (ctx) {
      // Background
      ctx.fillStyle = "#1a1f2e";
      ctx.fillRect(0, 0, 256, 256);
      
      // Badge circle
      ctx.beginPath();
      ctx.arc(128, 100, 60, 0, Math.PI * 2);
      ctx.fillStyle = "#06b6d4";
      ctx.fill();
      
      // Emoji
      ctx.font = "48px Arial";
      ctx.textAlign = "center";
      ctx.fillText(badge.icon, 128, 115);
      
      // Name
      ctx.font = "bold 18px Inter";
      ctx.fillStyle = "#fff";
      ctx.fillText(badge.name, 128, 190);
      
      // Download
      const link = document.createElement("a");
      link.download = `${badge.name.toLowerCase().replace(/\s+/g, "-")}-badge.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    }
  };

  return (
    <>
      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-7 gap-3">
        {badges.map((badge, index) => (
          <motion.button
            key={badge.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => badge.isEarned && setSelectedBadge(badge)}
            className={cn(
              "aspect-square rounded-xl flex items-center justify-center text-3xl transition-all",
              badge.isEarned
                ? "badge-earned glass-card hover:glow-primary"
                : "badge-locked bg-muted/30 cursor-not-allowed"
            )}
            disabled={!badge.isEarned}
            title={badge.isEarned ? badge.name : "Locked"}
          >
            {badge.icon}
          </motion.button>
        ))}
      </div>

      <Dialog open={!!selectedBadge} onOpenChange={() => setSelectedBadge(null)}>
        <DialogContent className="glass-card-elevated sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <span className="text-4xl">{selectedBadge?.icon}</span>
              <span>{selectedBadge?.name}</span>
            </DialogTitle>
            <DialogDescription className="pt-2">
              {selectedBadge?.description}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col items-center py-6">
            <div className="w-32 h-32 rounded-full gradient-bg-primary flex items-center justify-center glow-primary mb-4">
              <span className="text-6xl">{selectedBadge?.icon}</span>
            </div>
            {selectedBadge?.earnedAt && (
              <p className="text-sm text-muted-foreground">
                Earned on {new Date(selectedBadge.earnedAt).toLocaleDateString()}
              </p>
            )}
          </div>

          <Button
            onClick={() => selectedBadge && handleDownload(selectedBadge)}
            className="w-full gradient-bg-primary text-primary-foreground"
          >
            <Download className="w-4 h-4 mr-2" />
            Download Badge
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
