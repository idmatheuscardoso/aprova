import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/logo";
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

  const { data: projeto } = await supabase
    .from("projects")
    .select("id, name")
    .eq("id", projetoId)
    .eq("workspace_id", workspaceId)
    .single();

  if (!projeto) {
    notFound();
  }

  const { data: pastas } = await supabase
    .from("folders")
    .select("id, name, created_at")
    .eq("project_id", projetoId)
    .order("created_at", { ascending: true });

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

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-10 px-6 py-12">
        <div>
          <Link
            href={`/workspace/${workspaceId}`}
            className="text-sm text-muted hover:text-foreground"
          >
            ← Voltar para o Workspace
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">{projeto.name}</h1>
        </div>

        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-medium text-muted">Pastas</h2>

          {pastas && pastas.length > 0 ? (
            <ul className="flex flex-col divide-y divide-border rounded-lg border border-border">
              {pastas.map((pasta) => (
                <li key={pasta.id}>
                  <Link
                    href={`/workspace/${workspaceId}/projeto/${projetoId}/pasta/${pasta.id}`}
                    className="block px-4 py-3 hover:bg-border/30"
                  >
                    {pasta.name}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">Nenhuma pasta ainda.</p>
          )}
        </section>

        <section className="flex flex-col gap-4 border-t border-border pt-8">
          <h2 className="text-sm font-medium text-muted">Nova pasta</h2>
          <CriarPastaForm workspaceId={workspaceId} projectId={projetoId} />
        </section>
      </main>
    </div>
  );
}
