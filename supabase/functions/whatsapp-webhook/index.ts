import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function sendWhatsAppMessage(phone: string, text: string) {
  const phoneNumberId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID")!;
  const accessToken = Deno.env.get("WHATSAPP_ACCESS_TOKEN")!;

  const res = await fetch(
    `https://graph.facebook.com/v23.0/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: phone,
        type: "text",
        text: { body: text },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    console.error("WhatsApp send error:", err);
    throw new Error(`WhatsApp API error: ${res.status}`);
  }
  return res.json();
}

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);

  // GET: Meta webhook verification
  if (req.method === "GET") {
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");
    const verifyToken = Deno.env.get("WHATSAPP_VERIFY_TOKEN");

    if (mode === "subscribe" && token === verifyToken) {
      console.log("Webhook verified");
      return new Response(challenge, { status: 200, headers: corsHeaders });
    }
    return new Response("Forbidden", { status: 403, headers: corsHeaders });
  }

  // POST: Receive messages
  if (req.method === "POST") {
    try {
      const body = await req.json();

      // Meta sends status updates too — ignore them
      const entry = body?.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;
      const messages = value?.messages;

      if (!messages?.length) {
        // Acknowledge non-message events (status updates, etc.)
        return new Response(JSON.stringify({ status: "ok" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const msg = messages[0];
      if (msg.type !== "text") {
        const phone = msg.from;
        await sendWhatsAppMessage(phone, "🤖 Desculpe, por enquanto só consigo processar mensagens de texto. Envie uma mensagem escrita!");
        return new Response(JSON.stringify({ status: "ok" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const senderPhone = msg.from; // e164 without +
      const text = msg.text.body;

      console.log(`Message from ${senderPhone}: ${text}`);

      // Create admin supabase client
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, serviceRoleKey);

      // Normalize phone: ensure it starts with country code, no +
      const phoneE164 = senderPhone.startsWith("+")
        ? senderPhone
        : `+${senderPhone}`;

      // Look up user by phone
      const { data: connection } = await supabase
        .from("whatsapp_connections")
        .select("user_id, is_active")
        .eq("phone_e164", phoneE164)
        .eq("is_active", true)
        .maybeSingle();

      if (!connection) {
        await sendWhatsAppMessage(
          senderPhone,
          "👋 Olá! Para usar o FinAssist via WhatsApp, você precisa primeiro conectar seu número no app.\n\nAcesse o painel e vá em *WhatsApp* para vincular este número à sua conta."
        );
        return new Response(JSON.stringify({ status: "ok" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Call chat-ai edge function internally
      const chatAiUrl = `${supabaseUrl}/functions/v1/chat-ai`;
      const chatResponse = await fetch(chatAiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${serviceRoleKey}`,
          "x-whatsapp-channel": "true",
        },
        body: JSON.stringify({
          channel: "whatsapp",
          phone: phoneE164,
          userId: connection.user_id,
          message: text,
        }),
      });

      if (!chatResponse.ok) {
        const errText = await chatResponse.text();
        console.error("chat-ai error:", errText);
        await sendWhatsAppMessage(
          senderPhone,
          "⚠️ Desculpe, tive um problema ao processar sua mensagem. Tente novamente em alguns instantes."
        );
        return new Response(JSON.stringify({ status: "error" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const chatData = await chatResponse.json();
      const reply = chatData.reply || "Não consegui processar sua mensagem.";

      // Send reply back via WhatsApp
      await sendWhatsAppMessage(senderPhone, reply);

      return new Response(JSON.stringify({ status: "ok" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (e) {
      console.error("Webhook error:", e);
      return new Response(JSON.stringify({ error: "Internal error" }), {
        status: 200, // Always 200 to Meta to avoid retries
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  return new Response("Method not allowed", { status: 405, headers: corsHeaders });
});
