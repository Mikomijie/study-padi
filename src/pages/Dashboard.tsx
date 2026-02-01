import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  Flame, 
  Clock, 
  BookOpen, 
  Trophy, 
  Upload, 
  Gamepad2,
  ArrowRight,
  Target,
  TrendingUp,
  Bell
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/layout/AppLayout";
import { ProgressRing } from "@/components/ui/progress-ring";
import { StreakCalendar } from "@/components/ui/streak-calendar";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { CourseCard } from "@/components/dashboard/CourseCard";
import { BadgeGrid, Badge } from "@/components/dashboard/BadgeGrid";
import { DifficultTerms } from "@/components/dashboard/DifficultTerms";
import { WeeklyChart } from "@/components/dashboard/WeeklyChart";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Mock data for demonstration
const mockUser = {
  name: "Alex Johnson",
  avatar: "",
  streak: 12,
};

const mockActiveDays = [
  "2025-01-28", "2025-01-29", "2025-01-30", "2025-01-31", "2025-02-01",
  "2025-01-25", "2025-01-26", "2025-01-20", "2025-01-21", "2025-01-22",
  "2025-01-15", "2025-01-16", "2025-01-17",
];

const mockCourses = [
  { id: "1", title: "Introduction to Machine Learning", sectionsCompleted: 8, totalSections: 12, lastAccessed: "2 hours ago" },
  { id: "2", title: "Advanced JavaScript Patterns", sectionsCompleted: 5, totalSections: 10, lastAccessed: "Yesterday" },
  { id: "3", title: "Data Structures & Algorithms", sectionsCompleted: 15, totalSections: 15, lastAccessed: "3 days ago" },
];

const mockBadges: Badge[] = [
  { id: "1", name: "Week Warrior", description: "Achieved a 7-day learning streak", icon: "🔥", isEarned: true, earnedAt: "2025-01-25" },
  { id: "2", name: "Getting Started", description: "Completed your first section", icon: "🎓", isEarned: true, earnedAt: "2025-01-15" },
  { id: "3", name: "Finisher", description: "Completed an entire course", icon: "🏆", isEarned: true, earnedAt: "2025-01-30" },
  { id: "4", name: "Ace", description: "Got 100% on any test", icon: "⭐", isEarned: true, earnedAt: "2025-01-28" },
  { id: "5", name: "Knowledge Builder", description: "Completed 10 sections", icon: "🧠", isEarned: true, earnedAt: "2025-01-27" },
  { id: "6", name: "Month Master", description: "Achieved a 30-day streak", icon: "🌟", isEarned: false },
  { id: "7", name: "Century Champion", description: "Achieved a 100-day streak", icon: "👑", isEarned: false },
];

const mockDifficultTerms = [
  { id: "1", term: "Gradient Descent", definition: "An optimization algorithm used to minimize the loss function in machine learning models.", reviewCount: 4 },
  { id: "2", term: "Backpropagation", definition: "Algorithm for training neural networks by calculating gradients through the chain rule.", reviewCount: 3 },
  { id: "3", term: "Overfitting", definition: "When a model learns training data too well, including noise, and fails to generalize.", reviewCount: 2 },
];

const mockWeeklyData = [
  { day: "Mon", minutes: 45 },
  { day: "Tue", minutes: 30 },
  { day: "Wed", minutes: 60 },
  { day: "Thu", minutes: 25 },
  { day: "Fri", minutes: 90 },
  { day: "Sat", minutes: 40 },
  { day: "Sun", minutes: 55 },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(mockUser);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth?mode=login");
        return;
      }
      
      // Get user info
      const displayName = session.user.user_metadata?.display_name || session.user.email?.split("@")[0] || "Learner";
      setUser({
        name: displayName,
        avatar: session.user.user_metadata?.avatar_url || "",
        streak: mockUser.streak, // Would come from database
      });
      setIsLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth?mode=login");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    // Show terms reminder notification
    if (mockDifficultTerms.length > 0) {
      setTimeout(() => {
        toast({
          title: "📚 Terms to Review",
          description: `You have ${mockDifficultTerms.length} terms that need practice today!`,
        });
      }, 1500);
    }
  }, [toast]);

  const overallProgress = Math.round(
    (mockCourses.reduce((acc, c) => acc + c.sectionsCompleted, 0) /
      mockCourses.reduce((acc, c) => acc + c.totalSections, 0)) *
      100
  );

  const totalMinutes = mockWeeklyData.reduce((acc, d) => acc + d.minutes, 0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <AppLayout user={user}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
            Welcome back, <span className="gradient-text-primary">{user.name}</span>!
          </h1>
          <p className="text-muted-foreground">
            You're doing great! Keep up the momentum.
          </p>
        </motion.div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatsCard
            title="Current Streak"
            value={`${user.streak} days`}
            icon={Flame}
            trend={{ value: 15, isPositive: true }}
            delay={0}
          />
          <StatsCard
            title="Weekly Study Time"
            value={`${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`}
            icon={Clock}
            delay={0.1}
          />
          <StatsCard
            title="Courses Active"
            value={mockCourses.length}
            subtitle={`${mockCourses.filter(c => c.sectionsCompleted === c.totalSections).length} completed`}
            icon={BookOpen}
            delay={0.2}
          />
          <StatsCard
            title="Badges Earned"
            value={mockBadges.filter(b => b.isEarned).length}
            subtitle={`of ${mockBadges.length} total`}
            icon={Trophy}
            delay={0.3}
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Progress Overview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card p-6"
            >
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="font-semibold text-lg mb-1">Overall Progress</h2>
                  <p className="text-sm text-muted-foreground">
                    You're making excellent progress across all courses
                  </p>
                </div>
                <ProgressRing progress={overallProgress} size={80}>
                  <span className="text-lg font-bold gradient-text-primary">
                    {overallProgress}%
                  </span>
                </ProgressRing>
              </div>

              {/* Quick Actions */}
              <div className="grid sm:grid-cols-3 gap-3">
                <Button
                  onClick={() => navigate("/learn")}
                  className="h-12 gradient-bg-primary text-primary-foreground glow-primary"
                >
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Continue Learning
                </Button>
                <Button
                  onClick={() => navigate("/upload")}
                  variant="outline"
                  className="h-12 border-primary/50 hover:bg-primary/10"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Material
                </Button>
                <Button
                  onClick={() => navigate("/games")}
                  variant="outline"
                  className="h-12 border-accent/50 hover:bg-accent/10"
                >
                  <Gamepad2 className="w-4 h-4 mr-2" />
                  Play Games
                </Button>
              </div>
            </motion.div>

            {/* Courses */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-lg">Your Courses</h2>
                <Button variant="ghost" size="sm" className="text-primary">
                  View All
                </Button>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                {mockCourses.map((course, index) => (
                  <CourseCard
                    key={course.id}
                    {...course}
                    onClick={() => navigate(`/learn/${course.id}`)}
                    delay={index * 0.1}
                  />
                ))}
              </div>
            </motion.div>

            {/* Weekly Chart */}
            <WeeklyChart data={mockWeeklyData} />
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Streak Calendar */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-card p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg gradient-bg-accent">
                  <Flame className="w-5 h-5 text-accent-foreground" />
                </div>
                <div>
                  <h2 className="font-semibold">Streak Calendar</h2>
                  <p className="text-sm text-muted-foreground">Last 30 days</p>
                </div>
              </div>
              <StreakCalendar activeDays={mockActiveDays} />
              <div className="mt-4 p-3 rounded-lg bg-accent/10 border border-accent/30">
                <p className="text-sm text-center">
                  🔥 <span className="font-semibold">{user.streak} day streak!</span> Keep it going!
                </p>
              </div>
            </motion.div>

            {/* Difficult Terms */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-warning/20">
                  <Target className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <h2 className="font-semibold">Terms to Review</h2>
                  <p className="text-sm text-muted-foreground">Practice makes perfect</p>
                </div>
              </div>
              <DifficultTerms
                terms={mockDifficultTerms}
                onPractice={(id) => navigate(`/games?term=${id}`)}
              />
            </motion.div>

            {/* Badges */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="glass-card p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg gradient-bg-primary">
                    <Trophy className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <h2 className="font-semibold">Achievements</h2>
                </div>
                <Button variant="ghost" size="sm" className="text-primary">
                  View All
                </Button>
              </div>
              <BadgeGrid badges={mockBadges} />
            </motion.div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
