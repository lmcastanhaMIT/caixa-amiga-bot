import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const VERIFY_TOKEN = Deno.env.get("WHATSAPP_VERIFY_TOKEN")!;
const ACCESS_TOKEN = Deno.env.get("WHATSAPP_ACCESS_TOKEN")!;
const PHONE_NUMBER_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

async function sendWhatsAppText(to: string, body: string) {
  const resp = await fetch(
    `https://graph.facebook.com/v23.0/${PHONE_NUMBER_ID}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body },
      }),
    }
  );

  if (!resp.ok) {
    const errorText = await resp.text();
    throw new Error(`Erro ao enviar WhatsApp: ${errorText}`);
  }

  return await resp.json();
}

async function findUserByPhone(phone: string) {
  const resp = await fetch(
    `${SUPABASE_URL}/rest/v1/whatsapp_connections?phone_e164=eq.${phone}&is_active=eq.true&select=user_id`,
    {
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
    }
  );

  if (!resp.ok) {
    const errorText = await resp.text();
    throw new Error(`Erro ao buscar vínculo do telefone: ${errorText}`);
  }

  const data = await resp.json();
  return data?.[0]?.user_id ?? null;
}

async function callChatAI(phone: string, userId: string, message: string) {
  const resp = await fetch(`${SUPABASE_URL}/functions/v1/chat-ai`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({
      channel: "whatsapp",
      phone,
      userId,
      message,
    }),
  });

  if (!resp.ok) {
    const errorText = await resp.text();
    throw new Error(`Erro na chat-ai: ${errorText}`);
  }

  return await resp.json();
}

serve(async (req) => {
  try {
    const url = new URL(req.url);

    if (req.method === "GET") {
      const mode = url.searchParams.get("hub.mode");
      const token = url.searchParams.get("hub.verify_token");
      const challenge = url.searchParams.get("hub.challenge");

      if (mode === "subscribe" && token === VERIFY_TOKEN) {
        return new Response(challenge, { status: 200 });
      }

      return new Response("Forbidden", { status: 403 });
    }

    if (req.method === "POST") {
      const body = await req.json();

      const message = body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

      if (!message) {
        return new Response(JSON.stringify({ ok: true }), {
          headers: { "Content-Type": "application/json" },
        });
      }

      const from = message.from;
      const text = message?.text?.body ?? "";

      if (!from || !text) {
        return new Response(JSON.stringify({ ok: true }), {
          headers: { "Content-Type": "application/json" },
        });
      }

      const userId = await findUserByPhone(from);

      if (!userId) {
        await sendWhatsAppText(
          from,
          "Não encontrei seu vínculo com a plataforma. Acesse o app e conecte seu número de WhatsApp."
        );

        return new Response(JSON.stringify({ ok: true }), {
          headers: { "Content-Type": "application/json" },
        });
      }

      const aiResult = await callChatAI(from, userId, text);

      const reply =
        aiResult?.reply ??
        "Recebi sua mensagem, mas não consegui processar agora.";

      await sendWhatsAppText(from, reply);

      return new Response(JSON.stringify({ ok: true }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response("Method not allowed", { status: 405 });
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({
        ok: false,
        error: error.message ?? "Erro interno",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});
