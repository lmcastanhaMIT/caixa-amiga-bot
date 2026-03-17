import AppLayout from "@/components/AppLayout";
import GoalCards from "@/components/GoalCards";
import { Plus } from "lucide-react";

export default function Metas() {
  return (
    <AppLayout>
      <div className="px-4 lg:px-8 py-6 lg:py-8 max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Metas Financeiras</h1>
            <p className="text-sm text-muted-foreground mt-1">Acompanhe e gerencie seus objetivos</p>
          </div>
          <button className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
            <Plus className="w-4 h-4" />
            Nova Meta
          </button>
        </div>

        <GoalCards />
      </div>
    </AppLayout>
  );
}
