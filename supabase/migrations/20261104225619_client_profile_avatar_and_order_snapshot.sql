/*
# Client profile avatars and order snapshot for creators

1. Changes to profiles
- New column `avatar_url`: public link of the client's profile photo, stored in the `avatars` bucket. Empty until the client uploads one.
- Clients can update their own `avatar_url` together with their name.

2. Changes to orders
- New column `client_avatar_url`: a copy of the client's photo at the time the order is placed, filled by the existing order trigger, so the creator can see who ordered.
- `deadline` is no longer required. Clients no longer choose a deadline, so new orders leave it empty. Existing orders keep their values.

3. Security
- Each avatar link must point to the `avatars` bucket (same rule used for creators).
- Creators still cannot read client profiles directly; they only see the photo copied onto each order they received.
- The order trigger keeps running as the signed-in client, who can already read their own profile.

4. Notes
- Changing a client's photo or name later does not rewrite older orders, which keep the values from when they were placed.
*/

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url text
  CHECK (avatar_url IS NULL OR avatar_url LIKE '%/storage/v1/object/public/avatars/%');

GRANT UPDATE (avatar_url) ON profiles TO authenticated;

ALTER TABLE orders ADD COLUMN IF NOT EXISTS client_avatar_url text
  CHECK (client_avatar_url IS NULL OR client_avatar_url LIKE '%/storage/v1/object/public/avatars/%');

ALTER TABLE orders ALTER COLUMN deadline DROP NOT NULL;
ALTER TABLE orders ALTER COLUMN deadline SET DEFAULT NULL;

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
  SELECT price_per_minute INTO creator_price FROM creators WHERE id = NEW.creator_id;
  IF creator_price IS NULL THEN
    RAISE EXCEPTION 'Criador nao encontrado';
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
