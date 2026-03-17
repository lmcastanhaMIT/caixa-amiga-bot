import { motion } from "framer-motion";
import { useGoals } from "@/hooks/useFinanceData";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export default function GoalCards({ compact }: { compact?: boolean }) {
  const { data: goals, isLoading } = useGoals();

  if (isLoading) {
    return <div className="animate-pulse space-y-3"><div className="h-20 bg-muted rounded-lg" /><div className="h-20 bg-muted rounded-lg" /></div>;
  }

  if (!goals?.length) {
    return (
      <div className="py-6 text-center">
        <p className="text-sm text-muted-foreground">Nenhuma meta criada.</p>
        <p className="text-xs text-muted-foreground mt-1">Use o chat: "criar meta de 15000 para reserva"</p>
      </div>
    );
  }

  return (
    <div className={compact ? "space-y-3" : "grid gap-4 md:grid-cols-2 xl:grid-cols-3"}>
      {goals.map((goal, i) => {
        const pct = Math.round((Number(goal.current_amount) / Number(goal.target_amount)) * 100);
        const remaining = Number(goal.target_amount) - Number(goal.current_amount);
        let monthlySuggestion = 0;
        if (goal.deadline) {
          const months = Math.max(1, Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / (30 * 24 * 60 * 60 * 1000)));
          monthlySuggestion = remaining / months;
        }

        return (
          <motion.div
            key={goal.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: i * 0.05 }}
            className={compact ? "flex items-center gap-3" : "card-stat"}
          >
            {compact ? (
              <>
                <span className="text-lg">{goal.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-foreground truncate">{goal.name}</span>
                    <span className="text-xs font-semibold text-accent tabular-nums">{pct}%</span>
                  </div>
                  <div className="progress-goal">
                    <div className="progress-goal-fill" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2.5 mb-4">
                  <span className="text-2xl">{goal.emoji}</span>
                  <div>
                    <h3 className="font-display font-semibold text-foreground">{goal.name}</h3>
                    {goal.deadline && <p className="text-xs text-muted-foreground">Meta: {new Date(goal.deadline).toLocaleDateString("pt-BR", { month: "short", year: "numeric" })}</p>}
                  </div>
                </div>
                <div className="flex items-end justify-between mb-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Acumulado</p>
                    <p className="text-lg font-display font-bold text-foreground">{formatCurrency(Number(goal.current_amount))}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">de {formatCurrency(Number(goal.target_amount))}</p>
                </div>
                <div className="progress-goal mb-3">
                  <div className="progress-goal-fill" style={{ width: `${pct}%` }} />
                </div>
                {monthlySuggestion > 0 && (
                  <p className="text-xs text-muted-foreground">
                    💡 Sugestão: <span className="font-semibold text-accent">{formatCurrency(monthlySuggestion)}/mês</span>
                  </p>
                )}
              </>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
