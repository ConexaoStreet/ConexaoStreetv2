-- Enable RLS
alter table public.cs_profiles enable row level security;
alter table public.cs_quality_posts enable row level security;
alter table public.cs_notifications enable row level security;
alter table public.cs_reviews enable row level security;

-- profiles
drop policy if exists "profiles_read_own" on public.cs_profiles;
create policy "profiles_read_own" on public.cs_profiles
for select using (auth.uid() = user_id);

drop policy if exists "profiles_write_own" on public.cs_profiles;
create policy "profiles_write_own" on public.cs_profiles
for insert with check (auth.uid() = user_id);

drop policy if exists "profiles_update_own" on public.cs_profiles;
create policy "profiles_update_own" on public.cs_profiles
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- admin helper
create or replace function public.cs_is_admin()
returns boolean
language sql stable
as $$
  select exists(
    select 1 from public.cs_profiles p
    where p.user_id = auth.uid() and p.role = 'admin'
  );
$$;

-- quality posts
drop policy if exists "quality_public_read" on public.cs_quality_posts;
create policy "quality_public_read" on public.cs_quality_posts
for select using (published = true);

drop policy if exists "quality_admin_write" on public.cs_quality_posts;
create policy "quality_admin_write" on public.cs_quality_posts
for all using (public.cs_is_admin()) with check (public.cs_is_admin());

-- notifications
drop policy if exists "notif_read_own" on public.cs_notifications;
create policy "notif_read_own" on public.cs_notifications
for select using (auth.uid() = user_id);

drop policy if exists "notif_admin_insert" on public.cs_notifications;
create policy "notif_admin_insert" on public.cs_notifications
for insert with check (public.cs_is_admin());

-- reviews: only approved users may insert (policy checks approvals if exists)
create or replace function public.cs_has_approval(pid text)
returns boolean
language sql stable
as $$
  select exists(
    select 1 from public.cs_approvals a
    where a.user_id = auth.uid() and a.approved = true and a.product_id = pid
  );
$$;

drop policy if exists "reviews_read_public" on public.cs_reviews;
create policy "reviews_read_public" on public.cs_reviews
for select using (true);

drop policy if exists "reviews_insert_approved" on public.cs_reviews;
create policy "reviews_insert_approved" on public.cs_reviews
for insert with check (public.cs_has_approval(product_id));

-- Existing tables (if present)
do $$
begin
  if to_regclass('public.cs_orders') is not null then
    execute 'alter table public.cs_orders enable row level security';
    execute 'drop policy if exists cs_orders_read_own on public.cs_orders';
    execute 'create policy cs_orders_read_own on public.cs_orders for select using (auth.uid() = user_id)';
    execute 'drop policy if exists cs_orders_insert_own on public.cs_orders';
    execute 'create policy cs_orders_insert_own on public.cs_orders for insert with check (auth.uid() = user_id)';
    execute 'drop policy if exists cs_orders_admin_update on public.cs_orders';
    execute 'create policy cs_orders_admin_update on public.cs_orders for update using (public.cs_is_admin()) with check (public.cs_is_admin())';
  end if;

  if to_regclass('public.cs_approvals') is not null then
    execute 'alter table public.cs_approvals enable row level security';
    execute 'drop policy if exists cs_approvals_read_own on public.cs_approvals';
    execute 'create policy cs_approvals_read_own on public.cs_approvals for select using (auth.uid() = user_id)';
    execute 'drop policy if exists cs_approvals_admin_write on public.cs_approvals';
    execute 'create policy cs_approvals_admin_write on public.cs_approvals for all using (public.cs_is_admin()) with check (public.cs_is_admin())';
  end if;
end $$;
