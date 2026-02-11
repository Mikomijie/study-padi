import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

export interface DashboardCourse {
  id: string;
  title: string;
  sectionsCompleted: number;
  totalSections: number;
  lastAccessed: string;
}

export interface DashboardBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  isEarned: boolean;
  earnedAt?: string;
}

export interface DashboardTerm {
  id: string;
  term: string;
  definition: string;
  reviewCount: number;
}

export interface DashboardUser {
  name: string;
  avatar: string;
  streak: number;
}

export function useDashboardData() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<DashboardUser>({ name: "", avatar: "", streak: 0 });
  const [courses, setCourses] = useState<DashboardCourse[]>([]);
  const [badges, setBadges] = useState<DashboardBadge[]>([]);
  const [difficultTerms, setDifficultTerms] = useState<DashboardTerm[]>([]);
  const [activeDays, setActiveDays] = useState<string[]>([]);
  const [weeklyData, setWeeklyData] = useState<{ day: string; minutes: number }[]>([]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth?mode=login");
        return;
      }

      const userId = session.user.id;

      // Fetch all data in parallel
      const [
        profileRes,
        docsRes,
        sectionsRes,
        progressRes,
        allBadgesRes,
        userBadgesRes,
        termsRes,
      ] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", userId).single(),
        supabase.from("documents").select("*").eq("user_id", userId),
        supabase.from("sections").select("id, document_id, completed"),
        supabase.from("learning_progress").select("*").eq("user_id", userId),
        supabase.from("badges").select("*"),
        supabase.from("user_badges").select("*").eq("user_id", userId),
        supabase.from("difficult_terms").select("*").eq("user_id", userId).order("difficulty_count", { ascending: false }).limit(5),
      ]);

      if (cancelled) return;

      // User profile
      const profile = profileRes.data;
      const displayName = profile?.display_name || session.user.user_metadata?.display_name || session.user.email?.split("@")[0] || "Learner";
      setUser({
        name: displayName,
        avatar: profile?.avatar_url || session.user.user_metadata?.avatar_url || "",
        streak: profile?.streak_count || 0,
      });

      // Courses from documents + sections
      const docs = docsRes.data || [];
      const sections = sectionsRes.data || [];
      const progressList = progressRes.data || [];

      const courseList: DashboardCourse[] = docs.map((doc) => {
        const docSections = sections.filter((s) => s.document_id === doc.id);
        const completed = docSections.filter((s) => s.completed).length;
        const prog = progressList.find((p) => p.document_id === doc.id);
        const lastAccessed = prog
          ? getTimeAgo(new Date(prog.last_accessed_at))
          : "Not started";
        return {
          id: doc.id,
          title: doc.title,
          sectionsCompleted: completed,
          totalSections: docSections.length,
          lastAccessed,
        };
      });
      setCourses(courseList);

      // Badges
      const allBadges = allBadgesRes.data || [];
      const earnedIds = new Map(
        (userBadgesRes.data || []).map((ub) => [ub.badge_id, ub.earned_at])
      );
      const badgeList: DashboardBadge[] = allBadges.map((b) => ({
        id: b.id,
        name: b.name,
        description: b.description,
        icon: b.icon,
        isEarned: earnedIds.has(b.id),
        earnedAt: earnedIds.get(b.id) || undefined,
      }));
      // Sort: earned first
      badgeList.sort((a, b) => (a.isEarned === b.isEarned ? 0 : a.isEarned ? -1 : 1));
      setBadges(badgeList);

      // Difficult terms
      setDifficultTerms(
        (termsRes.data || []).map((t) => ({
          id: t.id,
          term: t.term,
          definition: t.definition,
          reviewCount: t.difficulty_count,
        }))
      );

      // Active days from profile last_active_date and learning_progress
      const daySet = new Set<string>();
      if (profile?.last_active_date) daySet.add(profile.last_active_date);
      progressList.forEach((p) => {
        const d = new Date(p.last_accessed_at).toISOString().split("T")[0];
        daySet.add(d);
      });
      setActiveDays(Array.from(daySet));

      // Weekly data placeholder (no study_sessions table yet, show empty)
      const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      setWeeklyData(days.map((day) => ({ day, minutes: 0 })));

      setIsLoading(false);
    };

    load();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) navigate("/auth?mode=login");
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [navigate]);

  return { isLoading, user, courses, badges, difficultTerms, activeDays, weeklyData };
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Yesterday";
  return `${diffDays} days ago`;
}
