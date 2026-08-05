-- Etapa 4: Assets (arquivos dentro de uma Pasta)

create table if not exists assets (
  id uuid primary key default gen_random_uuid(),
  folder_id uuid not null references folders(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  storage_path text not null,
  mime_type text not null,
  size_bytes bigint not null,
  created_at timestamptz not null default now()
);

alter table assets enable row level security;

create policy "Owners manage their own assets"
  on assets for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- Bucket privado onde os arquivos ficam guardados.
-- Convenção de caminho: {owner_id}/{asset_id}/{nome do arquivo}
insert into storage.buckets (id, name, public)
values ('assets', 'assets', false)
on conflict (id) do nothing;

create policy "Owners manage their own asset files"
  on storage.objects for all
  using (bucket_id = 'assets' and auth.uid()::text = (storage.foldername(name))[1])
  with check (bucket_id = 'assets' and auth.uid()::text = (storage.foldername(name))[1]);
