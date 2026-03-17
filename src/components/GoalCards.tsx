import { motion } from "framer-motion";

interface Goal {
  id: string;
  name: string;
  emoji: string;
  current: number;
  target: number;
  deadline: string;
  monthlySuggestion: number;
}

const mockGoals: Goal[] = [
  { id: "1", name: "Reserva de Emergência", emoji: "🛡️", current: 8500, target: 15000, deadline: "Dez 2026", monthlySuggestion: 650 },
  { id: "2", name: "Viagem Europa", emoji: "✈️", current: 3200, target: 12000, deadline: "Jul 2027", monthlySuggestion: 550 },
  { id: "3", name: "MacBook Pro", emoji: "💻", current: 5800, target: 8000, deadline: "Jun 2026", monthlySuggestion: 733 },
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export default function GoalCards({ compact }: { compact?: boolean }) {
  return (
    <div className={compact ? "space-y-3" : "grid gap-4 md:grid-cols-2 xl:grid-cols-3"}>
      {mockGoals.map((goal, i) => {
        const pct = Math.round((goal.current / goal.target) * 100);
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
                    <p className="text-xs text-muted-foreground">Meta: {goal.deadline}</p>
                  </div>
                </div>
                <div className="flex items-end justify-between mb-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Acumulado</p>
                    <p className="text-lg font-display font-bold text-foreground">{formatCurrency(goal.current)}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">de {formatCurrency(goal.target)}</p>
                </div>
                <div className="progress-goal mb-3">
                  <div className="progress-goal-fill" style={{ width: `${pct}%` }} />
                </div>
                <p className="text-xs text-muted-foreground">
                  💡 Sugestão: <span className="font-semibold text-accent">{formatCurrency(goal.monthlySuggestion)}/mês</span>
                </p>
              </>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
