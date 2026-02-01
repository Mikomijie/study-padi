import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  User, 
  Mail, 
  Camera, 
  Save,
  Trophy,
  Flame,
  BookOpen,
  Clock,
  Calendar,
  LogOut,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { AppLayout } from "@/components/layout/AppLayout";
import { BadgeGrid, Badge } from "@/components/dashboard/BadgeGrid";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const mockUser = {
  name: "Alex Johnson",
  avatar: "",
  streak: 12,
};

const mockBadges: Badge[] = [
  { id: "1", name: "Week Warrior", description: "Achieved a 7-day learning streak", icon: "🔥", isEarned: true, earnedAt: "2025-01-25" },
  { id: "2", name: "Getting Started", description: "Completed your first section", icon: "🎓", isEarned: true, earnedAt: "2025-01-15" },
  { id: "3", name: "Finisher", description: "Completed an entire course", icon: "🏆", isEarned: true, earnedAt: "2025-01-30" },
  { id: "4", name: "Ace", description: "Got 100% on any test", icon: "⭐", isEarned: true, earnedAt: "2025-01-28" },
  { id: "5", name: "Knowledge Builder", description: "Completed 10 sections", icon: "🧠", isEarned: true, earnedAt: "2025-01-27" },
  { id: "6", name: "Month Master", description: "Achieved a 30-day streak", icon: "🌟", isEarned: false },
  { id: "7", name: "Century Champion", description: "Achieved a 100-day streak", icon: "👑", isEarned: false },
];

const mockStats = {
  totalStudyTime: "24h 35m",
  coursesCompleted: 3,
  sectionsCompleted: 28,
  averageScore: 87,
  joinedDate: "January 2025",
};

export default function Profile() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth?mode=login");
        return;
      }

      setDisplayName(session.user.user_metadata?.display_name || session.user.email?.split("@")[0] || "");
      setEmail(session.user.email || "");
      setIsLoading(false);
    };

    loadProfile();
  }, [navigate]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { display_name: displayName }
      });
      
      if (error) throw error;
      
      toast({
        title: "Profile updated!",
        description: "Your changes have been saved.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <AppLayout user={mockUser}>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
            Your <span className="gradient-text-primary">Profile</span>
          </h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-6"
            >
              <h2 className="font-semibold text-lg mb-6">Profile Information</h2>
              
              {/* Avatar */}
              <div className="flex items-center gap-6 mb-6">
                <div className="relative">
                  <Avatar className="w-24 h-24 border-4 border-primary/30">
                    <AvatarImage src="" alt={displayName} />
                    <AvatarFallback className="bg-primary/20 text-primary text-2xl">
                      {displayName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground hover:scale-110 transition-transform">
                    <Camera className="w-4 h-4" />
                  </button>
                </div>
                <div>
                  <h3 className="font-semibold text-xl">{displayName}</h3>
                  <p className="text-muted-foreground">{email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="streak-badge text-xs py-1 px-2">
                      <Flame className="w-3 h-3" />
                      {mockUser.streak} day streak
                    </span>
                  </div>
                </div>
              </div>

              <Separator className="my-6" />

              {/* Form */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="displayName"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="pl-10 h-12 bg-background/50"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="email"
                      value={email}
                      disabled
                      className="pl-10 h-12 bg-background/50 opacity-50"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                </div>

                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="gradient-bg-primary text-primary-foreground"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Changes
                </Button>
              </div>
            </motion.div>

            {/* Preferences */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-card p-6"
            >
              <h2 className="font-semibold text-lg mb-6">Preferences</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Email Notifications</p>
                    <p className="text-sm text-muted-foreground">
                      Receive daily streak reminders and progress updates
                    </p>
                  </div>
                  <Switch
                    checked={notifications}
                    onCheckedChange={setNotifications}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Dark Mode</p>
                    <p className="text-sm text-muted-foreground">
                      Use dark theme for the interface
                    </p>
                  </div>
                  <Switch
                    checked={darkMode}
                    onCheckedChange={setDarkMode}
                  />
                </div>
              </div>
            </motion.div>

            {/* Badges */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg gradient-bg-primary">
                  <Trophy className="w-5 h-5 text-primary-foreground" />
                </div>
                <h2 className="font-semibold text-lg">Your Achievements</h2>
              </div>
              <BadgeGrid badges={mockBadges} />
            </motion.div>
          </div>

          {/* Right Column - Stats */}
          <div className="space-y-6">
            {/* Stats Cards */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <div className="glass-card p-4 flex items-center gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Clock className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold gradient-text-primary">{mockStats.totalStudyTime}</p>
                  <p className="text-sm text-muted-foreground">Total Study Time</p>
                </div>
              </div>

              <div className="glass-card p-4 flex items-center gap-4">
                <div className="p-3 rounded-lg bg-success/10">
                  <BookOpen className="w-6 h-6 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-success">{mockStats.coursesCompleted}</p>
                  <p className="text-sm text-muted-foreground">Courses Completed</p>
                </div>
              </div>

              <div className="glass-card p-4 flex items-center gap-4">
                <div className="p-3 rounded-lg bg-accent/10">
                  <Trophy className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold gradient-text-accent">{mockStats.averageScore}%</p>
                  <p className="text-sm text-muted-foreground">Average Test Score</p>
                </div>
              </div>

              <div className="glass-card p-4 flex items-center gap-4">
                <div className="p-3 rounded-lg bg-muted">
                  <Calendar className="w-6 h-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-lg font-semibold">{mockStats.joinedDate}</p>
                  <p className="text-sm text-muted-foreground">Member Since</p>
                </div>
              </div>
            </motion.div>

            {/* Danger Zone */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-card p-6 border-destructive/30"
            >
              <h2 className="font-semibold text-lg mb-4 text-destructive">Danger Zone</h2>
              <Button
                variant="outline"
                onClick={handleLogout}
                className="w-full border-destructive text-destructive hover:bg-destructive/10"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </motion.div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
