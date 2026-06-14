-- Fase 18 — Controle real de estoque por produto/lote
-- Objetivo:
-- - adicionar estoque inicial e estoque disponível aos produtos;
-- - permitir que o Controle de Lotes alimente o cardápio;
-- - baixar estoque automaticamente ao registrar aquisição;
-- - remover oferta do cardápio quando o estoque zerar.

alter table public.products
  add column if not exists stock_initial integer not null default 0,
  add column if not exists stock_available integer not null default 0;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'products_stock_initial_non_negative'
  ) then
    alter table public.products
      add constraint products_stock_initial_non_negative check (stock_initial >= 0);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'products_stock_available_non_negative'
  ) then
    alter table public.products
      add constraint products_stock_available_non_negative check (stock_available >= 0);
  end if;
end $$;

create or replace function public.create_sale_with_stock(
  p_customer_profile_id uuid,
  p_customer_name text,
  p_customer_email text,
  p_customer_workplace text,
  p_customer_shift_hours text,
  p_customer_photo_url text,
  p_total_amount numeric,
  p_payment_method text,
  p_payment_proof_url text,
  p_items jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sale_id uuid;
  v_item record;
  v_updated integer;
begin
  if p_payment_method not in ('later', 'pix') then
    raise exception 'Forma de pagamento inválida.';
  end if;

  if not (
    public.is_active_admin()
    or exists (
      select 1
      from public.profiles
      where id = p_customer_profile_id
        and auth_user_id = auth.uid()
        and status = 'active'::public.profile_status
    )
  ) then
    raise exception 'Cliente sem permissão para registrar aquisição.';
  end if;

  insert into public.sales (
    customer_profile_id,
    customer_name,
    customer_email,
    customer_workplace,
    customer_shift_hours,
    customer_photo_url,
    total_amount,
    payment_method,
    payment_proof_url
  )
  values (
    p_customer_profile_id,
    p_customer_name,
    p_customer_email,
    p_customer_workplace,
    p_customer_shift_hours,
    p_customer_photo_url,
    p_total_amount,
    p_payment_method,
    p_payment_proof_url
  )
  returning id into v_sale_id;

  for v_item in
    select *
    from jsonb_to_recordset(p_items) as item(
      product_id uuid,
      name text,
      quantity integer,
      price numeric,
      emoji text
    )
  loop
    if v_item.quantity is null or v_item.quantity <= 0 then
      raise exception 'Quantidade inválida para o produto %.', coalesce(v_item.name, 'sem nome');
    end if;

    if v_item.product_id is not null then
      update public.products
      set
        stock_available = stock_available - v_item.quantity,
        available = case
          when stock_available - v_item.quantity > 0 then available
          else false
        end,
        updated_at = now()
      where id = v_item.product_id
        and available = true
        and stock_available >= v_item.quantity;

      get diagnostics v_updated = row_count;

      if v_updated = 0 then
        raise exception 'Estoque insuficiente ou produto indisponível: %.', coalesce(v_item.name, v_item.product_id::text);
      end if;
    end if;

    insert into public.sale_items (
      sale_id,
      product_id,
      name,
      quantity,
      price,
      emoji
    )
    values (
      v_sale_id,
      v_item.product_id,
      coalesce(v_item.name, 'Produto'),
      v_item.quantity,
      coalesce(v_item.price, 0),
      coalesce(v_item.emoji, '🍽️')
    );
  end loop;

  return v_sale_id;
end;
$$;

grant execute on function public.create_sale_with_stock(
  uuid,
  text,
  text,
  text,
  text,
  text,
  numeric,
  text,
  text,
  jsonb
) to authenticated;

comment on column public.products.stock_initial is
  'Quantidade inicial informada no Controle de Lotes.';

comment on column public.products.stock_available is
  'Quantidade disponível atual para oferta no cardápio.';
