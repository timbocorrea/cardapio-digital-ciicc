-- Fase 12 — Corrigir RLS do fluxo de aquisições físicas
-- Objetivo:
-- - permitir que cliente autenticado registre a própria aquisição em sales;
-- - permitir que cliente autenticado registre itens da própria aquisição em sale_items;
-- - permitir retorno do id após insert com .select('id');
-- - permitir que admin ativo leia e baixe aquisições;
-- - manter runtime Supabase-only sem Firebase/dbService.

alter table public.sales enable row level security;
alter table public.sale_items enable row level security;

grant select, insert, delete on table public.sales to authenticated;
grant select, insert, delete on table public.sale_items to authenticated;

drop policy if exists "sales_select_own_or_admin" on public.sales;
drop policy if exists "sales_insert_own_customer_profile" on public.sales;
drop policy if exists "sales_delete_admin" on public.sales;

drop policy if exists "sale_items_select_own_or_admin" on public.sale_items;
drop policy if exists "sale_items_insert_own_sale" on public.sale_items;
drop policy if exists "sale_items_delete_admin" on public.sale_items;

create policy "sales_select_own_or_admin"
on public.sales
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = sales.customer_profile_id
      and p.auth_user_id = auth.uid()
      and p.status = 'active'
  )
  or exists (
    select 1
    from public.profiles p
    where p.auth_user_id = auth.uid()
      and p.role = 'admin'
      and p.status = 'active'
  )
);

create policy "sales_insert_own_customer_profile"
on public.sales
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = sales.customer_profile_id
      and p.auth_user_id = auth.uid()
      and p.role = 'customer'
      and p.status = 'active'
  )
);

create policy "sales_delete_admin"
on public.sales
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.auth_user_id = auth.uid()
      and p.role = 'admin'
      and p.status = 'active'
  )
);

create policy "sale_items_select_own_or_admin"
on public.sale_items
for select
to authenticated
using (
  exists (
    select 1
    from public.sales s
    join public.profiles p on p.id = s.customer_profile_id
    where s.id = sale_items.sale_id
      and p.auth_user_id = auth.uid()
      and p.status = 'active'
  )
  or exists (
    select 1
    from public.profiles p
    where p.auth_user_id = auth.uid()
      and p.role = 'admin'
      and p.status = 'active'
  )
);

create policy "sale_items_insert_own_sale"
on public.sale_items
for insert
to authenticated
with check (
  exists (
    select 1
    from public.sales s
    join public.profiles p on p.id = s.customer_profile_id
    where s.id = sale_items.sale_id
      and p.auth_user_id = auth.uid()
      and p.role = 'customer'
      and p.status = 'active'
  )
);

create policy "sale_items_delete_admin"
on public.sale_items
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.auth_user_id = auth.uid()
      and p.role = 'admin'
      and p.status = 'active'
  )
);
