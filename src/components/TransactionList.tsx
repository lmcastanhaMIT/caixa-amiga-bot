import { useState } from "react";
import { motion } from "framer-motion";
import { Pencil, Trash2, X, Check } from "lucide-react";
import { useTransactions } from "@/hooks/useFinanceData";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

const categoryEmoji: Record<string, string> = {
  "Alimentação": "🛒", "Transporte": "🚗", "Moradia": "🏠", "Saúde": "💊",
  "Lazer": "🎮", "Assinaturas": "📺", "Renda": "💰", "Renda Extra": "💻",
  "Educação": "📚", "Outros": "📦",
};

const CATEGORIES = ["Alimentação", "Transporte", "Moradia", "Saúde", "Educação", "Lazer", "Assinaturas", "Renda", "Renda Extra", "Outros"];

interface TransactionListProps {
  limit?: number;
  filterCategory?: string;
  filterPeriod?: string;
  searchQuery?: string;
}

export default function TransactionList({ limit, filterCategory, filterPeriod, searchQuery }: TransactionListProps) {
  const { data: transactions, isLoading } = useTransactions(limit);
  const queryClient = useQueryClient();
  const [editTx, setEditTx] = useState<any>(null);
  const [deleteTx, setDeleteTx] = useState<any>(null);
  const [editForm, setEditForm] = useState({ amount: "", description: "", category: "", type: "" });

  const filtered = transactions?.filter(tx => {
    if (filterCategory && filterCategory !== "all" && tx.category !== filterCategory) return false;
    if (searchQuery && !tx.description?.toLowerCase().includes(searchQuery.toLowerCase()) && !tx.category.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filterPeriod && filterPeriod !== "all") {
      const txDate = new Date(tx.date);
      const now = new Date();
      if (filterPeriod === "7d") {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        if (txDate < weekAgo) return false;
      } else if (filterPeriod === "30d") {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        if (txDate < monthAgo) return false;
      } else if (filterPeriod === "90d") {
        const qAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        if (txDate < qAgo) return false;
      }
    }
    return true;
  });

  const openEdit = (tx: any) => {
    setEditTx(tx);
    setEditForm({ amount: String(tx.amount), description: tx.description, category: tx.category, type: tx.type });
  };

  const saveEdit = async () => {
    if (!editTx) return;
    const { error } = await supabase.from("transactions").update({
      amount: Number(editForm.amount),
      description: editForm.description,
      category: editForm.category,
      type: editForm.type as "income" | "expense",
    }).eq("id", editTx.id);
    if (error) { toast.error("Erro ao editar transação"); return; }
    toast.success("Transação atualizada!");
    setEditTx(null);
    queryClient.invalidateQueries({ queryKey: ["transactions"] });
    queryClient.invalidateQueries({ queryKey: ["monthly-stats"] });
  };

  const confirmDelete = async () => {
    if (!deleteTx) return;
    const { error } = await supabase.from("transactions").delete().eq("id", deleteTx.id);
    if (error) { toast.error("Erro ao excluir transação"); return; }
    toast.success("Transação excluída!");
    setDeleteTx(null);
    queryClient.invalidateQueries({ queryKey: ["transactions"] });
    queryClient.invalidateQueries({ queryKey: ["monthly-stats"] });
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-center gap-3 px-3 py-3 animate-pulse">
            <div className="w-8 h-8 bg-muted rounded-full" />
            <div className="flex-1 space-y-1"><div className="h-4 bg-muted rounded w-2/3" /><div className="h-3 bg-muted rounded w-1/3" /></div>
            <div className="h-4 bg-muted rounded w-16" />
          </div>
        ))}
      </div>
    );
  }

  if (!filtered?.length) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-muted-foreground">Nenhuma transação encontrada.</p>
        <p className="text-xs text-muted-foreground mt-1">Use o chat para registrar: "gastei 50 no almoço"</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-1">
        {filtered.map((tx, i) => {
          const emoji = categoryEmoji[tx.category] || "📦";
          const dateStr = new Date(tx.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
          return (
            <motion.div
              key={tx.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15, delay: i * 0.03 }}
              className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-muted/50 transition-colors group"
            >
              <span className="text-lg w-8 text-center">{emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{tx.description || tx.category}</p>
                <p className="text-xs text-muted-foreground">{tx.category} · {dateStr}</p>
              </div>
              <span className={`text-sm font-semibold font-display tabular-nums ${tx.type === "income" ? "text-income" : "text-expense"}`}>
                {tx.type === "income" ? "+" : "-"}{formatCurrency(Number(tx.amount))}
              </span>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openEdit(tx)} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setDeleteTx(tx)} className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editTx} onOpenChange={() => setEditTx(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle className="font-display">Editar Transação</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Valor</label>
              <input type="number" step="0.01" value={editForm.amount} onChange={e => setEditForm(f => ({ ...f, amount: e.target.value }))}
                className="w-full bg-muted rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring/20 font-body" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Descrição</label>
              <input value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                className="w-full bg-muted rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring/20 font-body" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Categoria</label>
              <select value={editForm.category} onChange={e => setEditForm(f => ({ ...f, category: e.target.value }))}
                className="w-full bg-muted rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring/20 font-body">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Tipo</label>
              <select value={editForm.type} onChange={e => setEditForm(f => ({ ...f, type: e.target.value }))}
                className="w-full bg-muted rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring/20 font-body">
                <option value="expense">Despesa</option>
                <option value="income">Receita</option>
              </select>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setEditTx(null)} className="px-4 py-2 text-sm rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors">Cancelar</button>
              <button onClick={saveEdit} className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity">Salvar</button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTx} onOpenChange={() => setDeleteTx(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">Excluir transação?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTx && `${deleteTx.type === "income" ? "Receita" : "Despesa"} de ${formatCurrency(Number(deleteTx.amount))} — ${deleteTx.description || deleteTx.category}`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
