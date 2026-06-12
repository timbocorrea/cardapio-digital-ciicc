# Auditoria — Fase 5: Migrations e RLS inicial de Profiles Supabase

## Estado

FASE_5=EM_ANDAMENTO  
ESCOPO=MIGRATIONS_E_RLS_INICIAL_SUPABASE  
BASE_SEGURA=00e746e  
MVP_FUNCIONAL=NAO_INICIADO  
IMPLEMENTACAO_FUNCIONAL_DE_NEGOCIO=NAO_INICIADA  
FIREBASE_LEGADO_ATIVO=SIM  

## Objetivo

Criar a base inicial de migrations e RLS Supabase para `profiles`, materializando no banco a estrutura que o frontend passou a consumir na Fase 4.

Esta fase nao inicia funcionalidades de venda, carrinho, estoque, pagamento, comprovantes ou dashboard operacional.

## Referencias auditadas

- `docs/GOVERNANCE.md`
- `docs/MVP_ROADMAP_CHECKLIST.md`
- `TASKS.md`
- `docs/PRD_MVP.md`
- `docs/TECHNICAL_ARCHITECTURE_MVP.md`
- `docs/SUPABASE_DATA_MODEL_MVP.md`
- `docs/MVP_ACCEPTANCE_CRITERIA.md`
- `docs/audits/fase-1-legacy-firebase-map.md`
- `docs/audits/fase-2-supabase-auth-foundation.md`
- `docs/audits/fase-3-supabase-google-auth-flow.md`
- `docs/audits/fase-4-supabase-profiles-roles.md`

## Gate pos-Fase 4

- PR #5 confirmada como mergeada.
- Merge commit usado como base segura: `00e746ef232e5ff6a61416bd5ce1309dde264d71`.
- Branch criada: `feat/fase-5-supabase-profiles-migrations-rls`.
- Firebase legado mantido ativo.
- MVP funcional ainda nao iniciado.
- Funcionalidades de negocio ainda nao iniciadas.

## Arquivos criados nesta fase

- `supabase/migrations/20260612180000_create_profiles_rls.sql`
- `docs/audits/fase-5-supabase-profiles-migrations-rls.md`

## Migration criada

A migration `20260612180000_create_profiles_rls.sql` cria a base inicial de `profiles`:

- extensao `pgcrypto` para `gen_random_uuid()`;
- enum `public.user_role` com valores:
  - `customer`;
  - `admin`;
- enum `public.profile_status` com valores:
  - `active`;
  - `inactive`;
  - `blocked`;
- tabela `public.profiles` com vinculo para `auth.users(id)`;
- campo `display_name`, alinhado ao service de frontend criado na Fase 4;
- indices de `auth_user_id`, `email`, `role` e `status`;
- trigger generico `set_updated_at`;
- funcao `is_active_admin()` para uso seguro em RLS;
- trigger de protecao contra elevacao indevida de privilegio;
- RLS habilitada em `profiles`;
- policies minimas para leitura, insert proprio e update proprio/admin.

## Decisao tecnica sobre nome do campo

O modelo documental inicial citava `full_name`, mas o service mergeado na Fase 4 consulta `display_name` em `src/features/auth/supabaseProfileService.ts`.

Para evitar quebra do frontend ja mergeado, a migration da Fase 5 materializa `display_name`.

Essa decisao deve ser mantida ou refletida em revisao documental futura do modelo de dados.

## Policies iniciais

### Leitura

Usuario autenticado pode ler o proprio profile.

Admin ativo pode ler todos os profiles.

### Insert

Usuario autenticado pode criar apenas o proprio profile inicial como:

- `role = customer`;
- `status = active`.

### Update

Usuario autenticado pode atualizar o proprio profile.

Admin ativo pode atualizar profiles.

Alteracoes de `auth_user_id`, `role` ou `status` por usuario nao admin sao bloqueadas por trigger.

### Delete

Nenhuma policy de delete foi criada nesta fase.

## Estrategia segura para primeiro admin

Nenhum e-mail real de admin foi versionado.

O primeiro admin deve ser criado manualmente no banco Supabase por operador autorizado, usando acesso seguro/service_role, apos o usuario realizar login Google e existir um registro em `auth.users`.

Exemplo de operacao a executar fora do repositorio, substituindo valores reais:

```sql
insert into public.profiles (auth_user_id, email, display_name, role, status)
values ('<auth.users.id>', '<admin-email>', '<admin-name>', 'admin', 'active')
on conflict (auth_user_id) do update
set role = 'admin', status = 'active', updated_at = now();
```

## Firebase legado

Firebase permanece como legado ativo nesta fase.

Esta fase nao remove:

- Firebase Auth;
- Firebase Firestore;
- fluxo comprador legado;
- fallback local controlado por PIN;
- persistencias atuais do prototipo.

## Fora de escopo confirmado

- Vendas.
- Carrinho.
- Checkout.
- Estoque.
- Lotes.
- Pagamentos.
- Comprovantes.
- Storage.
- PWA/offline real.
- Dashboard operacional completo.
- Fechamento diario.
- Remocao total do Firebase.
- Migracao completa do comprador.
- Fluxo financeiro.

## Validacoes

- Auditoria documental: OK.
- Branch remota criada a partir de `00e746e`: OK.
- Migration SQL criada: OK.
- `npm run lint`: pendente de execucao local/CI.
- `npm run build`: pendente de execucao local/CI.

Observacao: esta fase altera SQL e documentacao. Nenhum arquivo TypeScript, React ou Firebase foi alterado nesta etapa.

## Riscos remanescentes

- Migration ainda precisa ser aplicada em ambiente Supabase controlado.
- Primeiro admin ainda depende de acao manual segura.
- RLS criada apenas para `profiles`; tabelas de negocio ainda nao foram criadas.
- Fluxo comprador continua dependente do legado Firebase.
- Fallback PIN ainda existe como mecanismo controlado temporario.

## Proximos passos recomendados

1. Atualizar `TASKS.md` com a Fase 5.
2. Abrir PR separada da Fase 5.
3. Validar CI remoto ou execucao local de `npm run lint` e `npm run build`.
4. Revisar migration antes de aplicar no Supabase real.
5. Somente depois iniciar proxima fase de dados de negocio, se aprovada.
