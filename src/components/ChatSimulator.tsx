import { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";
import { motion } from "framer-motion";

interface Message {
  id: string;
  role: "user" | "bot";
  content: string;
  timestamp: string;
}

const initialMessages: Message[] = [
  { id: "1", role: "bot", content: "Olá! 👋 Sou o FinAssist, seu assistente financeiro. Me diga o que precisa!\n\nExemplos:\n• \"gastei 120 no mercado\"\n• \"recebi 5000 salário\"\n• \"qual meu saldo?\"\n• \"resumo do mês\"", timestamp: "08:00" },
  { id: "2", role: "user", content: "gastei 120 no mercado", timestamp: "08:05" },
  { id: "3", role: "bot", content: "✅ Despesa registrada!\n\n🔴 **R$ 120,00** — Alimentação\n🛒 Mercado\n\n📊 Orçamento Alimentação: R$ 850/R$ 1.200 (71%)\n\n💡 Você ainda tem R$ 350,00 disponíveis nessa categoria este mês.", timestamp: "08:05" },
  { id: "4", role: "user", content: "recebi 5000 salário", timestamp: "08:10" },
  { id: "5", role: "bot", content: "✅ Receita registrada!\n\n🟢 **R$ 5.000,00** — Renda\n💰 Salário\n\n💳 Saldo atual: **R$ 12.350,00**\n\n📈 Dica: Considere direcionar 20% (R$ 1.000) para suas metas!", timestamp: "08:10" },
];

const botReplies: Record<string, string> = {
  "saldo": "💳 **Saldo atual: R$ 12.350,00**\n\n🟢 Entradas no mês: R$ 6.200,00\n🔴 Saídas no mês: R$ 3.514,90\n\n📊 Burn rate: R$ 117/dia",
  "resumo": "📊 **Resumo de Março 2026**\n\n🟢 Receitas: R$ 6.200,00\n🔴 Despesas: R$ 3.514,90\n💰 Saldo: R$ 12.350,00\n\n📋 Top categorias:\n1. Moradia: R$ 1.800 (51%)\n2. Alimentação: R$ 850 (24%)\n3. Transporte: R$ 340 (10%)\n\n✨ Você está 15% abaixo do gasto médio!",
  "meta": "🎯 **Suas Metas**\n\n🛡️ Reserva de Emergência\n   R$ 8.500/R$ 15.000 (57%)\n   💡 Sugestão: R$ 650/mês\n\n✈️ Viagem Europa\n   R$ 3.200/R$ 12.000 (27%)\n   💡 Sugestão: R$ 550/mês\n\n💻 MacBook Pro\n   R$ 5.800/R$ 8.000 (73%)\n   💡 Sugestão: R$ 733/mês",
};

function getBotReply(input: string): string {
  const lower = input.toLowerCase();
  if (lower.includes("saldo")) return botReplies["saldo"];
  if (lower.includes("resumo") || lower.includes("mês")) return botReplies["resumo"];
  if (lower.includes("meta")) return botReplies["meta"];
  if (lower.includes("gast") || lower.includes("pag")) {
    const match = lower.match(/(\d+[\.,]?\d*)/);
    const val = match ? match[1].replace(",", ".") : "0";
    return `✅ Despesa registrada!\n\n🔴 **R$ ${parseFloat(val).toFixed(2).replace(".", ",")}** — Outros\n\n📊 Acompanhe seus gastos pelo dashboard!`;
  }
  if (lower.includes("receb")) {
    const match = lower.match(/(\d+[\.,]?\d*)/);
    const val = match ? match[1].replace(",", ".") : "0";
    return `✅ Receita registrada!\n\n🟢 **R$ ${parseFloat(val).toFixed(2).replace(".", ",")}** — Renda\n\n💳 Saldo atualizado!`;
  }
  return "🤔 Não entendi. Tente algo como:\n• \"gastei 50 no almoço\"\n• \"qual meu saldo?\"\n• \"resumo do mês\"\n• \"minhas metas\"";
}

export default function ChatSimulator() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  const send = () => {
    if (!input.trim()) return;
    const now = new Date();
    const time = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
    
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: input.trim(), timestamp: time };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setTyping(true);

    setTimeout(() => {
      const reply = getBotReply(userMsg.content);
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: "bot", content: reply, timestamp: time }]);
      setTyping(false);
    }, 800);
  };

  return (
    <div className="flex flex-col h-full max-h-[700px] bg-card rounded-xl border border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-primary/5">
        <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold">FA</div>
        <div>
          <p className="text-sm font-display font-semibold text-foreground">FinAssist Bot</p>
          <p className="text-xs text-muted-foreground">{typing ? "Digitando..." : "Online"}</p>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((msg, i) => (
          <motion.div
            key={msg.id}
            initial={i >= initialMessages.length ? { opacity: 0, y: 8 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div className={msg.role === "user" ? "chat-bubble-user" : "chat-bubble-bot"}>
              <p className="text-sm whitespace-pre-line font-body">{msg.content}</p>
              <p className="text-[10px] text-muted-foreground mt-1 text-right">{msg.timestamp}</p>
            </div>
          </motion.div>
        ))}
        {typing && (
          <div className="flex justify-start">
            <div className="chat-bubble-bot">
              <div className="flex gap-1 py-1">
                <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-border">
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Digite uma mensagem..."
            className="flex-1 bg-muted rounded-full px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring/20 font-body"
          />
          <button
            onClick={send}
            disabled={!input.trim()}
            className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 transition-opacity hover:opacity-90"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
