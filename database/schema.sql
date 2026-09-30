-- Execute no PostgreSQL/Neon antes de ativar pagamentos.
CREATE TABLE IF NOT EXISTS inventory (id text PRIMARY KEY, price integer NOT NULL CHECK(price>0), stock integer NOT NULL DEFAULT 0 CHECK(stock>=0), active boolean NOT NULL DEFAULT false);
CREATE TABLE IF NOT EXISTS orders (id uuid PRIMARY KEY, name text NOT NULL, email text NOT NULL, phone text NOT NULL, items jsonb NOT NULL, total integer NOT NULL, status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','paid','cancelled')), stripe_session text UNIQUE, created_at timestamptz NOT NULL DEFAULT now(), paid_at timestamptz);
CREATE OR REPLACE FUNCTION reserve_order(order_id uuid, customer_name text, customer_email text, customer_phone text, requested jsonb) RETURNS void LANGUAGE plpgsql AS $$
DECLARE item jsonb; available inventory%ROWTYPE; order_total integer := 0;
BEGIN
 -- Lock in a fixed order to prevent concurrent checkout overselling/deadlocks.
 FOR item IN SELECT value FROM jsonb_array_elements(requested) ORDER BY value->>'id' LOOP
  SELECT * INTO available FROM inventory WHERE id=item->>'id' FOR UPDATE;
  IF NOT FOUND OR NOT available.active OR available.stock < (item->>'quantity')::integer OR available.price <> (item->>'price')::integer THEN RAISE EXCEPTION 'Unavailable product'; END IF;
  UPDATE inventory SET stock=stock-(item->>'quantity')::integer WHERE id=item->>'id';
  order_total := order_total + available.price*(item->>'quantity')::integer;
 END LOOP;
 INSERT INTO orders(id,name,email,phone,items,total) VALUES(order_id,customer_name,customer_email,customer_phone,requested,order_total);
END $$;
CREATE OR REPLACE FUNCTION release_order(order_id uuid) RETURNS void LANGUAGE plpgsql AS $$
DECLARE existing orders%ROWTYPE; item jsonb;
BEGIN
 SELECT * INTO existing FROM orders WHERE id=order_id FOR UPDATE;
 IF NOT FOUND OR existing.status <> 'pending' THEN RETURN; END IF;
 FOR item IN SELECT value FROM jsonb_array_elements(existing.items) ORDER BY value->>'id' LOOP
  UPDATE inventory SET stock=stock+(item->>'quantity')::integer WHERE id=item->>'id';
 END LOOP;
 UPDATE orders SET status='cancelled' WHERE id=order_id;
END $$;
-- Stock stays zero and active=false until verified by the ICC team.
INSERT INTO inventory(id,price) VALUES ('rapoo',21990),('gamer',42900),('redragon',33490),('pcyes',33990),('evolut',33990),('tdagger',31990),('logitech',18990) ON CONFLICT DO NOTHING;
