-- Etapa 10: Identificação do cliente + registro de decisão

alter table assets
  add column decided_by_name text,
  add column decided_by_email text,
  add column decided_at timestamptz;

-- Sem policy nova: quem grava a decisão é a tela pública de aprovação,
-- que usa a chave secret/service role no servidor (mesma lógica da
-- Etapa 6, o token do link já valida que a Pasta é a certa).
