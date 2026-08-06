"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { validarTexto } from "@/lib/comentarios";
import type { ComentarioState } from "@/components/visualizador/tipos";

export type ContextoDoArquivo = {
  workspaceId: string;
  projetoId: string;
  pastaId: string;
  assetId: string;
};

function caminhoDoArquivo(contexto: ContextoDoArquivo) {
  return `/workspace/${contexto.workspaceId}/projeto/${contexto.projetoId}/pasta/${contexto.pastaId}/arquivo/${contexto.assetId}`;
}

/**
 * Revalida as telas do dono e também o link público do cliente, para a
 * resposta aparecer para ele sem precisar esperar o cache expirar.
 */
async function revalidar(contexto: ContextoDoArquivo) {
  const pasta = `/workspace/${contexto.workspaceId}/projeto/${contexto.projetoId}/pasta/${contexto.pastaId}`;
  revalidatePath(caminhoDoArquivo(contexto));
  revalidatePath(pasta);

  const { data: link } = await createAdminClient()
    .from("approval_links")
    .select("token")
    .eq("folder_id", contexto.pastaId)
    .maybeSingle();

  if (link) {
    revalidatePath(`/aprovar/${link.token}`);
    revalidatePath(`/aprovar/${link.token}/arquivo/${contexto.assetId}`);
  }
}

/** Nome com que o dono aparece para o cliente: a Empresa, não o e-mail. */
async function nomeDaEquipe(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  emailDaConta: string | undefined,
) {
  const { data: empresa } = await supabase
    .from("companies")
    .select("name")
    .eq("owner_id", userId)
    .maybeSingle();

  return empresa?.name ?? emailDaConta ?? "Equipe";
}

export async function comentarComoDono(
  contexto: ContextoDoArquivo,
  _prevState: ComentarioState,
  formData: FormData,
): Promise<ComentarioState> {
  const texto = validarTexto(formData.get("texto"));
  if ("erro" in texto) return { erro: texto.erro };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erro: "Faça login de novo para responder." };

  // A RLS já garante que o asset é do dono logado; o filtro por pasta mantém
  // a URL coerente com o registro.
  const { data: asset } = await supabase
    .from("assets")
    .select("id")
    .eq("id", contexto.assetId)
    .eq("folder_id", contexto.pastaId)
    .maybeSingle();

  if (!asset) return { erro: "Arquivo não encontrado." };

  const parentId = formData.get("parent_id");
  let paiId: string | null = null;

  if (typeof parentId === "string" && parentId !== "") {
    const { data: pai } = await supabase
      .from("comments")
      .select("id")
      .eq("id", parentId)
      .eq("asset_id", contexto.assetId)
      .is("parent_id", null)
      .maybeSingle();

    if (!pai) return { erro: "Comentário não encontrado." };
    paiId = pai.id;
  }

  const { error } = await supabase.from("comments").insert({
    asset_id: contexto.assetId,
    owner_id: user.id,
    parent_id: paiId,
    author_role: "dono",
    author_name: await nomeDaEquipe(supabase, user.id, user.email),
    author_email: user.email ?? null,
    body: texto.texto,
  });

  if (error) return { erro: "Não foi possível salvar a resposta." };

  await revalidar(contexto);
}

export async function resolverComentario(
  contexto: ContextoDoArquivo,
  formData: FormData,
) {
  const comentarioId = formData.get("comentario_id");
  if (typeof comentarioId !== "string" || comentarioId === "") return;

  const resolvido = formData.get("resolvido") === "1";

  const supabase = await createClient();
  await supabase
    .from("comments")
    .update({ resolved_at: resolvido ? new Date().toISOString() : null })
    .eq("id", comentarioId)
    .eq("asset_id", contexto.assetId);

  await revalidar(contexto);
}
