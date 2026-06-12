# Cardápio Digital CIICC

Sistema interno de autoatendimento para controle de retirada, pagamento e estoque de produtos em ambiente de trabalho controlado.

O projeto tem como objetivo apoiar a operação de uma bancada compartilhada de quitandas, bolachas, salgadinhos, bebidas, doces e outros produtos, com identificação do comprador, registro da retirada, controle de pagamento, estoque, lotes perecíveis, sobras, descartes e fechamento diário.

## Estado atual

- FASE_0: concluída documentalmente.
- FASE_1: limpeza estrutural, identidade do produto e CI básico.
- MVP funcional: ainda não iniciado.
- Banco alvo: Supabase Postgres.
- Auth alvo: Supabase Auth com Google.
- Deploy alvo: Vercel.
- App alvo: PWA.

## Escopo da Fase 1

Esta fase prepara o repositório para as próximas entregas, sem implementar funcionalidades de negócio.

Incluído nesta fase:

- README real do produto.
- Identidade básica do app.
- .env.example sem segredos reais.
- CI básico com validação de tipos e build.
- Mapeamento do legado Firebase/protótipo.
- Atualização do TASKS.md.

Fora de escopo nesta fase:

- Supabase real.
- Migrations.
- RLS.
- Login Google.
- Telas cliente/admin.
- Carrinho.
- Checkout.
- Estoque.
- Pagamentos.
- Comprovantes.
- PWA/offline real.
- Deploy Vercel real.
- Remoção funcional do Firebase.

## Stack alvo do MVP

- React
- Vite
- TypeScript
- Supabase Postgres
- Supabase Auth com Google
- Supabase Storage
- Vercel
- PWA instalável
- IndexedDB com fila de sincronização offline

## Como executar localmente

Instalar dependências:

    npm install

Criar arquivo local de ambiente a partir do exemplo:

    cp .env.example .env.local

Executar validação de tipos:

    npm run lint

Executar build de produção:

    npm run build

Executar ambiente de desenvolvimento:

    npm run dev

## Variáveis de ambiente

As variáveis esperadas estão documentadas em .env.example.

Nunca versionar .env, .env.local ou segredos reais.

## Legado Firebase

O repositório ainda contém arquivos e fluxos Firebase vindos do protótipo original.

Na Fase 1, esse legado é apenas mapeado e documentado. A remoção do fluxo Firebase ativo pertence à Fase 2, junto com a introdução do Supabase Auth e do cliente Supabase.

## Documentos oficiais

- docs/GOVERNANCE.md
- docs/MVP_ROADMAP_CHECKLIST.md
- TASKS.md
- docs/PRD_MVP.md
- docs/TECHNICAL_ARCHITECTURE_MVP.md
- docs/SUPABASE_DATA_MODEL_MVP.md
- docs/MVP_ACCEPTANCE_CRITERIA.md
