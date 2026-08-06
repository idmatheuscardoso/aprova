-- Etapa 6: Ação de aprovar/pedir ajuste por Asset

alter table assets
  add column status text not null default 'pendente'
    check (status in ('pendente', 'aprovado', 'ajuste_solicitado')),
  add column feedback text;

-- Sem policy nova: quem edita o status é a tela pública de aprovação,
-- que usa a chave secret/service role no servidor (mesma lógica da
-- Etapa 5, o token do link já valida que a Pasta é a certa).
