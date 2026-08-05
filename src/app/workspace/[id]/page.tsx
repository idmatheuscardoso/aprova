import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/logo";
import { sair } from "../actions";

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

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-border px-6 py-4 sm:px-10">
        <Logo className="text-xl" />
        <form action={sair}>
          <button type="submit" className="text-sm text-muted hover:text-foreground">
            Sair
          </button>
        </form>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
        <p className="text-sm text-muted">{empresa?.name}</p>
        <h1 className="text-3xl font-semibold tracking-tight">{workspace.name}</h1>
        <p className="mt-4 max-w-sm text-muted">
          Seu Workspace foi criado. Projetos, Pastas e Assets chegam na próxima
          etapa.
        </p>
      </main>
    </div>
  );
}
