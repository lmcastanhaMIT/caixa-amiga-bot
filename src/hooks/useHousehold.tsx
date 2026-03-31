import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Household {
  id: string;
  name: string;
  owner_user_id: string;
  invite_code: string;
  created_at: string;
}

interface HouseholdMember {
  id: string;
  household_id: string;
  user_id: string;
  role: string;
  status: string;
  joined_at: string;
}

interface HouseholdContextType {
  households: Household[];
  activeHouseholdId: string | null;
  setActiveHouseholdId: (id: string) => void;
  activeHousehold: Household | null;
  members: HouseholdMember[];
  isOwner: boolean;
  isLoading: boolean;
}

const HouseholdContext = createContext<HouseholdContextType>({
  households: [],
  activeHouseholdId: null,
  setActiveHouseholdId: () => {},
  activeHousehold: null,
  members: [],
  isOwner: false,
  isLoading: true,
});

export const useHousehold = () => useContext(HouseholdContext);

export function HouseholdProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [activeHouseholdId, setActiveHouseholdIdState] = useState<string | null>(null);

  const { data: households = [], isLoading } = useQuery({
    queryKey: ["households", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("households")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as Household[];
    },
    enabled: !!user,
  });

  const { data: members = [] } = useQuery({
    queryKey: ["household-members", activeHouseholdId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("household_members")
        .select("*")
        .eq("household_id", activeHouseholdId!)
        .eq("status", "active");
      if (error) throw error;
      return data as HouseholdMember[];
    },
    enabled: !!activeHouseholdId,
  });

  // Auto-select first household or restore from localStorage
  useEffect(() => {
    if (households.length === 0) return;
    const stored = localStorage.getItem(`active_household_${user?.id}`);
    const valid = stored && households.some((h) => h.id === stored);
    const id = valid ? stored! : households[0].id;
    setActiveHouseholdIdState(id);
  }, [households, user?.id]);

  const setActiveHouseholdId = (id: string) => {
    setActiveHouseholdIdState(id);
    if (user?.id) localStorage.setItem(`active_household_${user.id}`, id);
  };

  const activeHousehold = households.find((h) => h.id === activeHouseholdId) ?? null;
  const isOwner = activeHousehold?.owner_user_id === user?.id;

  return (
    <HouseholdContext.Provider
      value={{ households, activeHouseholdId, setActiveHouseholdId, activeHousehold, members, isOwner, isLoading }}
    >
      {children}
    </HouseholdContext.Provider>
  );
}
