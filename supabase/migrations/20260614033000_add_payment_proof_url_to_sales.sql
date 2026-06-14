-- Fase 14 — Persistir comprovante PIX no histórico administrativo
-- Objetivo:
-- - registrar o link público do comprovante PIX em sales;
-- - permitir que o painel Admin exiba o comprovante associado à aquisição;
-- - preservar compras de acerto posterior com valor nulo.

alter table public.sales
  add column if not exists payment_proof_url text;

comment on column public.sales.payment_proof_url is
  'Link público do comprovante PIX enviado pelo cliente, quando aplicável.';
