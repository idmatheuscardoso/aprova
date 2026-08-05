-- Etapa 2: Empresa e Workspace

create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists workspaces (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

alter table companies enable row level security;
alter table workspaces enable row level security;

create policy "Owners manage their own company"
  on companies for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "Owners manage their own workspaces"
  on workspaces for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);
