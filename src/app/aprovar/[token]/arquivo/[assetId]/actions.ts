"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  caminhoDaPasta,
  contextoDoToken,
  escaparHtml,
  notificarDono,
  type ContextoDoToken,
} from "@/lib/aprovacao";
import { validarAncora, validarTexto } from "@/lib/comentarios";
import type { ComentarioState } from "@/components/visualizador/tipos";

/**
 * Revalida as duas telas do cliente e também a tela do dono — sem isso o
 * comentário recém-criado ficaria escondido atrás do cache de rota do dono.
 * Sempre com caminho concreto: revalidar o padrão `[token]` derrubaria o
 * cache dos links de todos os clientes.
 */
function revalidar(token: string, assetId: string, contexto: ContextoDoToken) {
  revalidatePath(`/aprovar/${token}/arquivo/${assetId}`);
  revalidatePath(`/aprovar/${token}`);

  const pasta = caminhoDaPasta(contexto);
  if (pasta) {
    revalidatePath(`${pasta}/arquivo/${assetId}`);
    revalidatePath(pasta);
  }
}

function dadosDoRevisor(formData: FormData) {
  const nome = formData.get("revisor_nome");
  const email = formData.get("revisor_email");
  return {
    nome: typeof nome === "string" && nome.trim() !== "" ? nome.trim() : null,
    email: typeof email === "string" && email.trim() !== "" ? email.trim() : null,
  };
}

/**
 * Carrega o asset **filtrando pela pasta do token**. É o que impede um token
 * de uma pasta comentar num arquivo de outra.
 */
async function assetDoToken(contexto: ContextoDoToken, assetId: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("assets")
    .select("id, name, owner_id")
    .eq("id", assetId)
    .eq("folder_id", contexto.folderId)
    .maybeSingle();
  return data;
}

export async function comentarAsset(
  token: string,
  assetId: string,
  _prevState: ComentarioState,
  formData: FormData,
): Promise<ComentarioState> {
  const texto = validarTexto(formData.get("texto"));
  if ("erro" in texto) return { erro: texto.erro };

  const revisor = dadosDoRevisor(formData);
  if (!revisor.nome) {
    return { erro: "Preencha seu nome antes de comentar." };
  }

  const contexto = await contextoDoToken(token);
  if (!contexto) return { erro: "Link inválido." };

  const asset = await assetDoToken(contexto, assetId);
  if (!asset) return { erro: "Arquivo não encontrado." };

  const supabase = createAdminClient();
  const parentId = formData.get("parent_id");
  let paiId: string | null = null;

  if (typeof parentId === "string" && parentId !== "") {
    // A resposta só pode pendurar num comentário do mesmo arquivo.
    const { data: pai } = await supabase
      .from("comments")
      .select("id")
      .eq("id", parentId)
      .eq("asset_id", assetId)
      .is("parent_id", null)
      .maybeSingle();

    if (!pai) return { erro: "Comentário não encontrado." };
    paiId = pai.id;
  }

  const ancora = paiId ? null : validarAncora(
    formData.get("ancora_x"),
    formData.get("ancora_y"),
  );

  const { error } = await supabase.from("comments").insert({
    asset_id: assetId,
    // Vem sempre da linha do asset, nunca do formulário.
    owner_id: asset.owner_id,
    parent_id: paiId,
    author_role: "cliente",
    author_name: revisor.nome,
    author_email: revisor.email,
    body: texto.texto,
    anchor_x: ancora?.x ?? null,
    anchor_y: ancora?.y ?? null,
  });

  if (error) return { erro: "Não foi possível salvar o comentário." };

  revalidar(token, assetId, contexto);
}

export async function pedirAjusteAsset(
  token: string,
  assetId: string,
  _prevState: ComentarioState,
  formData: FormData,
): Promise<ComentarioState> {
  const revisor = dadosDoRevisor(formData);
  if (!revisor.nome) {
    return { erro: "Preencha seu nome antes de decidir." };
  }

  const contexto = await contextoDoToken(token);
  if (!contexto) return { erro: "Link inválido." };

  const asset = await assetDoToken(contexto, assetId);
  if (!asset) return { erro: "Arquivo não encontrado." };

  const supabase = createAdminClient();

  const { data: comentarios } = await supabase
    .from("comments")
    .select("body")
    .eq("asset_id", assetId)
    .eq("author_role", "cliente")
    .order("created_at", { ascending: true });

  if (!comentarios || comentarios.length === 0) {
    return {
      erro: "Escreva pelo menos um comentário dizendo o que precisa mudar.",
    };
  }

  await supabase
    .from("assets")
    .update({
      status: "ajuste_solicitado",
      decided_by_name: revisor.nome,
      decided_by_email: revisor.email,
      decided_at: new Date().toISOString(),
    })
    .eq("id", assetId)
    .eq("folder_id", contexto.folderId);

  await notificarDono({
    ownerId: contexto.ownerId,
    assunto: `Ajuste pedido: ${asset.name}`,
    linhas: [
      `<strong>${escaparHtml(revisor.nome)}</strong> pediu ajuste no arquivo <strong>${escaparHtml(asset.name)}</strong> na pasta ${escaparHtml(contexto.folderName)}:`,
      ...comentarios.map((comentario) => `• ${escaparHtml(comentario.body)}`),
    ],
    workspaceId: contexto.workspaceId,
    projectId: contexto.projectId,
    folderId: contexto.folderId,
  });

  revalidar(token, assetId, contexto);
}
