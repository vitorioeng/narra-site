/*
# Creator wallet, withdrawals and order approval

1. New tables
- `wallet_entries`: the creator's money history. Each row adds or removes money: approved orders (+), withdrawal requests (-), refused withdrawals (+ back).
- `withdrawals`: withdrawal requests with amount, PIX key, creator name snapshot and status (pendente, aprovado, recusado).
- `platform_admins`: users allowed to review withdrawals. Empty until the platform owner is added.

2. Orders
- New status `concluido`: the client approved the delivery and the money was released to the creator's wallet.
- Order status changes now go through one secure function. Creators can accept, refuse and mark orders as delivered. Clients can approve a delivery. Nobody can change the status directly.

3. Balances
- Available balance = sum of the creator's wallet entries.
- Pending balance = total of orders still in progress (pendente, em_gravacao, entregue).

4. Security
- Creators can only read their own wallet entries and withdrawals. Platform admins can also read all withdrawals.
- No table can be written directly from the browser. All changes happen inside secure functions that check the user's permissions and the current balance.
- Withdrawal requests cannot exceed the available balance, even when sent twice at the same time.

5. Notes
- Actual PIX payouts are not part of this migration. Approved withdrawals stay marked as approved until the payment gateway is connected.
*/

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check
  CHECK (status IN ('pendente', 'em_gravacao', 'entregue', 'concluido', 'recusado'));

DROP POLICY IF EXISTS "update_creator_order_status" ON orders;
REVOKE UPDATE (status) ON orders FROM authenticated;

CREATE TABLE IF NOT EXISTS platform_admins (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE
);

ALTER TABLE platform_admins ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS withdrawals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  creator_name text NOT NULL DEFAULT '',
  amount numeric(10, 2) NOT NULL CHECK (amount > 0),
  pix_key text NOT NULL CHECK (char_length(pix_key) BETWEEN 3 AND 100),
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'recusado')),
  created_at timestamptz NOT NULL DEFAULT now(),
  decided_at timestamptz
);

CREATE INDEX IF NOT EXISTS withdrawals_owner_idx ON withdrawals (owner_id);
CREATE INDEX IF NOT EXISTS withdrawals_status_idx ON withdrawals (status);

CREATE TABLE IF NOT EXISTS wallet_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('pedido_aprovado', 'saque_solicitado', 'saque_recusado')),
  description text NOT NULL DEFAULT '',
  amount numeric(10, 2) NOT NULL CHECK (amount <> 0),
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  withdrawal_id uuid REFERENCES withdrawals(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS wallet_entries_owner_idx ON wallet_entries (owner_id);

ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_entries ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid());
$$;

REVOKE EXECUTE ON FUNCTION public.is_platform_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_platform_admin() TO authenticated;

GRANT SELECT ON withdrawals, wallet_entries TO authenticated;

DROP POLICY IF EXISTS "select_own_or_admin_withdrawals" ON withdrawals;
CREATE POLICY "select_own_or_admin_withdrawals" ON withdrawals FOR SELECT
  TO authenticated USING (owner_id = auth.uid() OR public.is_platform_admin());

DROP POLICY IF EXISTS "select_own_wallet_entries" ON wallet_entries;
CREATE POLICY "select_own_wallet_entries" ON wallet_entries FOR SELECT
  TO authenticated USING (owner_id = auth.uid());

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
        AND o.status IN ('pendente', 'em_gravacao', 'entregue')
    ), 0);
$$;

REVOKE EXECUTE ON FUNCTION public.get_wallet_summary() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_wallet_summary() TO authenticated;

CREATE OR REPLACE FUNCTION public.request_withdrawal(p_amount numeric, p_pix_key text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner uuid := auth.uid();
  v_creator_name text;
  v_pix text := btrim(p_pix_key);
  v_available numeric;
  v_withdrawal_id uuid;
BEGIN
  IF v_owner IS NULL THEN
    RAISE EXCEPTION 'Sessão expirada';
  END IF;
  IF p_amount IS NULL OR p_amount <= 0 OR p_amount <> round(p_amount, 2) THEN
    RAISE EXCEPTION 'Valor inválido';
  END IF;
  IF char_length(v_pix) < 3 OR char_length(v_pix) > 100 THEN
    RAISE EXCEPTION 'Chave PIX inválida';
  END IF;

  SELECT name INTO v_creator_name FROM creators WHERE owner_id = v_owner;
  IF v_creator_name IS NULL THEN
    RAISE EXCEPTION 'Criador não encontrado';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext(v_owner::text));

  SELECT COALESCE(SUM(amount), 0) INTO v_available FROM wallet_entries WHERE owner_id = v_owner;
  IF p_amount > v_available THEN
    RAISE EXCEPTION 'Saldo insuficiente';
  END IF;

  INSERT INTO withdrawals (owner_id, creator_name, amount, pix_key)
  VALUES (v_owner, v_creator_name, p_amount, v_pix)
  RETURNING id INTO v_withdrawal_id;

  INSERT INTO wallet_entries (owner_id, kind, description, amount, withdrawal_id)
  VALUES (v_owner, 'saque_solicitado', 'Saque solicitado', -p_amount, v_withdrawal_id);

  RETURN v_withdrawal_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.request_withdrawal(numeric, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.request_withdrawal(numeric, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.decide_withdrawal(p_withdrawal_id uuid, p_approve boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  w withdrawals%ROWTYPE;
BEGIN
  IF NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Sem permissão';
  END IF;

  SELECT * INTO w FROM withdrawals WHERE id = p_withdrawal_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Saque não encontrado';
  END IF;
  IF w.status <> 'pendente' THEN
    RAISE EXCEPTION 'Saque já foi decidido';
  END IF;

  UPDATE withdrawals
  SET status = CASE WHEN p_approve THEN 'aprovado' ELSE 'recusado' END,
      decided_at = now()
  WHERE id = w.id;

  IF NOT p_approve THEN
    INSERT INTO wallet_entries (owner_id, kind, description, amount, withdrawal_id)
    VALUES (w.owner_id, 'saque_recusado', 'Saque recusado e devolvido ao saldo', w.amount, w.id);
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.decide_withdrawal(uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.decide_withdrawal(uuid, boolean) TO authenticated;

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
  ELSIF v_owner = v_uid AND (
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
