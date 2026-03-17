import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import TransactionList from "@/components/TransactionList";
import { Search, Filter } from "lucide-react";

const CATEGORIES = ["all", "Alimentação", "Transporte", "Moradia", "Saúde", "Educação", "Lazer", "Assinaturas", "Renda", "Renda Extra", "Outros"];
const PERIODS = [
  { value: "all", label: "Todos" },
  { value: "7d", label: "7 dias" },
  { value: "30d", label: "30 dias" },
  { value: "90d", label: "90 dias" },
];

export default function Transacoes() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [period, setPeriod] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  return (
    <AppLayout>
      <div className="px-4 lg:px-8 py-6 lg:py-8 max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Transações</h1>
            <p className="text-sm text-muted-foreground mt-1">Todas as movimentações financeiras</p>
          </div>
        </div>

        {/* Search + Filter Toggle */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar transações..."
              className="w-full bg-muted rounded-lg pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring/20 font-body"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 border border-border rounded-lg text-sm transition-colors ${showFilters ? "bg-primary text-primary-foreground border-primary" : "text-muted-foreground hover:bg-muted"}`}
          >
            <Filter className="w-4 h-4" />
            Filtrar
          </button>
        </div>

        {/* Filter Controls */}
        {showFilters && (
          <div className="flex flex-wrap gap-3 mb-4 p-4 bg-muted/50 rounded-lg border border-border/50">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Período</label>
              <select value={period} onChange={e => setPeriod(e.target.value)}
                className="bg-card rounded-lg px-3 py-2 text-sm text-foreground border border-border outline-none focus:ring-2 focus:ring-ring/20 font-body">
                {PERIODS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Categoria</label>
              <select value={category} onChange={e => setCategory(e.target.value)}
                className="bg-card rounded-lg px-3 py-2 text-sm text-foreground border border-border outline-none focus:ring-2 focus:ring-ring/20 font-body">
                {CATEGORIES.map(c => <option key={c} value={c}>{c === "all" ? "Todas" : c}</option>)}
              </select>
            </div>
          </div>
        )}

        <div className="card-stat">
          <TransactionList filterCategory={category} filterPeriod={period} searchQuery={search} />
        </div>
      </div>
    </AppLayout>
  );
}
