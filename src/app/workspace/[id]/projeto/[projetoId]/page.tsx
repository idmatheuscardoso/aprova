import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Folder } from "lucide-react";
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
import { sair } from "../../../actions";
import { CriarPastaForm } from "./criar-pasta-form";

export default async function ProjetoPage({
  params,
}: {
  params: Promise<{ id: string; projetoId: string }>;
}) {
  const { id: workspaceId, projetoId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/entrar");
  }

  const [{ data: projeto }, { data: pastas }] = await Promise.all([
    supabase
      .from("projects")
      .select("id, name")
      .eq("id", projetoId)
      .eq("workspace_id", workspaceId)
      .single(),
    supabase
      .from("folders")
      .select("id, name, created_at")
      .eq("project_id", projetoId)
      .order("created_at", { ascending: true }),
  ]);

  if (!projeto) {
    notFound();
  }

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
          <Link
            href={`/workspace/${workspaceId}`}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Voltar para o Workspace
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">{projeto.name}</h1>
        </div>

        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-medium text-muted-foreground">Pastas</h2>

          {pastas && pastas.length > 0 ? (
            <ItemGroup>
              {pastas.map((pasta) => (
                <Item
                  key={pasta.id}
                  variant="outline"
                  className="hover:bg-muted"
                  render={
                    <Link href={`/workspace/${workspaceId}/projeto/${projetoId}/pasta/${pasta.id}`} />
                  }
                >
                  <ItemMedia variant="icon">
                    <Folder />
                  </ItemMedia>
                  <ItemContent>
                    <ItemTitle>{pasta.name}</ItemTitle>
                  </ItemContent>
                </Item>
              ))}
            </ItemGroup>
          ) : (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Folder />
                </EmptyMedia>
                <EmptyTitle>Nenhuma pasta ainda</EmptyTitle>
                <EmptyDescription>
                  Crie a primeira pasta para organizar o conteúdo deste projeto.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </section>

        <section className="flex flex-col gap-4 border-t pt-8">
          <h2 className="text-sm font-medium text-muted-foreground">Nova pasta</h2>
          <CriarPastaForm workspaceId={workspaceId} projectId={projetoId} />
        </section>
      </main>
    </div>
  );
}
