import { useHousehold } from "@/hooks/useHousehold";
import { ChevronDown } from "lucide-react";

export default function HouseholdSelector() {
  const { households, activeHousehold, setActiveHouseholdId } = useHousehold();

  if (households.length <= 1) return null;

  return (
    <div className="relative inline-block">
      <select
        value={activeHousehold?.id ?? ""}
        onChange={(e) => setActiveHouseholdId(e.target.value)}
        className="appearance-none bg-muted/50 border border-border rounded-lg pl-3 pr-8 py-1.5 text-sm font-medium text-foreground cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring/20"
      >
        {households.map((h) => (
          <option key={h.id} value={h.id}>{h.name}</option>
        ))}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
    </div>
  );
}
