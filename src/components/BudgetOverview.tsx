import { motion } from "framer-motion";

interface BudgetCategory {
  id: string;
  name: string;
  emoji: string;
  spent: number;
  limit: number;
}

const mockBudgets: BudgetCategory[] = [
  { id: "1", name: "Alimentação", emoji: "🛒", spent: 850, limit: 1200 },
  { id: "2", name: "Transporte", emoji: "🚗", spent: 340, limit: 400 },
  { id: "3", name: "Moradia", emoji: "🏠", spent: 1800, limit: 1800 },
  { id: "4", name: "Saúde", emoji: "💊", spent: 89, limit: 300 },
  { id: "5", name: "Lazer", emoji: "🎮", spent: 280, limit: 350 },
  { id: "6", name: "Assinaturas", emoji: "📺", spent: 155, limit: 200 },
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export default function BudgetOverview() {
  return (
    <div className="space-y-4">
      {mockBudgets.map((cat, i) => {
        const pct = Math.round((cat.spent / cat.limit) * 100);
        const isOver = pct >= 100;
        const isWarning = pct >= 80 && pct < 100;

        return (
          <motion.div
            key={cat.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.15, delay: i * 0.03 }}
            className="space-y-2"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span>{cat.emoji}</span>
                <span className="text-sm font-medium text-foreground">{cat.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-semibold tabular-nums ${
                  isOver ? "text-destructive" : isWarning ? "text-warning" : "text-foreground"
                }`}>
                  {formatCurrency(cat.spent)}
                </span>
                <span className="text-xs text-muted-foreground">/ {formatCurrency(cat.limit)}</span>
              </div>
            </div>
            <div className="progress-budget">
              <div 
                className={`progress-budget-fill ${
                  isOver ? "bg-destructive" : isWarning ? "bg-warning" : "bg-primary"
                }`} 
                style={{ width: `${Math.min(pct, 100)}%` }} 
              />
            </div>
            {isOver && (
              <p className="text-xs text-destructive">
                🔴 Orçamento estourado! Excesso de {formatCurrency(cat.spent - cat.limit)}
              </p>
            )}
            {isWarning && (
              <p className="text-xs text-warning">
                ⚠️ {100 - pct}% restante — {formatCurrency(cat.limit - cat.spent)} disponível
              </p>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
