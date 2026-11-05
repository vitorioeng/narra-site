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

const ORDER_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    const origin = req.headers.get("origin");
    if (!token || !origin) return jsonResponse({ error: "Sessão expirada. Entre novamente." }, 401);

    const { orderId } = (await req.json()) as { orderId?: unknown };
    if (typeof orderId !== "string" || !ORDER_ID_PATTERN.test(orderId)) {
      return jsonResponse({ error: "Pedido inválido." }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) return jsonResponse({ error: "Sessão expirada. Entre novamente." }, 401);

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, client_id, minutes, total, status, payment_status")
      .eq("id", orderId)
      .maybeSingle();
    if (orderError) throw orderError;
    if (!order || order.client_id !== userData.user.id) {
      return jsonResponse({ error: "Pedido não encontrado." }, 404);
    }
    if (order.payment_status === "pago") {
      return jsonResponse({ error: "Este pedido já foi pago." }, 409);
    }
    if (order.status !== "pendente") {
      return jsonResponse({ error: "Este pedido não aceita pagamento." }, 409);
    }

    const amountInCents = Math.round(Number(order.total) * 100);
    if (!Number.isInteger(amountInCents) || amountInCents < 100) {
      return jsonResponse({ error: "Valor do pedido inválido." }, 422);
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
      apiVersion: "2024-06-20",
      httpClient: Stripe.createFetchHttpClient(),
    });

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "brl",
            unit_amount: amountInCents,
            product_data: { name: `Pedido de áudio/vídeo (${order.minutes} min)` },
          },
        },
      ],
      client_reference_id: order.id,
      metadata: { order_id: order.id },
      success_url: `${origin}/?pagamento=sucesso`,
      cancel_url: `${origin}/?pagamento=cancelado`,
    });

    if (!session.url) return jsonResponse({ error: "Não foi possível abrir o pagamento." }, 502);

    const { error: updateError } = await supabase
      .from("orders")
      .update({ stripe_checkout_session_id: session.id })
      .eq("id", order.id);
    if (updateError) throw updateError;

    return jsonResponse({ url: session.url });
  } catch (err) {
    console.error(err);
    return jsonResponse({ error: "Não foi possível abrir o pagamento. Tente novamente." }, 500);
  }
});
