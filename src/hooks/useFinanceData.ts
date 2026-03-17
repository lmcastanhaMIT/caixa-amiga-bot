import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useTransactions(limit?: number) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["transactions", user?.id, limit],
    queryFn: async () => {
      let q = supabase
        .from("transactions")
        .select("*")
        .order("date", { ascending: false });
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
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

  return useQuery({
    queryKey: ["monthly-stats", user?.id, monthStart],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("amount, type, category")
        .gte("date", monthStart)
        .lte("date", monthEnd);
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
  return useQuery({
    queryKey: ["goals", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("goals")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useBudgets() {
  const { user } = useAuth();
  const now = new Date();
  const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  return useQuery({
    queryKey: ["budgets", user?.id, monthYear],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("budgets")
        .select("*")
        .eq("month_year", monthYear);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}
