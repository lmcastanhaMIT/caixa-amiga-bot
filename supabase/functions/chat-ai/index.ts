import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const tools = [
  {
    type: "function",
    function: {
      name: "registrar_transacao",
      description: "Registra uma transação financeira (gasto ou receita)",
      parameters: {
        type: "object",
        properties: {
          amount: { type: "number", description: "Valor da transação (sempre positivo)" },
          type: { type: "string", enum: ["income", "expense"], description: "Tipo: income (receita) ou expense (despesa)" },
          category: { type: "string", description: "Categoria: Alimentação, Transporte, Moradia, Saúde, Lazer, Assinaturas, Renda, Renda Extra, Outros" },
          description: { type: "string", description: "Descrição curta da transação" },
        },
        required: ["amount", "type", "category", "description"],
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
];

function formatBRL(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

async function executeFunction(
  fnName: string,
  args: any,
  supabase: any,
  userId: string
): Promise<string> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

  switch (fnName) {
    case "registrar_transacao": {
      const { error } = await supabase.from("transactions").insert({
        user_id: userId,
        amount: args.amount,
        type: args.type,
        category: args.category,
        description: args.description,
      });
      if (error) return `Erro ao registrar: ${error.message}`;

      // Get budget info
      const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      const { data: budget } = await supabase
        .from("budgets")
        .select("monthly_limit")
        .eq("user_id", userId)
        .eq("category", args.category)
        .eq("month_year", monthYear)
        .maybeSingle();

      // Get category total this month
      const { data: catTxs } = await supabase
        .from("transactions")
        .select("amount")
        .eq("user_id", userId)
        .eq("type", "expense")
        .eq("category", args.category)
        .gte("date", monthStart)
        .lte("date", monthEnd);

      const catTotal = (catTxs || []).reduce((s: number, t: any) => s + Number(t.amount), 0);
      
      const emoji = args.type === "income" ? "🟢" : "🔴";
      let msg = `✅ ${args.type === "income" ? "Receita" : "Despesa"} registrada!\n\n${emoji} **${formatBRL(args.amount)}** — ${args.category}\n📝 ${args.description}`;
      
      if (budget && args.type === "expense") {
        const pct = Math.round((catTotal / budget.monthly_limit) * 100);
        msg += `\n\n📊 Orçamento ${args.category}: ${formatBRL(catTotal)}/${formatBRL(budget.monthly_limit)} (${pct}%)`;
        if (pct >= 100) msg += `\n🔴 Orçamento estourado!`;
        else if (pct >= 80) msg += `\n⚠️ Atenção: ${100 - pct}% restante`;
        else msg += `\n💡 Restam ${formatBRL(budget.monthly_limit - catTotal)}`;
      }
      return msg;
    }

    case "consultar_saldo": {
      const { data: txs } = await supabase
        .from("transactions")
        .select("amount, type")
        .eq("user_id", userId)
        .gte("date", monthStart)
        .lte("date", monthEnd);

      let income = 0, expense = 0;
      for (const t of txs || []) {
        if (t.type === "income") income += Number(t.amount);
        else expense += Number(t.amount);
      }

      return `💳 **Saldo do mês: ${formatBRL(income - expense)}**\n\n🟢 Entradas: ${formatBRL(income)}\n🔴 Saídas: ${formatBRL(expense)}\n\n📊 Burn rate: ${formatBRL(expense / Math.max(now.getDate(), 1))}/dia`;
    }

    case "resumo_mensal": {
      const { data: txs } = await supabase
        .from("transactions")
        .select("amount, type, category")
        .eq("user_id", userId)
        .gte("date", monthStart)
        .lte("date", monthEnd);

      let income = 0, expense = 0;
      const cats: Record<string, number> = {};
      for (const t of txs || []) {
        if (t.type === "income") income += Number(t.amount);
        else {
          expense += Number(t.amount);
          cats[t.category] = (cats[t.category] || 0) + Number(t.amount);
        }
      }

      const sorted = Object.entries(cats).sort((a, b) => b[1] - a[1]);
      const catLines = sorted
        .map(([cat, val], i) => `${i + 1}. ${cat}: ${formatBRL(val)} (${Math.round((val / expense) * 100)}%)`)
        .join("\n");

      return `📊 **Resumo de ${now.toLocaleString("pt-BR", { month: "long", year: "numeric" })}**\n\n🟢 Receitas: ${formatBRL(income)}\n🔴 Despesas: ${formatBRL(expense)}\n💰 Saldo: ${formatBRL(income - expense)}\n\n📋 Top categorias:\n${catLines || "Nenhuma despesa registrada"}`;
    }

    case "criar_meta": {
      const { error } = await supabase.from("goals").insert({
        user_id: userId,
        name: args.name,
        target_amount: args.target_amount,
        deadline: args.deadline || null,
        emoji: args.emoji || "🎯",
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
      const { data: goals } = await supabase
        .from("goals")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (!goals || goals.length === 0) return "🎯 Você ainda não tem metas. Crie uma dizendo: \"criar meta de 10000 para reserva de emergência\"";

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
    // Auth check
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

    const systemPrompt = `Você é o FinAssist, um assistente financeiro inteligente via WhatsApp. 
Regras:
- Sempre responda em português brasileiro
- Seja conciso e use emojis como indicadores visuais (🟢 receita, 🔴 despesa, 📊 relatórios, 🎯 metas)
- Interprete mensagens naturais como: "gastei 50 no uber", "recebi 3000 salário", "qual meu saldo"
- Categorize automaticamente: Alimentação, Transporte, Moradia, Saúde, Lazer, Assinaturas, Renda, Renda Extra, Outros
- Inclua insights financeiros simples nas respostas
- Confirme cada transação com: valor, categoria e informação de orçamento
- Para valores, extraia o número e o contexto da mensagem
- Se não entender, peça esclarecimento educadamente
- Nunca invente dados - use apenas as funções disponíveis`;

    // First call: let AI decide which function to call
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        tools,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit excedido. Tente novamente em alguns segundos." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Adicione créditos ao workspace." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);
      throw new Error("AI gateway error");
    }

    const aiData = await aiResponse.json();
    const choice = aiData.choices?.[0]?.message;

    // If AI wants to call a function
    if (choice?.tool_calls?.length) {
      const toolResults = [];
      for (const call of choice.tool_calls) {
        const args = JSON.parse(call.function.arguments);
        const result = await executeFunction(call.function.name, args, supabase, userId);
        toolResults.push({
          role: "tool",
          tool_call_id: call.id,
          content: result,
        });
      }

      // Second call: get natural language response with function results
      const finalResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            ...messages,
            choice,
            ...toolResults,
          ],
        }),
      });

      if (!finalResponse.ok) throw new Error("Final AI call failed");
      const finalData = await finalResponse.json();
      const reply = finalData.choices?.[0]?.message?.content || "Desculpe, ocorreu um erro.";

      return new Response(JSON.stringify({ reply }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // No function call - just a conversational response
    const reply = choice?.content || "Não entendi. Tente: 'gastei 50 no uber' ou 'qual meu saldo?'";
    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("chat-ai error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
