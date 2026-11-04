/*
# Creator availability (active / paused)

1. Changes to creators
- New column `is_active`: true when the creator accepts new orders. Every creator starts active.
- Only the creator owner can change it, through the existing owner-only update rule.

2. Security
- The public marketplace only lists active creators. Paused creators stay visible only to their owner.
- The order trigger refuses new orders for paused creators, so the rule cannot be bypassed from the browser.
- Existing orders are not changed when a creator pauses.

3. Notes
- Seed creators are active.
*/

ALTER TABLE creators ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

GRANT UPDATE (is_active) ON creators TO authenticated;

DROP POLICY IF EXISTS "select_public_creators" ON creators;
CREATE POLICY "select_public_creators" ON creators FOR SELECT
  TO anon, authenticated USING (is_active OR owner_id = auth.uid());

CREATE OR REPLACE FUNCTION set_order_defaults()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  creator_price numeric;
  client_display text;
  client_photo text;
BEGIN
  SELECT price_per_minute INTO creator_price FROM creators WHERE id = NEW.creator_id AND is_active;
  IF creator_price IS NULL THEN
    RAISE EXCEPTION 'Criador indisponivel no momento';
  END IF;

  SELECT name, avatar_url INTO client_display, client_photo FROM profiles WHERE id = NEW.client_id;

  NEW.total := NEW.minutes * creator_price;
  NEW.status := 'pendente';
  NEW.client_name := COALESCE(client_display, '');
  NEW.client_avatar_url := client_photo;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION set_order_defaults() FROM PUBLIC, anon, authenticated;
