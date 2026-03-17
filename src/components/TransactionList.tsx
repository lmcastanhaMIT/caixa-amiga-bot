import { motion } from "framer-motion";
import { useTransactions } from "@/hooks/useFinanceData";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

const categoryEmoji: Record<string, string> = {
  "Alimentação": "🛒", "Transporte": "🚗", "Moradia": "🏠", "Saúde": "💊",
  "Lazer": "🎮", "Assinaturas": "📺", "Renda": "💰", "Renda Extra": "💻", "Outros": "📦",
};

export default function TransactionList({ limit }: { limit?: number }) {
  const { data: transactions, isLoading } = useTransactions(limit);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-center gap-3 px-3 py-3 animate-pulse">
            <div className="w-8 h-8 bg-muted rounded-full" />
            <div className="flex-1 space-y-1">
              <div className="h-4 bg-muted rounded w-2/3" />
              <div className="h-3 bg-muted rounded w-1/3" />
            </div>
            <div className="h-4 bg-muted rounded w-16" />
          </div>
        ))}
      </div>
    );
  }

  if (!transactions?.length) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-muted-foreground">Nenhuma transação ainda.</p>
        <p className="text-xs text-muted-foreground mt-1">Use o chat para registrar: "gastei 50 no almoço"</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {transactions.map((tx, i) => {
        const emoji = categoryEmoji[tx.category] || "📦";
        const dateStr = new Date(tx.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
        return (
          <motion.div
            key={tx.id}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15, delay: i * 0.03 }}
            className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <span className="text-lg w-8 text-center">{emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{tx.description || tx.category}</p>
              <p className="text-xs text-muted-foreground">{tx.category} · {dateStr}</p>
            </div>
            <span className={`text-sm font-semibold font-display tabular-nums ${
              tx.type === "income" ? "text-income" : "text-expense"
            }`}>
              {tx.type === "income" ? "+" : "-"}{formatCurrency(Number(tx.amount))}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}
