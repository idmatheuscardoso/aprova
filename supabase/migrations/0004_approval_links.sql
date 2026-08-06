-- Etapa 5: Link de aprovação do cliente (por Pasta)

create table if not exists approval_links (
  id uuid primary key default gen_random_uuid(),
  folder_id uuid not null references folders(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  token text not null unique,
  created_at timestamptz not null default now()
);

alter table approval_links enable row level security;

create policy "Owners manage their own approval links"
  on approval_links for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- Sem policy de select público: a tela pública de aprovação usa a chave
-- service role no servidor (bypassa RLS) para validar o token e buscar
-- os dados, então o token nunca depende de RLS para ficar protegido.
