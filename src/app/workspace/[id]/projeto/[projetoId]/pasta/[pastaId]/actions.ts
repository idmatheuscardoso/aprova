"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type EnviarAssetState = { error?: string } | undefined;

const TAMANHO_MAXIMO_BYTES = 20 * 1024 * 1024; // 20MB

function tipoPermitido(tipo: string) {
  return tipo.startsWith("image/") || tipo === "application/pdf";
}

export async function enviarAsset(
  workspaceId: string,
  projectId: string,
  folderId: string,
  _prevState: EnviarAssetState,
  formData: FormData,
): Promise<EnviarAssetState> {
  const arquivo = formData.get("arquivo");

  if (!(arquivo instanceof File) || arquivo.size === 0) {
    return { error: "Escolha um arquivo." };
  }

  if (!tipoPermitido(arquivo.type)) {
    return { error: "Envie apenas imagens ou PDF." };
  }

  if (arquivo.size > TAMANHO_MAXIMO_BYTES) {
    return { error: "Arquivo muito grande. Limite de 20MB." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/entrar");
  }

  const { data: pasta } = await supabase
    .from("folders")
    .select("id")
    .eq("id", folderId)
    .eq("owner_id", user.id)
    .single();

  if (!pasta) {
    return { error: "Pasta não encontrada." };
  }

  const assetId = crypto.randomUUID();
  const caminho = `${user.id}/${assetId}/${arquivo.name}`;

  const { error: erroUpload } = await supabase.storage
    .from("assets")
    .upload(caminho, arquivo, { contentType: arquivo.type });

  if (erroUpload) {
    return { error: erroUpload.message };
  }

  const { error: erroInsert } = await supabase.from("assets").insert({
    id: assetId,
    folder_id: folderId,
    owner_id: user.id,
    name: arquivo.name,
    storage_path: caminho,
    mime_type: arquivo.type,
    size_bytes: arquivo.size,
  });

  if (erroInsert) {
    return { error: erroInsert.message };
  }

  redirect(`/workspace/${workspaceId}/projeto/${projectId}/pasta/${folderId}`);
}
