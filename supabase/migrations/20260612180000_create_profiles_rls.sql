-- Fase 5 — Supabase profiles, roles e RLS inicial
-- Projeto: Cardapio Digital CIICC
-- Escopo: materializar no banco a estrutura minima de profiles consumida pelo frontend.
-- Fora de escopo: vendas, carrinho, estoque, pagamentos, comprovantes, Storage e remocao do Firebase.

create extension if not exists pgcrypto;

do $$
begin
  create type public.user_role as enum ('customer', 'admin');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.profile_status as enum ('active', 'inactive', 'blocked');
exception
  when duplicate_object then null;
end
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null references auth.users(id) on delete cascade,
  display_name text,
  email text not null,
  avatar_url text,
  role public.user_role not null default 'customer'::public.user_role,
  status public.profile_status not null default 'active'::public.profile_status,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_email_not_blank check (length(trim(email)) > 0)
);

create unique index if not exists profiles_auth_user_id_idx
  on public.profiles (auth_user_id);

create unique index if not exists profiles_email_idx
  on public.profiles (lower(email));

create index if not exists profiles_role_idx
  on public.profiles (role);

create index if not exists profiles_status_idx
  on public.profiles (status);

create or replace function public.is_active_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where auth_user_id = auth.uid()
      and role = 'admin'::public.user_role
      and status = 'active'::public.profile_status
  );
$$;

create or replace function public.prevent_profile_privilege_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return new;
  end if;

  if public.is_active_admin() then
    return new;
  end if;

  if old.auth_user_id is distinct from new.auth_user_id
    or old.role is distinct from new.role
    or old.status is distinct from new.status
  then
    raise exception 'Only active admins can change profile auth_user_id, role or status';
  end if;

  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

drop trigger if exists prevent_profile_privilege_escalation on public.profiles;
create trigger prevent_profile_privilege_escalation
before update on public.profiles
for each row
execute function public.prevent_profile_privilege_escalation();

alter table public.profiles enable row level security;

drop policy if exists profiles_select_own_or_admin on public.profiles;
create policy profiles_select_own_or_admin
on public.profiles
for select
to authenticated
using (
  auth_user_id = auth.uid()
  or public.is_active_admin()
);

drop policy if exists profiles_insert_self_customer on public.profiles;
create policy profiles_insert_self_customer
on public.profiles
for insert
to authenticated
with check (
  auth_user_id = auth.uid()
  and role = 'customer'::public.user_role
  and status = 'active'::public.profile_status
);

drop policy if exists profiles_update_own_limited_or_admin on public.profiles;
create policy profiles_update_own_limited_or_admin
on public.profiles
for update
to authenticated
using (
  auth_user_id = auth.uid()
  or public.is_active_admin()
)
with check (
  auth_user_id = auth.uid()
  or public.is_active_admin()
);

revoke all on public.profiles from anon;
grant select, insert, update on public.profiles to authenticated;
grant usage on type public.user_role to authenticated;
grant usage on type public.profile_status to authenticated;
grant execute on function public.is_active_admin() to authenticated;

comment on table public.profiles is 'Perfis Supabase do Cardapio Digital CIICC: vinculo com auth.users, role e status.';
comment on column public.profiles.auth_user_id is 'Referencia ao usuario autenticado no Supabase Auth.';
comment on column public.profiles.display_name is 'Nome de exibicao consumido pelo frontend da Fase 4.';
comment on column public.profiles.role is 'Role operacional: customer ou admin.';
comment on column public.profiles.status is 'Status de acesso: active, inactive ou blocked.';

-- Estrategia de primeiro admin:
-- 1. O usuario realiza login Google via Supabase Auth.
-- 2. Um operador com acesso seguro/service_role cria ou atualiza manualmente public.profiles.
-- 3. Nenhum e-mail real de admin e versionado neste repositorio.
-- 4. Exemplo seguro para executar fora do repositorio, substituindo valores:
--
-- insert into public.profiles (auth_user_id, email, display_name, role, status)
-- values ('<auth.users.id>', '<admin-email>', '<admin-name>', 'admin', 'active')
-- on conflict (auth_user_id) do update
-- set role = 'admin', status = 'active', updated_at = now();
