import Stripe from "npm:stripe@17.7.0";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const signature = req.headers.get("stripe-signature");
    if (!signature) return jsonResponse({ error: "Assinatura ausente." }, 400);

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
      apiVersion: "2024-06-20",
      httpClient: Stripe.createFetchHttpClient(),
    });

    const body = await req.text();
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      Deno.env.get("STRIPE_WEBHOOK_SECRET")!,
      undefined,
      Stripe.createSubtleCryptoProvider(),
    );

    if (event.type !== "checkout.session.completed") {
      return jsonResponse({ received: true });
    }

    const session = event.data.object as Stripe.Checkout.Session;
    if (session.payment_status !== "paid") {
      return jsonResponse({ received: true });
    }

    const orderId = session.metadata?.order_id;
    if (!orderId) return jsonResponse({ error: "Pedido ausente na cobrança." }, 400);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { error } = await supabase
      .from("orders")
      .update({
        payment_status: "pago",
        paid_at: new Date().toISOString(),
        stripe_checkout_session_id: session.id,
      })
      .eq("id", orderId)
      .eq("payment_status", "aguardando_pagamento");
    if (error) throw error;

    return jsonResponse({ received: true });
  } catch (err) {
    console.error(err);
    return jsonResponse({ error: "Não foi possível processar o evento." }, 400);
  }
});
