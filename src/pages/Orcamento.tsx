import AppLayout from "@/components/AppLayout";
import BudgetOverview from "@/components/BudgetOverview";
import { useBudgets, useMonthlyStats } from "@/hooks/useFinanceData";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export default function Orcamento() {
  const { data: budgets } = useBudgets();
  const { data: stats } = useMonthlyStats();

  const totalLimit = budgets?.reduce((s, b) => s + Number(b.monthly_limit), 0) || 0;
  const totalSpent = budgets?.reduce((s, b) => s + (stats?.categories?.[b.category] || 0), 0) || 0;
  const pct = totalLimit > 0 ? Math.round((totalSpent / totalLimit) * 100) : 0;

  return (
    <AppLayout>
      <div className="px-4 lg:px-8 py-6 lg:py-8 max-w-3xl">
        <div className="mb-6">
          <h1 className="text-2xl font-display font-bold text-foreground">Orçamento</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Controle de gastos por categoria — {new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
          </p>
        </div>

        {totalLimit > 0 && (
          <div className="card-stat mb-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-display font-semibold text-foreground">Total Gasto</h2>
              <div className="text-right">
                <p className="text-lg font-display font-bold text-foreground">{formatCurrency(totalSpent)}</p>
                <p className="text-xs text-muted-foreground">de {formatCurrency(totalLimit)}</p>
              </div>
            </div>
            <div className="progress-goal">
              <div className={`progress-goal-fill ${pct >= 100 ? "!bg-destructive" : pct >= 80 ? "!bg-warning" : ""}`} style={{ width: `${Math.min(pct, 100)}%` }} />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {pct >= 100 ? "🔴" : pct >= 80 ? "⚠️" : "✅"} {pct}% do orçamento utilizado — {formatCurrency(Math.max(0, totalLimit - totalSpent))} restante
            </p>
          </div>
        )}

        <div className="card-stat">
          <h2 className="font-display font-semibold text-foreground mb-4">Por Categoria</h2>
          <BudgetOverview />
        </div>
      </div>
    </AppLayout>
  );
}
