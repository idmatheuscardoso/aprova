"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  caminhoDaPasta,
  contextoDoToken,
  escaparHtml,
  notificarDono,
} from "@/lib/aprovacao";

export async function aprovarAsset(
  token: string,
  assetId: string,
  formData: FormData,
) {
  const nome = formData.get("revisor_nome");
  const email = formData.get("revisor_email");
  if (typeof nome !== "string" || nome.trim() === "") return;

  const contexto = await contextoDoToken(token);
  if (!contexto) return;

  const supabase = createAdminClient();
  const { data: asset } = await supabase
    .from("assets")
    .update({
      status: "aprovado",
      // O campo `feedback` não é mais tocado: virou dado legado (o feedback
      // de antes da Etapa 12) que o dono ainda quer poder consultar.
      decided_by_name: nome.trim(),
      decided_by_email:
        typeof email === "string" && email.trim() !== "" ? email.trim() : null,
      decided_at: new Date().toISOString(),
    })
    .eq("id", assetId)
    .eq("folder_id", contexto.folderId)
    .select("name")
    .maybeSingle();

  if (asset) {
    await notificarDono({
      ownerId: contexto.ownerId,
      assunto: `Aprovado: ${asset.name}`,
      linhas: [
        `<strong>${escaparHtml(nome.trim())}</strong> aprovou o arquivo <strong>${escaparHtml(asset.name)}</strong> na pasta ${escaparHtml(contexto.folderName)}.`,
      ],
      workspaceId: contexto.workspaceId,
      projectId: contexto.projectId,
      folderId: contexto.folderId,
    });
  }

  revalidatePath(`/aprovar/${token}`);
  revalidatePath(`/aprovar/${token}/arquivo/${assetId}`);

  const pasta = caminhoDaPasta(contexto);
  if (pasta) {
    revalidatePath(pasta);
    revalidatePath(`${pasta}/arquivo/${assetId}`);
  }
}
