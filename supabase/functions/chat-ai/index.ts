import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Keyword -> category mapping
const CATEGORY_MAP: Record<string, string> = {
  uber: "Transporte", "99": "Transporte", gasolina: "Transporte", estacionamento: "Transporte", ônibus: "Transporte", metrô: "Transporte", pedágio: "Transporte", combustível: "Transporte",
  mercado: "Alimentação", ifood: "Alimentação", restaurante: "Alimentação", almoço: "Alimentação", jantar: "Alimentação", café: "Alimentação", padaria: "Alimentação", lanche: "Alimentação", pizza: "Alimentação", hambúrguer: "Alimentação", supermercado: "Alimentação",
  aluguel: "Moradia", condomínio: "Moradia", energia: "Moradia", luz: "Moradia", água: "Moradia", gás: "Moradia", internet: "Moradia", iptu: "Moradia",
  farmácia: "Saúde", consulta: "Saúde", exame: "Saúde", médico: "Saúde", dentista: "Saúde", remédio: "Saúde", hospital: "Saúde", plano: "Saúde",
  escola: "Educação", curso: "Educação", faculdade: "Educação", livro: "Educação", mensalidade: "Educação",
  cinema: "Lazer", netflix: "Assinaturas", spotify: "Assinaturas", assinatura: "Assinaturas", streaming: "Assinaturas",
  salário: "Renda", salario: "Renda", freelance: "Renda Extra", extra: "Renda Extra", bônus: "Renda Extra",
};

function detectCategory(text: string): string {
  const lower = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  for (const [keyword, category] of Object.entries(CATEGORY_MAP)) {
    const normalizedKey = keyword.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (lower.includes(normalizedKey)) return category;
  }
  return "Outros";
}

const tools = [
  {
    type: "function",
    function: {
      name: "registrar_transacao",
      description: "Registra uma transação financeira (gasto ou receita). Valores com vírgula/ponto devem ser convertidos: '89,90' = 89.90, '3.500' = 3500.",
      parameters: {
        type: "object",
        properties: {
          amount: { type: "number", description: "Valor da transação (sempre positivo). Converter vírgula para ponto decimal: 89,90 -> 89.90. Ponto de milhar: 3.500 -> 3500" },
          type: { type: "string", enum: ["income", "expense"], description: "Tipo: income (receita/recebimento/salário) ou expense (despesa/gasto/pagamento)" },
          category: { type: "string", description: "Categoria. Use mapa: uber/gasolina->Transporte, mercado/ifood->Alimentação, aluguel/energia->Moradia, farmácia/consulta->Saúde, escola/curso->Educação, cinema->Lazer, netflix/spotify->Assinaturas, salário->Renda, freelance->Renda Extra. Default: Outros" },
          description: { type: "string", description: "Descrição curta da transação" },
          needs_confirmation: { type: "boolean", description: "Se o valor >= 1000, definir como true para pedir confirmação ao usuário antes de registrar" },
        },
        required: ["amount", "type", "category", "description"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "confirmar_transacao",
      description: "Confirma e registra uma transação que estava pendente de confirmação (valores >= R$1000)",
      parameters: {
        type: "object",
        properties: {
          amount: { type: "number" },
          type: { type: "string", enum: ["income", "expense"] },
          category: { type: "string" },
          description: { type: "string" },
        },
        required: ["amount", "type", "category", "description"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "editar_transacao",
      description: "Edita uma transação existente. O usuário pode pedir para corrigir valor, descrição, categoria ou tipo.",
      parameters: {
        type: "object",
        properties: {
          transaction_id: { type: "string", description: "ID da transação a editar" },
          amount: { type: "number", description: "Novo valor (opcional)" },
          description: { type: "string", description: "Nova descrição (opcional)" },
          category: { type: "string", description: "Nova categoria (opcional)" },
          type: { type: "string", enum: ["income", "expense"], description: "Novo tipo (opcional)" },
        },
        required: ["transaction_id"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "excluir_transacao",
      description: "Exclui uma transação existente pelo ID",
      parameters: {
        type: "object",
        properties: {
          transaction_id: { type: "string", description: "ID da transação a excluir" },
        },
        required: ["transaction_id"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "consultar_saldo",
      description: "Consulta o saldo atual do usuário (entradas - saídas do mês)",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function",
    function: {
      name: "resumo_mensal",
      description: "Gera resumo financeiro do mês atual com totais por categoria",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function",
    function: {
      name: "fechamento_mensal",
      description: "Gera fechamento mensal inteligente: totais, top 3 categorias, comparação com mês anterior",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function",
    function: {
      name: "criar_meta",
      description: "Cria uma nova meta financeira",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Nome da meta" },
          target_amount: { type: "number", description: "Valor alvo" },
          deadline: { type: "string", description: "Data limite no formato YYYY-MM-DD" },
          emoji: { type: "string", description: "Emoji representativo" },
        },
        required: ["name", "target_amount"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "consultar_metas",
      description: "Lista todas as metas do usuário com progresso",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function",
    function: {
      name: "definir_orcamento",
      description: "Define ou atualiza o limite de orçamento mensal para uma categoria",
      parameters: {
        type: "object",
        properties: {
          category: { type: "string", description: "Categoria do orçamento" },
          monthly_limit: { type: "number", description: "Limite mensal em reais" },
        },
        required: ["category", "monthly_limit"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "consultar_orcamentos",
      description: "Lista todos os orçamentos do mês com percentual consumido",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
];

function formatBRL(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

async function executeFunction(fnName: string, args: any, supabase: any, userId: string): Promise<string> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();
  const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  switch (fnName) {
    case "registrar_transacao": {
      // Check if needs confirmation for values >= 1000
      if (args.needs_confirmation && args.amount >= 1000) {
        const emoji = args.type === "income" ? "🟢" : "🔴";
        return `⚠️ **Confirmação necessária**\n\n${emoji} ${args.type === "income" ? "Receita" : "Despesa"} de **${formatBRL(args.amount)}**\n📝 ${args.description}\n📂 ${args.category}\n\nDigite **"sim"** ou **"confirmar"** para registrar.`;
      }

      const { error } = await supabase.from("transactions").insert({
        user_id: userId, amount: args.amount, type: args.type,
        category: args.category, description: args.description,
      });
      if (error) return `Erro ao registrar: ${error.message}`;

      const { data: budget } = await supabase.from("budgets").select("monthly_limit")
        .eq("user_id", userId).eq("category", args.category).eq("month_year", monthYear).maybeSingle();

      const { data: catTxs } = await supabase.from("transactions").select("amount")
        .eq("user_id", userId).eq("type", "expense").eq("category", args.category)
        .gte("date", monthStart).lte("date", monthEnd);

      const catTotal = (catTxs || []).reduce((s: number, t: any) => s + Number(t.amount), 0);
      const emoji = args.type === "income" ? "🟢" : "🔴";
      let msg = `✅ ${args.type === "income" ? "Receita" : "Despesa"} registrada!\n\n${emoji} **${formatBRL(args.amount)}** — ${args.category}\n📝 ${args.description}`;
      
      if (budget && args.type === "expense") {
        const pct = Math.round((catTotal / budget.monthly_limit) * 100);
        msg += `\n\n📊 Orçamento ${args.category}: ${formatBRL(catTotal)}/${formatBRL(budget.monthly_limit)} (${pct}%)`;
        if (pct >= 100) msg += `\n🔴 **Orçamento estourado!**`;
        else if (pct >= 80) msg += `\n⚠️ **Atenção:** apenas ${100 - pct}% restante!`;
        else msg += `\n💡 Restam ${formatBRL(budget.monthly_limit - catTotal)}`;
      }
      return msg;
    }

    case "confirmar_transacao": {
      const { error } = await supabase.from("transactions").insert({
        user_id: userId, amount: args.amount, type: args.type,
        category: args.category, description: args.description,
      });
      if (error) return `Erro ao registrar: ${error.message}`;
      const emoji = args.type === "income" ? "🟢" : "🔴";
      return `✅ Transação confirmada e registrada!\n\n${emoji} **${formatBRL(args.amount)}** — ${args.category}\n📝 ${args.description}`;
    }

    case "editar_transacao": {
      const updates: any = {};
      if (args.amount !== undefined) updates.amount = args.amount;
      if (args.description) updates.description = args.description;
      if (args.category) updates.category = args.category;
      if (args.type) updates.type = args.type;
      
      const { error } = await supabase.from("transactions").update(updates)
        .eq("id", args.transaction_id).eq("user_id", userId);
      if (error) return `Erro ao editar: ${error.message}`;
      
      const fields = Object.keys(updates).map(k => {
        if (k === "amount") return `Valor: ${formatBRL(updates.amount)}`;
        if (k === "description") return `Descrição: ${updates.description}`;
        if (k === "category") return `Categoria: ${updates.category}`;
        if (k === "type") return `Tipo: ${updates.type === "income" ? "Receita" : "Despesa"}`;
        return "";
      }).join("\n");
      return `✏️ Transação atualizada!\n\n${fields}`;
    }

    case "excluir_transacao": {
      const { data: tx } = await supabase.from("transactions").select("amount, type, description, category")
        .eq("id", args.transaction_id).eq("user_id", userId).maybeSingle();
      if (!tx) return "❌ Transação não encontrada.";
      
      const { error } = await supabase.from("transactions").delete()
        .eq("id", args.transaction_id).eq("user_id", userId);
      if (error) return `Erro ao excluir: ${error.message}`;
      return `🗑️ Transação excluída!\n\n${tx.type === "income" ? "🟢" : "🔴"} ${formatBRL(Number(tx.amount))} — ${tx.category}\n📝 ${tx.description}`;
    }

    case "consultar_saldo": {
      const { data: txs } = await supabase.from("transactions").select("amount, type")
        .eq("user_id", userId).gte("date", monthStart).lte("date", monthEnd);
      let income = 0, expense = 0;
      for (const t of txs || []) {
        if (t.type === "income") income += Number(t.amount);
        else expense += Number(t.amount);
      }
      return `💳 **Saldo do mês: ${formatBRL(income - expense)}**\n\n🟢 Entradas: ${formatBRL(income)}\n🔴 Saídas: ${formatBRL(expense)}\n\n📊 Burn rate: ${formatBRL(expense / Math.max(now.getDate(), 1))}/dia`;
    }

    case "resumo_mensal": {
      const { data: txs } = await supabase.from("transactions").select("amount, type, category")
        .eq("user_id", userId).gte("date", monthStart).lte("date", monthEnd);
      let income = 0, expense = 0;
      const cats: Record<string, number> = {};
      for (const t of txs || []) {
        if (t.type === "income") income += Number(t.amount);
        else { expense += Number(t.amount); cats[t.category] = (cats[t.category] || 0) + Number(t.amount); }
      }
      const sorted = Object.entries(cats).sort((a, b) => b[1] - a[1]);
      const catLines = sorted.map(([cat, val], i) => `${i + 1}. ${cat}: ${formatBRL(val)} (${Math.round((val / expense) * 100)}%)`).join("\n");
      return `📊 **Resumo de ${now.toLocaleString("pt-BR", { month: "long", year: "numeric" })}**\n\n🟢 Receitas: ${formatBRL(income)}\n🔴 Despesas: ${formatBRL(expense)}\n💰 Saldo: ${formatBRL(income - expense)}\n\n📋 Top categorias:\n${catLines || "Nenhuma despesa registrada"}`;
    }

    case "fechamento_mensal": {
      // Current month
      const { data: txs } = await supabase.from("transactions").select("amount, type, category")
        .eq("user_id", userId).gte("date", monthStart).lte("date", monthEnd);
      let income = 0, expense = 0;
      const cats: Record<string, number> = {};
      for (const t of txs || []) {
        if (t.type === "income") income += Number(t.amount);
        else { expense += Number(t.amount); cats[t.category] = (cats[t.category] || 0) + Number(t.amount); }
      }
      
      // Previous month
      const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
      const prevEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();
      const { data: prevTxs } = await supabase.from("transactions").select("amount, type")
        .eq("user_id", userId).gte("date", prevStart).lte("date", prevEnd);
      let prevIncome = 0, prevExpense = 0;
      for (const t of prevTxs || []) {
        if (t.type === "income") prevIncome += Number(t.amount);
        else prevExpense += Number(t.amount);
      }
      
      const top3 = Object.entries(cats).sort((a, b) => b[1] - a[1]).slice(0, 3);
      const top3Lines = top3.map(([cat, val], i) => `${["🥇", "🥈", "🥉"][i]} ${cat}: ${formatBRL(val)}`).join("\n");
      
      const expDiff = prevExpense > 0 ? Math.round(((expense - prevExpense) / prevExpense) * 100) : 0;
      const incDiff = prevIncome > 0 ? Math.round(((income - prevIncome) / prevIncome) * 100) : 0;
      
      let comparison = "\n📈 **Comparativo com mês anterior:**\n";
      if (prevIncome === 0 && prevExpense === 0) {
        comparison += "Sem dados do mês anterior para comparar.";
      } else {
        comparison += `Receitas: ${incDiff >= 0 ? "+" : ""}${incDiff}% ${incDiff >= 0 ? "📈" : "📉"}\n`;
        comparison += `Despesas: ${expDiff >= 0 ? "+" : ""}${expDiff}% ${expDiff <= 0 ? "📉 ótimo!" : "📈 atenção!"}`;
      }
      
      const monthName = now.toLocaleString("pt-BR", { month: "long", year: "numeric" });
      let msg = `📋 **Fechamento de ${monthName}**\n\n`;
      msg += `🟢 Total de entradas: ${formatBRL(income)}\n`;
      msg += `🔴 Total de saídas: ${formatBRL(expense)}\n`;
      msg += `💰 **Saldo: ${formatBRL(income - expense)}**\n\n`;
      msg += `🏆 **Top 3 categorias de gasto:**\n${top3Lines || "Nenhum gasto registrado"}\n`;
      msg += comparison;
      
      if (income - expense > 0) msg += `\n\n🎉 Parabéns! Você fechou o mês no positivo!`;
      else if (income - expense < 0) msg += `\n\n⚠️ Atenção: mês fechou no negativo. Revise seus gastos.`;
      
      return msg;
    }

    case "definir_orcamento": {
      const { data: existing } = await supabase.from("budgets")
        .select("id").eq("user_id", userId).eq("category", args.category).eq("month_year", monthYear).maybeSingle();
      
      if (existing) {
        const { error } = await supabase.from("budgets").update({ monthly_limit: args.monthly_limit })
          .eq("id", existing.id);
        if (error) return `Erro ao atualizar orçamento: ${error.message}`;
      } else {
        const { error } = await supabase.from("budgets").insert({
          user_id: userId, category: args.category, monthly_limit: args.monthly_limit, month_year: monthYear,
        });
        if (error) return `Erro ao criar orçamento: ${error.message}`;
      }

      const { data: catTxs } = await supabase.from("transactions").select("amount")
        .eq("user_id", userId).eq("type", "expense").eq("category", args.category)
        .gte("date", monthStart).lte("date", monthEnd);
      const spent = (catTxs || []).reduce((s: number, t: any) => s + Number(t.amount), 0);
      const pct = Math.round((spent / args.monthly_limit) * 100);
      
      let msg = `📊 Orçamento ${existing ? "atualizado" : "definido"}!\n\n`;
      msg += `📂 ${args.category}: ${formatBRL(args.monthly_limit)}/mês\n`;
      msg += `💸 Gasto atual: ${formatBRL(spent)} (${pct}%)\n`;
      if (pct >= 100) msg += `🔴 **Já estourou o limite!**`;
      else if (pct >= 80) msg += `⚠️ **Atenção:** ${100 - pct}% restante`;
      else msg += `✅ Restam ${formatBRL(args.monthly_limit - spent)}`;
      return msg;
    }

    case "consultar_orcamentos": {
      const { data: budgets } = await supabase.from("budgets").select("*")
        .eq("user_id", userId).eq("month_year", monthYear);
      
      if (!budgets?.length) return "📊 Nenhum orçamento definido. Diga: \"definir orçamento de 1200 para alimentação\"";
      
      const lines = [];
      let totalLimit = 0, totalSpent = 0;
      for (const b of budgets) {
        const { data: catTxs } = await supabase.from("transactions").select("amount")
          .eq("user_id", userId).eq("type", "expense").eq("category", b.category)
          .gte("date", monthStart).lte("date", monthEnd);
        const spent = (catTxs || []).reduce((s: number, t: any) => s + Number(t.amount), 0);
        const pct = Math.round((spent / b.monthly_limit) * 100);
        totalLimit += b.monthly_limit; totalSpent += spent;
        
        let status = "✅";
        if (pct >= 100) status = "🔴";
        else if (pct >= 80) status = "⚠️";
        lines.push(`${status} **${b.category}**: ${formatBRL(spent)}/${formatBRL(b.monthly_limit)} (${pct}%)`);
      }
      
      const totalPct = Math.round((totalSpent / totalLimit) * 100);
      return `📊 **Orçamentos de ${now.toLocaleString("pt-BR", { month: "long" })}**\n\n${lines.join("\n")}\n\n📋 Total: ${formatBRL(totalSpent)}/${formatBRL(totalLimit)} (${totalPct}%)`;
    }

    case "criar_meta": {
      const { error } = await supabase.from("goals").insert({
        user_id: userId, name: args.name, target_amount: args.target_amount,
        deadline: args.deadline || null, emoji: args.emoji || "🎯",
      });
      if (error) return `Erro ao criar meta: ${error.message}`;
      let msg = `🎯 Meta criada!\n\n${args.emoji || "🎯"} **${args.name}**\n💰 Valor: ${formatBRL(args.target_amount)}`;
      if (args.deadline) {
        const months = Math.max(1, Math.ceil((new Date(args.deadline).getTime() - now.getTime()) / (30 * 24 * 60 * 60 * 1000)));
        msg += `\n📅 Prazo: ${args.deadline}\n💡 Sugestão: ${formatBRL(args.target_amount / months)}/mês`;
      }
      return msg;
    }

    case "consultar_metas": {
      const { data: goals } = await supabase.from("goals").select("*")
        .eq("user_id", userId).order("created_at", { ascending: false });
      if (!goals?.length) return "🎯 Você ainda não tem metas. Crie uma dizendo: \"criar meta de 10000 para reserva de emergência\"";
      const lines = goals.map((g: any) => {
        const pct = Math.round((g.current_amount / g.target_amount) * 100);
        let line = `${g.emoji} **${g.name}**\n   ${formatBRL(g.current_amount)}/${formatBRL(g.target_amount)} (${pct}%)`;
        if (g.deadline) {
          const months = Math.max(1, Math.ceil((new Date(g.deadline).getTime() - now.getTime()) / (30 * 24 * 60 * 60 * 1000)));
          const remaining = g.target_amount - g.current_amount;
          if (remaining > 0) line += `\n   💡 Sugestão: ${formatBRL(remaining / months)}/mês`;
        }
        return line;
      });
      return `🎯 **Suas Metas**\n\n${lines.join("\n\n")}`;
    }

    default:
      return "Função não reconhecida.";
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const userId = claimsData.claims.sub;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const { messages } = await req.json();

    const systemPrompt = `Você é o FinAssist, um assistente financeiro inteligente. 
Regras:
- Sempre responda em português brasileiro
- Seja conciso e use emojis como indicadores visuais
- Interprete mensagens naturais: "gastei 50 no uber", "recebi 3.500 salário", "paguei 42 no uber hoje"
- IMPORTANTE: Converta valores corretamente:
  - "89,90" = 89.90 (vírgula é decimal)
  - "3.500" = 3500 (ponto é milhar)
  - "1.200,50" = 1200.50 (ponto milhar + vírgula decimal)
- Categorize usando o mapa de palavras-chave. Se não encontrar, use "Outros"
- Para valores >= R$1000, peça confirmação (needs_confirmation: true)
- Quando o usuário disser "sim", "confirmar", "pode registrar" após uma pendência, use confirmar_transacao
- Para edição: busque a última transação relevante e use editar_transacao
- Para exclusão: busque a transação e use excluir_transacao
- Para orçamentos: permita definir e consultar limites por categoria
- Para fechamento: use fechamento_mensal para relatório completo
- Nunca invente dados - use apenas as funções disponíveis`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        tools,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) return new Response(JSON.stringify({ error: "Rate limit" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (aiResponse.status === 402) return new Response(JSON.stringify({ error: "Credits" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error("AI gateway error");
    }

    const aiData = await aiResponse.json();
    const choice = aiData.choices?.[0]?.message;

    if (choice?.tool_calls?.length) {
      const toolResults = [];
      for (const call of choice.tool_calls) {
        const args = JSON.parse(call.function.arguments);
        const result = await executeFunction(call.function.name, args, supabase, userId);
        toolResults.push({ role: "tool", tool_call_id: call.id, content: result });
      }

      const finalResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [{ role: "system", content: systemPrompt }, ...messages, choice, ...toolResults],
        }),
      });

      if (!finalResponse.ok) throw new Error("Final AI call failed");
      const finalData = await finalResponse.json();
      return new Response(JSON.stringify({ reply: finalData.choices?.[0]?.message?.content || "Erro." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ reply: choice?.content || "Não entendi. Tente: 'gastei 50 no uber' ou 'qual meu saldo?'" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("chat-ai error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
