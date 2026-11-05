/*
# Order payment status (Stripe checkout)

1. Changes to orders
- New column `payment_status`: 'aguardando_pagamento' (client has not paid yet) or 'pago' (Stripe confirmed the payment).
- New column `stripe_checkout_session_id`: the Stripe checkout session used to charge the order.
- New column `paid_at`: when the payment was confirmed.
- Orders that existed before this migration are marked as 'pago' so they keep their current behavior. New orders start as 'aguardando_pagamento'.

2. Visibility rules
- Creators only see an order after it is paid. Clients still see their unpaid orders so they can pay them.
- Creators cannot accept, refuse or deliver an order that is not paid.
- Unpaid orders are not counted as pending balance for creators.

3. Security
- Clients cannot write payment columns; only the server (payment functions) can confirm a payment.
- The payment functions use the service role, which is granted the minimum access they need on orders.

4. Notes
- Refunds are not handled by this migration.
*/

ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'pago'
  CHECK (payment_status IN ('aguardando_pagamento', 'pago'));
ALTER TABLE orders ALTER COLUMN payment_status SET DEFAULT 'aguardando_pagamento';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS stripe_checkout_session_id text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid_at timestamptz;

CREATE INDEX IF NOT EXISTS orders_stripe_session_idx ON orders (stripe_checkout_session_id);

GRANT SELECT, UPDATE ON orders TO service_role;

DROP POLICY IF EXISTS "select_related_orders" ON orders;
CREATE POLICY "select_related_orders" ON orders FOR SELECT
  TO authenticated USING (
    client_id = auth.uid()
    OR (
      payment_status = 'pago'
      AND EXISTS (SELECT 1 FROM creators c WHERE c.id = orders.creator_id AND c.owner_id = auth.uid())
    )
  );

CREATE OR REPLACE FUNCTION public.get_wallet_summary()
RETURNS TABLE (available numeric, pending numeric)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT
    COALESCE((SELECT SUM(e.amount) FROM wallet_entries e WHERE e.owner_id = auth.uid()), 0),
    COALESCE((
      SELECT SUM(o.total)
      FROM orders o
      JOIN creators c ON c.id = o.creator_id
      WHERE c.owner_id = auth.uid()
        AND o.payment_status = 'pago'
        AND o.status IN ('pendente', 'em_gravacao', 'entregue')
    ), 0);
$$;

CREATE OR REPLACE FUNCTION public.transition_order(p_order_id uuid, p_status text)
RETURNS orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_owner uuid;
  o orders%ROWTYPE;
BEGIN
  SELECT * INTO o FROM orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pedido não encontrado';
  END IF;

  SELECT owner_id INTO v_owner FROM creators WHERE id = o.creator_id;

  IF o.client_id = v_uid AND o.status = 'entregue' AND p_status = 'concluido' THEN
    UPDATE orders SET status = 'concluido' WHERE id = o.id RETURNING * INTO o;

    INSERT INTO wallet_entries (owner_id, kind, description, amount, order_id)
    VALUES (v_owner, 'pedido_aprovado', 'Pedido aprovado pelo cliente', o.total, o.id);
  ELSIF v_owner = v_uid AND o.payment_status = 'pago' AND (
    (o.status = 'pendente' AND p_status IN ('em_gravacao', 'recusado'))
    OR (o.status = 'em_gravacao' AND p_status = 'entregue')
  ) THEN
    UPDATE orders SET status = p_status WHERE id = o.id RETURNING * INTO o;
  ELSE
    RAISE EXCEPTION 'Ação não permitida para este pedido';
  END IF;

  RETURN o;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.transition_order(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.transition_order(uuid, text) TO authenticated;
