import AppLayout from "@/components/AppLayout";
import TransactionList from "@/components/TransactionList";
import { Search, Filter, Plus } from "lucide-react";

export default function Transacoes() {
  return (
    <AppLayout>
      <div className="px-4 lg:px-8 py-6 lg:py-8 max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Transações</h1>
            <p className="text-sm text-muted-foreground mt-1">Todas as movimentações financeiras</p>
          </div>
          <button className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
            <Plus className="w-4 h-4" />
            Nova Transação
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              placeholder="Buscar transações..."
              className="w-full bg-muted rounded-lg pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring/20 font-body"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 border border-border rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors">
            <Filter className="w-4 h-4" />
            Filtrar
          </button>
        </div>

        <div className="card-stat">
          <TransactionList />
        </div>
      </div>
    </AppLayout>
  );
}
