/*
# Narra marketplace: profiles, creators and orders

1. New Tables
- `profiles`: one row per signed-in user, with the chosen role ('cliente' or 'criador') and display name.
- `creators`: marketplace listings for audio and video. Each has a price per minute, accepted deadlines, styles, languages, rating and an optional owner. Seeded creators have no owner and cannot be edited by anyone.
- `orders`: purchase requests from clients to creators. The total, client name and initial status are calculated by a database trigger, so the browser cannot set them.

2. Security
- Row level security is enabled on all three tables.
- profiles: each user can only read, create and update their own row. Only name and role are editable.
- creators: publicly readable (marketplace). Only the owner can create, or update price, deadlines and styles of their creator.
- orders: visible to the client who placed it and to the owner of the creator. Clients can create orders. Only the creator owner can change the status.
- The trigger function is not callable through the API.

3. Notes
- Seed creators use fixed ids so this migration can be re-applied safely.
- Email confirmation is not part of this migration.
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('cliente', 'criador')),
  name text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS creators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  mode text NOT NULL CHECK (mode IN ('audio', 'video')),
  name text NOT NULL,
  bio text NOT NULL DEFAULT '',
  price_per_minute numeric(10, 2) NOT NULL CHECK (price_per_minute > 0),
  deadlines text[] NOT NULL DEFAULT '{}',
  styles text[] NOT NULL DEFAULT '{}',
  languages text[] NOT NULL DEFAULT '{}',
  rating numeric(2, 1) NOT NULL DEFAULT 5.0,
  wave_seed integer NOT NULL DEFAULT (floor(random() * 1000))::integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS creators_one_per_owner ON creators (owner_id) WHERE owner_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  client_name text NOT NULL DEFAULT '',
  creator_id uuid NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  minutes integer NOT NULL CHECK (minutes BETWEEN 1 AND 15),
  deadline text NOT NULL,
  style text NOT NULL,
  briefing_type text NOT NULL CHECK (briefing_type IN ('texto', 'roteiro')),
  briefing text NOT NULL,
  total numeric(10, 2) NOT NULL DEFAULT 0 CHECK (total >= 0),
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_gravacao', 'entregue', 'recusado')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS orders_client_idx ON orders (client_id);
CREATE INDEX IF NOT EXISTS orders_creator_idx ON orders (creator_id);

CREATE OR REPLACE FUNCTION set_order_defaults()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  creator_price numeric;
  client_display text;
BEGIN
  SELECT price_per_minute INTO creator_price FROM creators WHERE id = NEW.creator_id;
  IF creator_price IS NULL THEN
    RAISE EXCEPTION 'Criador nao encontrado';
  END IF;

  SELECT name INTO client_display FROM profiles WHERE id = NEW.client_id;

  NEW.total := NEW.minutes * creator_price;
  NEW.status := 'pendente';
  NEW.client_name := COALESCE(client_display, '');
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION set_order_defaults() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS orders_set_defaults ON orders;
CREATE TRIGGER orders_set_defaults
  BEFORE INSERT ON orders
  FOR EACH ROW EXECUTE FUNCTION set_order_defaults();

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON profiles TO authenticated;
GRANT INSERT (id, role, name) ON profiles TO authenticated;
GRANT UPDATE (role, name) ON profiles TO authenticated;

GRANT SELECT ON creators TO anon, authenticated;
GRANT INSERT (owner_id, mode, name, bio, price_per_minute, deadlines, styles, languages) ON creators TO authenticated;
GRANT UPDATE (price_per_minute, deadlines, styles) ON creators TO authenticated;

GRANT SELECT ON orders TO authenticated;
GRANT INSERT (creator_id, minutes, deadline, style, briefing_type, briefing) ON orders TO authenticated;
GRANT UPDATE (status) ON orders TO authenticated;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "select_public_creators" ON creators;
CREATE POLICY "select_public_creators" ON creators FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_creator" ON creators;
CREATE POLICY "insert_own_creator" ON creators FOR INSERT
  TO authenticated WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "update_own_creator" ON creators;
CREATE POLICY "update_own_creator" ON creators FOR UPDATE
  TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "select_related_orders" ON orders;
CREATE POLICY "select_related_orders" ON orders FOR SELECT
  TO authenticated USING (
    client_id = auth.uid()
    OR EXISTS (SELECT 1 FROM creators c WHERE c.id = orders.creator_id AND c.owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_own_orders" ON orders;
CREATE POLICY "insert_own_orders" ON orders FOR INSERT
  TO authenticated WITH CHECK (client_id = auth.uid());

DROP POLICY IF EXISTS "update_creator_order_status" ON orders;
CREATE POLICY "update_creator_order_status" ON orders FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM creators c WHERE c.id = orders.creator_id AND c.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM creators c WHERE c.id = orders.creator_id AND c.owner_id = auth.uid()));

INSERT INTO creators (id, owner_id, mode, name, bio, price_per_minute, deadlines, styles, languages, rating, wave_seed) VALUES
  ('5d1c0a00-0000-4000-8000-000000000001', NULL, 'audio', 'Criador 01', 'Voz calma e próxima, ideal para mensagens íntimas e relaxamento.', 45, ARRAY['24h','48h','72h'], ARRAY['ASMR'], ARRAY['PT-BR','EN'], 4.8, 1),
  ('5d1c0a00-0000-4000-8000-000000000002', NULL, 'audio', 'Criador 02', 'Narrativa suave e envolvente para histórias, cartas e dedicatórias.', 39, ARRAY['48h','72h','5 dias'], ARRAY['VOZ'], ARRAY['PT-BR','EN'], 4.9, 2),
  ('5d1c0a00-0000-4000-8000-000000000003', NULL, 'audio', 'Criador 03', 'Sussurros leves para ASMR e meditações guiadas.', 52, ARRAY['24h','48h'], ARRAY['ASMR','VOZ'], ARRAY['PT-BR'], 4.7, 3),
  ('5d1c0a00-0000-4000-8000-000000000004', NULL, 'audio', 'Criador 04', 'Tom claro e dinâmico para anúncios, vídeos e apresentações.', 60, ARRAY['24h','48h','72h','5 dias'], ARRAY['VOZ'], ARRAY['PT-BR','EN'], 4.8, 4),
  ('5d1c0a00-0000-4000-8000-000000000005', NULL, 'video', 'Criador 05', 'Depoimentos gravados com enquadramento limpo e roteiro leve.', 95, ARRAY['48h','72h','5 dias'], ARRAY['Depoimento'], ARRAY['PT-BR'], 4.8, 5),
  ('5d1c0a00-0000-4000-8000-000000000006', NULL, 'video', 'Criador 06', 'Mensagens em vídeo pessoais para aniversários e celebrações.', 80, ARRAY['24h','48h'], ARRAY['Mensagem'], ARRAY['PT-BR','EN'], 4.9, 6),
  ('5d1c0a00-0000-4000-8000-000000000007', NULL, 'video', 'Criador 07', 'Vídeos institucionais objetivos para apresentar marcas e produtos.', 120, ARRAY['72h','5 dias','7 dias'], ARRAY['Institucional'], ARRAY['PT-BR','EN'], 4.7, 7),
  ('5d1c0a00-0000-4000-8000-000000000008', NULL, 'video', 'Criador 08', 'Recados em vídeo com depoimento e mensagem, ótimos para presentes.', 88, ARRAY['48h','72h'], ARRAY['Depoimento','Mensagem'], ARRAY['PT-BR'], 4.6, 8)
ON CONFLICT (id) DO NOTHING;
