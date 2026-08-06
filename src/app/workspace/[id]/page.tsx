import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/logo";
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
      <header className="flex items-center justify-between border-b border-border px-6 py-4 sm:px-10">
        <Logo className="text-xl" />
        <form action={sair}>
          <button type="submit" className="text-sm text-muted-foreground hover:text-foreground">
            Sair
          </button>
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
            <ul className="flex flex-col divide-y divide-border rounded-lg border border-border">
              {projetos.map((projeto) => (
                <li key={projeto.id}>
                  <Link
                    href={`/workspace/${id}/projeto/${projeto.id}`}
                    className="block px-4 py-3 hover:bg-border/30"
                  >
                    {projeto.name}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhum projeto ainda.</p>
          )}
        </section>

        <section className="flex flex-col gap-4 border-t border-border pt-8">
          <h2 className="text-sm font-medium text-muted-foreground">Novo projeto</h2>
          <CriarProjetoForm workspaceId={id} />
        </section>
      </main>
    </div>
  );
}
