-- Etapa 10 (continuação): Otimiza as políticas de RLS
--
-- O verificador de performance do Supabase apontou que as políticas usavam
-- auth.uid() direto, o que faz o Postgres reavaliar essa checagem linha por
-- linha em vez de uma vez só por consulta. Trocando por (select auth.uid())
-- o comportamento de acesso continua idêntico (mesmo dono, mesmas regras),
-- só a checagem fica mais rápida conforme a base cresce.

alter policy "Owners manage their own company" on companies
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

alter policy "Owners manage their own workspaces" on workspaces
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

alter policy "Owners manage their own projects" on projects
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

alter policy "Owners manage their own folders" on folders
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

alter policy "Owners manage their own assets" on assets
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

alter policy "Owners manage their own approval links" on approval_links
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);
