# Fase 1 — Mapeamento do legado Firebase

Data: 2026-06-12  
Fase: FASE_1  
Status: MAPEAMENTO_INICIAL  
Tipo: Auditoria estrutural sem remoção funcional

## Objetivo

Registrar os pontos do protótipo atual que ainda dependem de Firebase/Firestore/Auth, sem remover ou alterar comportamento funcional nesta fase.

## Estado encontrado

O projeto ainda possui fluxo Firebase ativo herdado do protótipo original.

Referências identificadas:

- firebase-applet-config.json
- firestore.rules
- src/firebase.ts
- src/dbService.ts
- src/App.tsx
- src/components/AdminLogin.tsx
- src/components/AdminPanel.tsx
- src/components/CustomerRegistrationGate.tsx
- src/types.ts
- dependência firebase em package.json

## Classificação

- Firebase atual: legado/protótipo.
- Supabase alvo: ainda não implementado.
- Remoção do Firebase: fora de escopo da Fase 1.
- Migração para Supabase Auth/client: prevista para Fase 2.
- Banco Supabase/migrations/RLS/storage: previstos para fases posteriores.

## Riscos

- O app ainda depende de Firebase em runtime.
- O src/firebase.ts registra erros Firestore com dados de autenticação; sanitização completa deve ser revisada em fase funcional própria.
- firebase-applet-config.json deve ser tratado como configuração de protótipo/legado e não como arquitetura alvo.
- A remoção antecipada do Firebase nesta fase poderia quebrar o protótipo antes da entrada controlada do Supabase.

## Decisão da Fase 1

Manter o legado Firebase intacto nesta fase e documentar sua existência.

A substituição deve ocorrer somente em fase específica de autenticação/Supabase, com escopo, validação e rollback claros.
