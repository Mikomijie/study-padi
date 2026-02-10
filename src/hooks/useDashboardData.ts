import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/dashboard/BadgeGrid";
import { formatDistanceToNow } from "date-fns";

export interface DashboardCourse {
  id: string;
  title: string;
  sectionsCompleted: number;
  totalSections: number;
  lastAccessed: string;
}

export interface DashboardTerm {
  id: string;
  term: string;
  definition: string;
  reviewCount: number;
}

export interface DashboardData {
  profile: { name: string; avatar: string; streak: number } | null;
  courses: DashboardCourse[];
  badges: Badge[];
  difficultTerms: DashboardTerm[];
  activeDays: string[];
  isLoading: boolean;
}

export function useDashboardData(userId: string | null) {
  const [data, setData] = useState<DashboardData>({
    profile: null,
    courses: [],
    badges: [],
    difficultTerms: [],
    activeDays: [],
    isLoading: true,
  });

  useEffect(() => {
    if (!userId) return;

    const fetchAll = async () => {
      try {
        const [
          profileRes,
          docsRes,
          badgesRes,
          userBadgesRes,
          termsRes,
        ] = await Promise.all([
          supabase.from("profiles").select("*").eq("user_id", userId).single(),
          supabase
            .from("documents")
            .select("id, title, created_at, sections(id, completed)")
            .eq("user_id", userId)
            .order("created_at", { ascending: false }),
          supabase.from("badges").select("*"),
          supabase.from("user_badges").select("badge_id, earned_at").eq("user_id", userId),
          supabase
            .from("difficult_terms")
            .select("*")
            .eq("user_id", userId)
            .order("difficulty_count", { ascending: false })
            .limit(5),
        ]);

        // Profile
        const profile = profileRes.data
          ? {
              name: profileRes.data.display_name || "Learner",
              avatar: profileRes.data.avatar_url || "",
              streak: profileRes.data.streak_count || 0,
            }
          : { name: "Learner", avatar: "", streak: 0 };

        // Courses (documents with sections)
        const courses: DashboardCourse[] = (docsRes.data || []).map((doc: any) => {
          const sections = doc.sections || [];
          const completed = sections.filter((s: any) => s.completed).length;
          return {
            id: doc.id,
            title: doc.title,
            sectionsCompleted: completed,
            totalSections: sections.length,
            lastAccessed: formatDistanceToNow(new Date(doc.created_at), { addSuffix: true }),
          };
        });

        // Badges
        const earnedMap = new Map(
          (userBadgesRes.data || []).map((ub: any) => [ub.badge_id, ub.earned_at])
        );
        const badges: Badge[] = (badgesRes.data || []).map((b: any) => ({
          id: b.id,
          name: b.name,
          description: b.description,
          icon: b.icon,
          isEarned: earnedMap.has(b.id),
          earnedAt: earnedMap.get(b.id),
        }));

        // Difficult terms
        const difficultTerms: DashboardTerm[] = (termsRes.data || []).map((t: any) => ({
          id: t.id,
          term: t.term,
          definition: t.definition,
          reviewCount: t.difficulty_count,
        }));

        // Active days from learning_progress
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const progressRes = await supabase
          .from("learning_progress")
          .select("last_accessed_at")
          .eq("user_id", userId)
          .gte("last_accessed_at", thirtyDaysAgo.toISOString());

        const activeDaysSet = new Set<string>();
        (progressRes.data || []).forEach((p: any) => {
          activeDaysSet.add(new Date(p.last_accessed_at).toISOString().split("T")[0]);
        });
        // Also add profile last_active_date
        if (profileRes.data?.last_active_date) {
          activeDaysSet.add(profileRes.data.last_active_date);
        }

        setData({
          profile,
          courses,
          badges,
          difficultTerms,
          activeDays: Array.from(activeDaysSet),
          isLoading: false,
        });
      } catch (error) {
        console.error("Dashboard data fetch error:", error);
        setData((prev) => ({ ...prev, isLoading: false }));
      }
    };

    fetchAll();
  }, [userId]);

  return data;
}
