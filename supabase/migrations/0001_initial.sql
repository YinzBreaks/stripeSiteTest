-- ─── Database migration ───────────────────────────────────────────────────────
-- Run this against your Supabase project via:
--   pnpm supabase db push
-- or via the Supabase dashboard SQL editor.

create extension if not exists "uuid-ossp";

create table cards (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  player_name text not null,
  year integer not null check (year >= 1900 and year <= 2100),
  brand text not null,
  set_name text not null,
  card_number text,
  variation text,
  grade text check (grade in ('Raw','PSA 1','PSA 2','PSA 3','PSA 4','PSA 5',
    'PSA 6','PSA 7','PSA 8','PSA 9','PSA 10','BGS 1','BGS 2','BGS 3','BGS 4',
    'BGS 5','BGS 6','BGS 7','BGS 8','BGS 9','BGS 9.5','BGS 10',
    'SGC 1','SGC 2','SGC 3','SGC 4','SGC 5','SGC 6','SGC 7','SGC 8','SGC 9','SGC 10')),
  sport text not null,
  team text,
  status text not null default 'collection'
    check (status in ('collection','for_sale','sold','pending')),
  price_cents integer check (price_cents > 0),
  image_front_url text,
  image_back_url text,
  description text,
  stripe_product_id text,
  stripe_price_id text
);

create table orders (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz not null default now(),
  card_id uuid not null references cards(id),
  buyer_email text not null,
  buyer_name text,
  stripe_session_id text not null unique,
  stripe_payment_intent_id text,
  status text not null default 'pending'
    check (status in ('pending','paid','shipped','cancelled','refunded')),
  tracking_number text,
  shipping_address jsonb,
  amount_cents integer not null
);

alter table cards enable row level security;
alter table orders enable row level security;

create policy "Public can view cards" on cards for select using (true);
create policy "Admin can manage cards" on cards for all using (auth.role() = 'authenticated');
create policy "Admin can see orders" on orders for all using (auth.role() = 'authenticated');

create or replace function update_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger cards_updated_at before update on cards
  for each row execute function update_updated_at();

-- Storage bucket for card images (run separately in Supabase dashboard if needed)
-- insert into storage.buckets (id, name, public) values ('card-images', 'card-images', true);
