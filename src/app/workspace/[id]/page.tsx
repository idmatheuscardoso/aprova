import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { FolderKanban } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Item, ItemContent, ItemGroup, ItemMedia, ItemTitle } from "@/components/ui/item";
import { sair } from "../actions";
import { CriarProjetoForm } from "./criar-projeto-form";

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
