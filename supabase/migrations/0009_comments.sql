-- Etapa 12: Comentários na peça (com âncora) e respostas do dono

create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references assets(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  parent_id uuid references comments(id) on delete cascade,
  author_role text not null check (author_role in ('cliente', 'dono')),
  author_name text not null,
  author_email text,
  body text not null check (btrim(body) <> '' and char_length(body) <= 2000),
  anchor_x real check (anchor_x >= 0 and anchor_x <= 1),
  anchor_y real check (anchor_y >= 0 and anchor_y <= 1),
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  constraint comments_ancora_completa
    check ((anchor_x is null) = (anchor_y is null)),
  constraint comments_resposta_sem_ancora
    check (parent_id is null or anchor_x is null)
);

alter table comments enable row level security;

-- O cliente escreve pela tela pública, que usa a chave secret/service role
-- no servidor (bypassa RLS) depois de validar o token do link — mesma lógica
-- das Etapas 5, 6 e 10. A policy abaixo existe para o dono, que lê e
-- responde pela área logada, sujeito a RLS.
create policy "Owners manage their own comments"
  on comments for all
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

create index if not exists comments_asset_id_idx on comments (asset_id);
create index if not exists comments_owner_id_idx on comments (owner_id);
create index if not exists comments_parent_id_idx on comments (parent_id);
