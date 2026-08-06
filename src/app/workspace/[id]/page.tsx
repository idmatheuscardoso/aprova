import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { FolderKanban } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { AssetStatusBadge, type AssetStatus } from "@/components/asset-status-badge";
import { sair } from "../actions";
import { CriarProjetoForm } from "./criar-projeto-form";

type AssetComContexto = {
  id: string;
  name: string;
  status: AssetStatus;
  folders: {
    id: string;
    name: string;
    project_id: string;
    projects: { id: string; name: string; workspace_id: string } | { id: string; name: string; workspace_id: string }[];
  } | null;
};

export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/entrar");
  }

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id, name, created_at, companies(name)")
    .eq("id", id)
    .single();

  if (!workspace) {
    notFound();
  }

  const empresa = Array.isArray(workspace.companies)
    ? workspace.companies[0]
    : workspace.companies;

  const { data: projetos } = await supabase
    .from("projects")
    .select("id, name, created_at")
    .eq("workspace_id", id)
    .order("created_at", { ascending: true });

  const { data: assets } = (await supabase
    .from("assets")
    .select(
      "id, name, status, folders!inner(id, name, project_id, projects!inner(id, name, workspace_id))",
    )
    .eq("folders.projects.workspace_id", id)) as { data: AssetComContexto[] | null };

  const contagem = { pendente: 0, aprovado: 0, ajuste_solicitado: 0 };
  for (const asset of assets ?? []) {
    contagem[asset.status]++;
  }

  const pendencias = (assets ?? []).filter((asset) => asset.status !== "aprovado");

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b px-6 py-4 sm:px-10">
        <Logo className="text-xl" />
        <form action={sair}>
          <Button type="submit" variant="ghost" size="sm">
            Sair
          </Button>
        </form>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-10 px-6 py-12">
        <div>
          <p className="text-sm text-muted-foreground">{empresa?.name}</p>
          <h1 className="text-2xl font-semibold tracking-tight">{workspace.name}</h1>
        </div>

        {assets && assets.length > 0 && (
          <section className="flex flex-col gap-4">
            <h2 className="text-sm font-medium text-muted-foreground">Status</h2>

            <div className="grid grid-cols-3 gap-3">
              <Card size="sm">
                <CardContent className="flex flex-col gap-1">
                  <span className="text-2xl font-semibold tracking-tight">
                    {contagem.pendente}
                  </span>
                  <span className="text-sm text-muted-foreground">Pendente</span>
                </CardContent>
              </Card>
              <Card size="sm">
                <CardContent className="flex flex-col gap-1">
                  <span className="text-2xl font-semibold tracking-tight">
                    {contagem.ajuste_solicitado}
                  </span>
                  <span className="text-sm text-muted-foreground">Ajuste pedido</span>
                </CardContent>
              </Card>
              <Card size="sm">
                <CardContent className="flex flex-col gap-1">
                  <span className="text-2xl font-semibold tracking-tight text-approved">
                    {contagem.aprovado}
                  </span>
                  <span className="text-sm text-muted-foreground">Aprovado</span>
                </CardContent>
              </Card>
            </div>

            {pendencias.length > 0 && (
              <ItemGroup>
                {pendencias.map((asset) => {
                  const pasta = asset.folders;
                  const projeto = pasta
                    ? Array.isArray(pasta.projects)
                      ? pasta.projects[0]
                      : pasta.projects
                    : null;

                  if (!pasta || !projeto) return null;

                  return (
                    <Item
                      key={asset.id}
                      variant="outline"
                      className="hover:bg-muted"
                      render={
                        <Link
                          href={`/workspace/${id}/projeto/${projeto.id}/pasta/${pasta.id}`}
                        />
                      }
                    >
                      <ItemContent>
                        <ItemTitle>{asset.name}</ItemTitle>
                        <ItemDescription>
                          {projeto.name} / {pasta.name}
                        </ItemDescription>
                      </ItemContent>
                      <ItemActions>
                        <AssetStatusBadge status={asset.status} />
                      </ItemActions>
                    </Item>
                  );
                })}
              </ItemGroup>
            )}
          </section>
        )}

        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-medium text-muted-foreground">Projetos</h2>

          {projetos && projetos.length > 0 ? (
            <ItemGroup>
              {projetos.map((projeto) => (
                <Item
                  key={projeto.id}
                  variant="outline"
                  className="hover:bg-muted"
                  render={<Link href={`/workspace/${id}/projeto/${projeto.id}`} />}
                >
                  <ItemMedia variant="icon">
                    <FolderKanban />
                  </ItemMedia>
                  <ItemContent>
                    <ItemTitle>{projeto.name}</ItemTitle>
                  </ItemContent>
                </Item>
              ))}
            </ItemGroup>
          ) : (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <FolderKanban />
                </EmptyMedia>
                <EmptyTitle>Nenhum projeto ainda</EmptyTitle>
                <EmptyDescription>
                  Crie o primeiro projeto para organizar o conteúdo do seu cliente.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </section>

        <section className="flex flex-col gap-4 border-t pt-8">
          <h2 className="text-sm font-medium text-muted-foreground">Novo projeto</h2>
          <CriarProjetoForm workspaceId={id} />
        </section>
      </main>
    </div>
  );
}
