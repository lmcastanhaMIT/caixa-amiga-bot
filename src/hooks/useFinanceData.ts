import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useHousehold } from "@/hooks/useHousehold";

export function useTransactions(limit?: number) {
  const { user } = useAuth();
  const { activeHouseholdId } = useHousehold();
  return useQuery({
    queryKey: ["transactions", user?.id, activeHouseholdId, limit],
    queryFn: async () => {
      let q = supabase
        .from("transactions")
        .select("*")
        .order("date", { ascending: false });
      if (activeHouseholdId) q = q.eq("household_id", activeHouseholdId);
      if (limit) q = q.limit(limit);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useMonthlyStats() {
  const { user } = useAuth();
  const { activeHouseholdId } = useHousehold();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

  return useQuery({
    queryKey: ["monthly-stats", user?.id, activeHouseholdId, monthStart],
    queryFn: async () => {
      let q = supabase
        .from("transactions")
        .select("amount, type, category")
        .gte("date", monthStart)
        .lte("date", monthEnd);
      if (activeHouseholdId) q = q.eq("household_id", activeHouseholdId);
      const { data, error } = await q;
      if (error) throw error;

      let income = 0, expense = 0;
      const categories: Record<string, number> = {};
      for (const t of data || []) {
        if (t.type === "income") income += Number(t.amount);
        else {
          expense += Number(t.amount);
          categories[t.category] = (categories[t.category] || 0) + Number(t.amount);
        }
      }
      return { income, expense, balance: income - expense, categories };
    },
    enabled: !!user,
  });
}

export function useGoals() {
  const { user } = useAuth();
  const { activeHouseholdId } = useHousehold();
  return useQuery({
    queryKey: ["goals", user?.id, activeHouseholdId],
    queryFn: async () => {
      let q = supabase
        .from("goals")
        .select("*")
        .order("created_at", { ascending: false });
      if (activeHouseholdId) q = q.eq("household_id", activeHouseholdId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useBudgets() {
  const { user } = useAuth();
  const { activeHouseholdId } = useHousehold();
  const now = new Date();
  const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  return useQuery({
    queryKey: ["budgets", user?.id, activeHouseholdId, monthYear],
    queryFn: async () => {
      let q = supabase
        .from("budgets")
        .select("*")
        .eq("month_year", monthYear);
      if (activeHouseholdId) q = q.eq("household_id", activeHouseholdId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}
