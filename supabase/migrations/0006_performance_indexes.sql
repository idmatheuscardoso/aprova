-- Etapa 10: Índices de performance
--
-- As colunas usadas em quase todo filtro (owner_id, para as regras de RLS;
-- workspace_id/project_id/folder_id, para navegar entre Workspace > Projeto >
-- Pasta > Asset) só tinham a chave primária como índice. Com poucos dados
-- isso não pesa, mas cada busca ia varrer a tabela inteira em vez de ir
-- direto ao registro certo. Aqui adicionamos os índices que faltavam.
--
-- (a coluna "token" de approval_links já tinha índice automático, por causa
-- do "unique" na Etapa 5 — não precisa de índice novo.)

create index if not exists companies_owner_id_idx on companies (owner_id);

create index if not exists workspaces_owner_id_idx on workspaces (owner_id);
create index if not exists workspaces_company_id_idx on workspaces (company_id);

create index if not exists projects_owner_id_idx on projects (owner_id);
create index if not exists projects_workspace_id_idx on projects (workspace_id);

create index if not exists folders_owner_id_idx on folders (owner_id);
create index if not exists folders_project_id_idx on folders (project_id);

create index if not exists assets_owner_id_idx on assets (owner_id);
create index if not exists assets_folder_id_idx on assets (folder_id);
create index if not exists assets_status_idx on assets (status);

create index if not exists approval_links_owner_id_idx on approval_links (owner_id);
create index if not exists approval_links_folder_id_idx on approval_links (folder_id);
