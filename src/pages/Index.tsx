import { Wallet, TrendingUp, TrendingDown, Target } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import StatCard from "@/components/StatCard";
import TransactionList from "@/components/TransactionList";
import GoalCards from "@/components/GoalCards";
import SpendingChart from "@/components/SpendingChart";
import { useMonthlyStats, useGoals } from "@/hooks/useFinanceData";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export default function Dashboard() {
  const { data: stats } = useMonthlyStats();
  const { data: goals } = useGoals();

  const avgProgress = goals?.length
    ? Math.round(goals.reduce((s, g) => s + (Number(g.current_amount) / Number(g.target_amount)) * 100, 0) / goals.length)
    : 0;

  return (
    <AppLayout>
      <div className="px-4 lg:px-8 py-6 lg:py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1 font-body">
            {new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" })} · Visão geral
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-8">
          <StatCard title="Saldo do Mês" value={formatCurrency(stats?.balance ?? 0)} subtitle="Receitas - Despesas" icon={Wallet} />
          <StatCard title="Entradas" value={formatCurrency(stats?.income ?? 0)} icon={TrendingUp} variant="income" />
          <StatCard title="Saídas" value={formatCurrency(stats?.expense ?? 0)} icon={TrendingDown} variant="expense" />
          <StatCard title="Metas" value={`${goals?.length ?? 0} ativa${(goals?.length ?? 0) !== 1 ? "s" : ""}`} subtitle={`${avgProgress}% progresso médio`} icon={Target} variant="goal" />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 card-stat">
            <h2 className="font-display font-semibold text-foreground mb-4">Transações Recentes</h2>
            <TransactionList limit={5} />
          </div>
          <div className="lg:col-span-1 card-stat">
            <h2 className="font-display font-semibold text-foreground mb-4">Gastos por Categoria</h2>
            <SpendingChart />
          </div>
          <div className="lg:col-span-1 card-stat">
            <h2 className="font-display font-semibold text-foreground mb-4">Progresso das Metas</h2>
            <GoalCards compact />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
