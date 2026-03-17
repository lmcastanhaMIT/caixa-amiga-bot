import { Wallet, TrendingUp, TrendingDown, Target } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import StatCard from "@/components/StatCard";
import TransactionList from "@/components/TransactionList";
import GoalCards from "@/components/GoalCards";
import SpendingChart from "@/components/SpendingChart";

export default function Dashboard() {
  return (
    <AppLayout>
      <div className="px-4 lg:px-8 py-6 lg:py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1 font-body">
            Março 2026 · Visão geral das suas finanças
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-8">
          <StatCard
            title="Saldo Atual"
            value="R$ 12.350"
            subtitle="Atualizado agora"
            icon={Wallet}
            variant="default"
          />
          <StatCard
            title="Entradas"
            value="R$ 6.200"
            icon={TrendingUp}
            variant="income"
            trend={{ value: "12%", positive: true }}
          />
          <StatCard
            title="Saídas"
            value="R$ 3.515"
            icon={TrendingDown}
            variant="expense"
            trend={{ value: "8%", positive: false }}
          />
          <StatCard
            title="Metas"
            value="3 ativas"
            subtitle="52% progresso médio"
            icon={Target}
            variant="goal"
          />
        </div>

        {/* Main Grid: 3 columns */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent Transactions */}
          <div className="lg:col-span-1 card-stat">
            <h2 className="font-display font-semibold text-foreground mb-4">
              Transações Recentes
            </h2>
            <TransactionList limit={5} />
          </div>

          {/* Spending Breakdown */}
          <div className="lg:col-span-1 card-stat">
            <h2 className="font-display font-semibold text-foreground mb-4">
              Gastos por Categoria
            </h2>
            <SpendingChart />
          </div>

          {/* Goals Progress */}
          <div className="lg:col-span-1 card-stat">
            <h2 className="font-display font-semibold text-foreground mb-4">
              Progresso das Metas
            </h2>
            <GoalCards compact />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
