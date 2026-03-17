import { motion } from "framer-motion";
import { useBudgets, useMonthlyStats } from "@/hooks/useFinanceData";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

const categoryEmoji: Record<string, string> = {
  "Alimentação": "🛒", "Transporte": "🚗", "Moradia": "🏠", "Saúde": "💊",
  "Lazer": "🎮", "Assinaturas": "📺", "Educação": "📚", "Outros": "📦",
};

export default function BudgetOverview() {
  const { data: budgets, isLoading: loadingBudgets } = useBudgets();
  const { data: stats } = useMonthlyStats();

  if (loadingBudgets) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="space-y-2 animate-pulse">
            <div className="flex justify-between"><div className="h-4 bg-muted rounded w-24" /><div className="h-4 bg-muted rounded w-32" /></div>
            <div className="h-1.5 bg-muted rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  if (!budgets?.length) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-muted-foreground">Nenhum orçamento definido.</p>
        <p className="text-xs text-muted-foreground mt-1">Use o chat: "definir orçamento de 1200 para alimentação"</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {budgets.map((b, i) => {
        const spent = stats?.categories?.[b.category] || 0;
        const pct = Math.round((spent / Number(b.monthly_limit)) * 100);
        const isOver = pct >= 100;
        const isWarning = pct >= 80 && pct < 100;
        const emoji = categoryEmoji[b.category] || "📦";

        return (
          <motion.div
            key={b.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.15, delay: i * 0.03 }}
            className="space-y-2"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span>{emoji}</span>
                <span className="text-sm font-medium text-foreground">{b.category}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-semibold tabular-nums ${isOver ? "text-destructive" : isWarning ? "text-warning" : "text-foreground"}`}>
                  {formatCurrency(spent)}
                </span>
                <span className="text-xs text-muted-foreground">/ {formatCurrency(Number(b.monthly_limit))}</span>
              </div>
            </div>
            <div className="progress-budget">
              <div className={`progress-budget-fill ${isOver ? "bg-destructive" : isWarning ? "bg-warning" : "bg-primary"}`} style={{ width: `${Math.min(pct, 100)}%` }} />
            </div>
            {isOver && <p className="text-xs text-destructive">🔴 Orçamento estourado! Excesso de {formatCurrency(spent - Number(b.monthly_limit))}</p>}
            {isWarning && <p className="text-xs text-warning">⚠️ {100 - pct}% restante — {formatCurrency(Number(b.monthly_limit) - spent)} disponível</p>}
          </motion.div>
        );
      })}
    </div>
  );
}
