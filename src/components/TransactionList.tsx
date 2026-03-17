import { motion } from "framer-motion";

interface Transaction {
  id: string;
  description: string;
  amount: number;
  category: string;
  type: "income" | "expense";
  date: string;
  emoji: string;
}

const mockTransactions: Transaction[] = [
  { id: "1", description: "Salário", amount: 5000, category: "Renda", type: "income", date: "Hoje, 08:00", emoji: "💰" },
  { id: "2", description: "Mercado Extra", amount: -320, category: "Alimentação", type: "expense", date: "Hoje, 10:30", emoji: "🛒" },
  { id: "3", description: "Uber", amount: -45, category: "Transporte", type: "expense", date: "Hoje, 12:15", emoji: "🚗" },
  { id: "4", description: "Freelance Design", amount: 1200, category: "Renda Extra", type: "income", date: "Ontem, 16:00", emoji: "💻" },
  { id: "5", description: "Netflix", amount: -55.9, category: "Assinaturas", type: "expense", date: "Ontem, 09:00", emoji: "📺" },
  { id: "6", description: "Farmácia", amount: -89, category: "Saúde", type: "expense", date: "15 Mar, 14:20", emoji: "💊" },
  { id: "7", description: "Restaurante", amount: -120, category: "Alimentação", type: "expense", date: "15 Mar, 20:00", emoji: "🍽️" },
  { id: "8", description: "Conta de Luz", amount: -210, category: "Moradia", type: "expense", date: "14 Mar, 10:00", emoji: "💡" },
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Math.abs(value));
}

export default function TransactionList({ limit }: { limit?: number }) {
  const items = limit ? mockTransactions.slice(0, limit) : mockTransactions;

  return (
    <div className="space-y-1">
      {items.map((tx, i) => (
        <motion.div
          key={tx.id}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15, delay: i * 0.03 }}
          className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-muted/50 transition-colors"
        >
          <span className="text-lg w-8 text-center">{tx.emoji}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{tx.description}</p>
            <p className="text-xs text-muted-foreground">{tx.category} · {tx.date}</p>
          </div>
          <span className={`text-sm font-semibold font-display tabular-nums ${
            tx.type === "income" ? "text-income" : "text-expense"
          }`}>
            {tx.type === "income" ? "+" : "-"}{formatCurrency(tx.amount)}
          </span>
        </motion.div>
      ))}
    </div>
  );
}
