import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  Flame, Clock, BookOpen, Trophy, Upload, Gamepad2,
  ArrowRight, Target
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/layout/AppLayout";
import { ProgressRing } from "@/components/ui/progress-ring";
import { StreakCalendar } from "@/components/ui/streak-calendar";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { CourseCard } from "@/components/dashboard/CourseCard";
import { BadgeGrid } from "@/components/dashboard/BadgeGrid";
import { DifficultTerms } from "@/components/dashboard/DifficultTerms";
import { WeeklyChart } from "@/components/dashboard/WeeklyChart";
import { useDashboardData } from "@/hooks/useDashboardData";

export default function Dashboard() {
  const navigate = useNavigate();
  const { isLoading, user, courses, badges, difficultTerms, activeDays, weeklyData } = useDashboardData();

  const totalSections = courses.reduce((acc, c) => acc + c.totalSections, 0);
  const completedSections = courses.reduce((acc, c) => acc + c.sectionsCompleted, 0);
  const overallProgress = totalSections > 0 ? Math.round((completedSections / totalSections) * 100) : 0;
  const totalMinutes = weeklyData.reduce((acc, d) => acc + d.minutes, 0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <AppLayout user={user}>
      <div className="container mx-auto px-4 py-6 sm:py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 sm:mb-8"
        >
          <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold mb-2">
            Welcome back, <span className="gradient-text-primary">{user.name}</span>!
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            {courses.length === 0
              ? "Upload your first document to get started!"
              : "You're doing great! Keep up the momentum."}
          </p>
        </motion.div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <StatsCard title="Current Streak" value={`${user.streak} days`} icon={Flame} delay={0} />
          <StatsCard
            title="Weekly Study Time"
            value={totalMinutes > 0 ? `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m` : "0m"}
            icon={Clock}
            delay={0.1}
          />
          <StatsCard
            title="Courses Active"
            value={courses.length}
            subtitle={`${courses.filter(c => c.sectionsCompleted === c.totalSections && c.totalSections > 0).length} completed`}
            icon={BookOpen}
            delay={0.2}
          />
          <StatsCard
            title="Badges Earned"
            value={badges.filter(b => b.isEarned).length}
            subtitle={`of ${badges.length} total`}
            icon={Trophy}
            delay={0.3}
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6 sm:space-y-8">
            {/* Progress Overview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card p-4 sm:p-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                <div>
                  <h2 className="font-semibold text-base sm:text-lg mb-1">Overall Progress</h2>
                  <p className="text-sm text-muted-foreground">
                    {courses.length === 0
                      ? "No documents uploaded yet"
                      : `${completedSections}/${totalSections} sections completed`}
                  </p>
                </div>
                <ProgressRing progress={overallProgress} size={80}>
                  <span className="text-lg font-bold gradient-text-primary">{overallProgress}%</span>
                </ProgressRing>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Button onClick={() => navigate("/learn")} className="h-11 sm:h-12 gradient-bg-primary text-primary-foreground glow-primary">
                  <ArrowRight className="w-4 h-4 mr-2" />Continue Learning
                </Button>
                <Button onClick={() => navigate("/upload")} variant="outline" className="h-11 sm:h-12 border-primary/50 hover:bg-primary/10">
                  <Upload className="w-4 h-4 mr-2" />Upload Material
                </Button>
                <Button onClick={() => navigate("/games")} variant="outline" className="h-11 sm:h-12 border-accent/50 hover:bg-accent/10">
                  <Gamepad2 className="w-4 h-4 mr-2" />Play Games
                </Button>
              </div>
            </motion.div>

            {/* Courses */}
            {courses.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-base sm:text-lg">Your Courses</h2>
                </div>
                <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
                  {courses.map((course, index) => (
                    <CourseCard key={course.id} {...course} onClick={() => navigate(`/learn/${course.id}`)} delay={index * 0.1} />
                  ))}
                </div>
              </motion.div>
            )}

            {/* Weekly Chart */}
            <WeeklyChart data={weeklyData} />
          </div>

          {/* Right Column */}
          <div className="space-y-6 sm:space-y-8">
            {/* Streak Calendar */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="glass-card p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg gradient-bg-accent">
                  <Flame className="w-5 h-5 text-accent-foreground" />
                </div>
                <div>
                  <h2 className="font-semibold text-sm sm:text-base">Streak Calendar</h2>
                  <p className="text-xs sm:text-sm text-muted-foreground">Last 30 days</p>
                </div>
              </div>
              <StreakCalendar activeDays={activeDays} />
              <div className="mt-4 p-3 rounded-lg bg-accent/10 border border-accent/30">
                <p className="text-sm text-center flex items-center justify-center gap-2">
                  <Flame className="w-4 h-4 text-warning" />
                  <span><span className="font-semibold">{user.streak} day streak!</span> Keep it going!</span>
                </p>
              </div>
            </motion.div>

            {/* Difficult Terms */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-warning/20">
                  <Target className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <h2 className="font-semibold text-sm sm:text-base">Terms to Review</h2>
                  <p className="text-xs sm:text-sm text-muted-foreground">Practice makes perfect</p>
                </div>
              </div>
              <DifficultTerms terms={difficultTerms} onPractice={(id) => navigate(`/games?term=${id}`)} />
            </motion.div>

            {/* Badges */}
            {badges.length > 0 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }} className="glass-card p-4 sm:p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg gradient-bg-primary">
                    <Trophy className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <h2 className="font-semibold text-sm sm:text-base">Achievements</h2>
                </div>
                <BadgeGrid badges={badges} />
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
