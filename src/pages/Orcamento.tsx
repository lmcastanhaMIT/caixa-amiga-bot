import AppLayout from "@/components/AppLayout";
import BudgetOverview from "@/components/BudgetOverview";

export default function Orcamento() {
  return (
    <AppLayout>
      <div className="px-4 lg:px-8 py-6 lg:py-8 max-w-3xl">
        <div className="mb-6">
          <h1 className="text-2xl font-display font-bold text-foreground">Orçamento</h1>
          <p className="text-sm text-muted-foreground mt-1">Controle de gastos por categoria — Março 2026</p>
        </div>

        <div className="card-stat mb-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-display font-semibold text-foreground">Total Gasto</h2>
            <div className="text-right">
              <p className="text-lg font-display font-bold text-foreground">R$ 3.514,90</p>
              <p className="text-xs text-muted-foreground">de R$ 4.250,00</p>
            </div>
          </div>
          <div className="progress-goal">
            <div className="progress-goal-fill" style={{ width: "83%" }} />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            ⚠️ 83% do orçamento utilizado — R$ 735,10 restante
          </p>
        </div>

        <div className="card-stat">
          <h2 className="font-display font-semibold text-foreground mb-4">Por Categoria</h2>
          <BudgetOverview />
        </div>
      </div>
    </AppLayout>
  );
}
