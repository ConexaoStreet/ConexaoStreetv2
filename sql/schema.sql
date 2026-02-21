-- Conexão Street v2 schema (idempotente)

create extension if not exists "pgcrypto";

create table if not exists public.cs_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  role text default 'member',
  avatar_path text,
  created_at timestamptz default now()
);

create table if not exists public.cs_quality_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  media_type text not null check (media_type in ('image','video')),
  storage_path text not null,
  thumb_path text,
  published boolean default false,
  featured boolean default false,
  created_at timestamptz default now(),
  published_at timestamptz,
  created_by uuid references auth.users(id)
);

create table if not exists public.cs_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text default 'info',
  title text not null,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists public.cs_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id text not null,
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz default now(),
  unique(user_id, product_id)
);

-- Extend existing cs_orders / cs_approvals if they already exist
do $$
begin
  if to_regclass('public.cs_orders') is not null then
    begin
      alter table public.cs_orders add column if not exists payment_proof text;
      alter table public.cs_orders add column if not exists buyer_email text;
      alter table public.cs_orders add column if not exists buyer_name text;
      alter table public.cs_orders add column if not exists buyer_phone text;
      alter table public.cs_orders add column if not exists product_id text;
      alter table public.cs_orders add column if not exists product_name text;
      alter table public.cs_orders add column if not exists amount_cents int;
      alter table public.cs_orders add column if not exists currency text default 'BRL';
      alter table public.cs_orders add column if not exists status text default 'created';
      alter table public.cs_orders add column if not exists payment_ref text;
      alter table public.cs_orders add column if not exists approved_at timestamptz;
    exception when others then
      -- ignore
    end;
  end if;
end $$;

create index if not exists idx_quality_published on public.cs_quality_posts(published, published_at desc);
create index if not exists idx_notifications_user on public.cs_notifications(user_id, created_at desc);
