import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { carregarArquivo } from "@/lib/visualizador-dados";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Visualizador } from "@/components/visualizador/visualizador";
import { sair } from "@/app/workspace/actions";
import { comentarComoDono, resolverComentario } from "./actions";

export default async function ArquivoDoDonoPage({
  params,
}: {
  params: Promise<{
    id: string;
    projetoId: string;
    pastaId: string;
    assetId: string;
  }>;
}) {
  const { id: workspaceId, projetoId, pastaId, assetId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/entrar");
  }

  const { data: pasta } = await supabase
    .from("folders")
    .select("id, name, project_id, projects(id, workspace_id)")
    .eq("id", pastaId)
    .eq("project_id", projetoId)
    .maybeSingle();

  const projeto = Array.isArray(pasta?.projects) ? pasta.projects[0] : pasta?.projects;

  if (!pasta || !projeto || projeto.workspace_id !== workspaceId) {
    notFound();
  }

  const dados = await carregarArquivo(supabase, { assetId, folderId: pastaId });
  if (!dados) {
    notFound();
  }

  const contexto = { workspaceId, projetoId, pastaId, assetId };

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

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 py-8">
        <Visualizador
          arquivo={dados.arquivo}
          comentarios={dados.comentarios}
          papel="dono"
          autor={null}
          podeComentar
          voltarHref={`/workspace/${workspaceId}/projeto/${projetoId}/pasta/${pastaId}`}
          voltarRotulo={`Voltar para ${pasta.name}`}
          decisao={dados.decisao}
          comentar={comentarComoDono.bind(null, contexto)}
          resolver={resolverComentario.bind(null, contexto)}
        />
      </main>
    </div>
  );
}
