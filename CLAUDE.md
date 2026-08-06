@AGENTS.md

# Approva

App de aprovação de materiais criativos com clientes. Agências, estúdios e
autônomos sobem os materiais, o cliente aprova por um link — sem e-mail,
sem WhatsApp, sem PDF perdido.

Site no ar: https://aprova-lemon.vercel.app/

## Quem está construindo isso

O dono do produto (idmatheuscardoso) **não é técnico**. Instruções, respostas e
decisões devem ser simples, calmas, uma etapa por vez. **Confirme antes de
decisões importantes** (mudanças de design/branding, merges de PR, qualquer
coisa que altere o que já está no ar) — não decida por conta própria em
pontos que afetam produto ou marca.

## Stack

- Next.js (App Router, TypeScript) + Tailwind CSS v4
- Supabase: auth, banco de dados (Postgres + RLS), storage
- shadcn/ui (ver seção "Design system" abaixo)
- Vercel: deploy (publica automaticamente ao mesclar na branch padrão)
- Resend: envio de e-mail via SMTP customizado no Supabase (template em
  `supabase/templates/`)

### Limitação importante do ambiente

O Claude Code aqui roda num ambiente com rede restrita por padrão — não
acessa Supabase, Vercel, ou a maioria dos domínios externos sem que o dono
do produto libere isso manualmente nas configurações do ambiente (network
access). Duas consequências práticas:

1. **Migrações do banco** (`supabase/migrations/*.sql`) precisam ser rodadas
   manualmente pelo dono do produto no SQL Editor do Supabase — copiar o
   conteúdo do arquivo, colar lá, rodar. Sempre dar esse passo a passo
   depois de criar uma migração nova.
2. **Testes de verdade** (login, upload, etc.) só o dono do produto consegue
   fazer, testando no navegador e reportando o resultado.

## Decisões do MVP (Fase 1) — não mudar sem perguntar

- Só 1 usuário dono por Workspace (sem múltiplos membros de equipe).
- Acesso do cliente é só por link direto, sem login de cliente.
- Sem desenho/anotação em cima da peça, sem múltiplas versões/comparação,
  sem preview de código/site.

## Design system

- **shadcn/ui**, instalado oficialmente via CLI (`components.json` na raiz),
  não copiado à mão. Preset `base-nova`, base **Base UI** (não Radix), cor
  base `neutral`, ícones `lucide-react`.
- **Visual "de fábrica" do shadcn é a escolha deliberada** — o dono do
  produto prefere manter os componentes o mais próximo possível do padrão
  (ex: `Button` usa `rounded-lg`, não pílula) em vez de reskinar. Ao
  adicionar/editar componentes, seguir a skill `shadcn` (`.claude/skills/shadcn`)
  e checar `npx shadcn@latest docs <componente>` antes de usar um componente
  pela primeira vez.
- **Verde é reservado só para o estado "Aprovado"** — não usar como cor
  primária/decorativa em outro lugar. É o token `--approved` /
  `--approved-foreground` em `globals.css` (valores batem com o `green-600`/
  `green-500` do Tailwind). O resto da interface segue neutro (preto/branco/
  cinza) — os tokens padrão do shadcn (`--primary`, `--muted`, etc.).
- **Logo**: componente `Logo` em `src/components/logo.tsx` — círculo verde +
  "Approva" em preto. É a única exceção deliberada à regra do verde acima
  (é a marca, não um estado da interface).
- **Animação/micro-interação**: usar as skills instaladas de Emil Kowalski
  (`.claude/skills/animate`, `find-animation-opportunities`, etc.) — motion
  sutil e só onde faz sentido (feedback de erro, transições de estado),
  nunca decoração gratuita. Token de easing customizado: `--ease-snappy`
  em `globals.css`.
- **Sem componente HTML cru**: nenhum `<button>`/`<input>`/`<label>` à mão
  nas telas do app — sempre os componentes de `src/components/ui/`
  (`Button`, `Input`, `Field`/`FieldGroup`/`FieldLabel`, `Alert`, `Spinner`,
  `Item`/`ItemGroup`, `Empty`, `Card`, `Badge`).
- MCP do shadcn configurado em `.mcp.json` — dá pra buscar/instalar
  componentes direto (`mcp__shadcn__*` ou `npx shadcn@latest add <nome>`),
  desde que o domínio `ui.shadcn.com` esteja liberado na rede do ambiente.

## Estrutura do código

- Rotas em `src/app/` espelham a URL: `workspace/[id]/projeto/[projetoId]/pasta/[pastaId]`.
- Cada rota mantém `page.tsx`, `actions.ts` (server actions) e o(s)
  formulário(s) client component juntos na mesma pasta.
- `src/components/ui/`: componentes shadcn (não editar sem motivo — são a
  base do design system).
- `src/lib/supabase/`: clients Supabase (browser, server, proxy).
- `supabase/migrations/`: uma migração por etapa, sempre com RLS habilitada
  (padrão: dono só vê/mexe no que é dele, via `owner_id = auth.uid()`).

## Roadmap

### Concluído
1. Projeto criado, visual aplicado, deploy no ar.
2. Autenticação (cadastro, confirmação de e-mail, login), Empresa + Workspace.
3. Projetos e Pastas dentro do Workspace.
4. Upload de Assets (imagem/PDF, até 20MB) dentro das Pastas, bucket privado
   no Supabase Storage com URL assinada.
5. Base do shadcn/ui instalada e todo o app (7 telas) migrado para os
   componentes oficiais.
6. Link de aprovação do cliente — tela pública (sem login, `/aprovar/[token]`)
   mostrando os Assets de uma Pasta, com botão de gerar/copiar o link na
   tela da Pasta. Usa tabela `approval_links` + client Supabase com a
   chave secret/service role no servidor pra ler sem sessão de usuário.
7. Ação de aprovar/pedir ajuste por Asset — cada Asset tem `status`
   (pendente/aprovado/ajuste_solicitado) e `feedback`. O cliente aprova ou
   pede ajuste com comentário na tela pública, podendo mudar de ideia
   depois; o dono vê o status e o comentário na tela da Pasta. É aqui que
   o estado "Aprovado" (verde) passa a ser usado de verdade.
9. Painel de status no Workspace — contagem de Assets por status
   (pendente/ajuste pedido/aprovado) no topo da tela do Workspace, somando
   todos os Projetos/Pastas, com lista dos que ainda não foram aprovados
   linkando direto pra Pasta de cada um.

### Em andamento
8. Notificação por e-mail (Resend) quando o cliente aprova ou pede ajuste —
   código pronto (`src/lib/resend.ts`, chamado de `aprovar/[token]/actions.ts`),
   mas a entrega real ainda não funciona: sem domínio verificado no Resend, o
   envio usa o domínio de teste `onboarding@resend.dev`, que provedores como
   Gmail costumam rejeitar. Falta verificar um domínio de verdade no Resend e
   configurar `RESEND_FROM_EMAIL` pra destravar isso.

### Próximos passos (ainda não construído, ordem sugerida)
Nenhum item definido ainda além da Etapa 8 pendente acima — combinar o
próximo passo com o dono do produto.
