"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { enviarEmail } from "@/lib/resend";

function escaparHtml(texto: string) {
  return texto
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function contextoDoToken(token: string) {
  const supabase = createAdminClient();
  const { data: link } = await supabase
    .from("approval_links")
    .select("folder_id")
    .eq("token", token)
    .maybeSingle();

  if (!link) return null;

  const { data: pasta } = await supabase
    .from("folders")
    .select("id, name, owner_id, project_id, projects(id, name, workspace_id)")
    .eq("id", link.folder_id)
    .maybeSingle();

  if (!pasta) return null;

  const projeto = Array.isArray(pasta.projects) ? pasta.projects[0] : pasta.projects;

  return {
    folderId: pasta.id,
    folderName: pasta.name,
    ownerId: pasta.owner_id,
    projectId: projeto?.id ?? null,
    projectName: projeto?.name ?? null,
    workspaceId: projeto?.workspace_id ?? null,
  };
}

async function notificarDono({
  ownerId,
  assunto,
  linhas,
  workspaceId,
  projectId,
  folderId,
}: {
  ownerId: string;
  assunto: string;
  linhas: string[];
  workspaceId: string | null;
  projectId: string | null;
  folderId: string;
}) {
  const supabase = createAdminClient();
  const { data } = await supabase.auth.admin.getUserById(ownerId);
  const email = data.user?.email;
  if (!email) return;

  const headersList = await headers();
  const origem = `${headersList.get("x-forwarded-proto") ?? "https"}://${headersList.get("host")}`;
  const linkPasta =
    workspaceId && projectId
      ? `${origem}/workspace/${workspaceId}/projeto/${projectId}/pasta/${folderId}`
      : origem;

  const html = `
    ${linhas.map((linha) => `<p>${linha}</p>`).join("")}
    <p><a href="${linkPasta}">Ver na Approva</a></p>
  `;

  await enviarEmail({ to: email, subject: assunto, html });
}

export async function aprovarAsset(token: string, assetId: string) {
  const contexto = await contextoDoToken(token);
  if (!contexto) return;

  const supabase = createAdminClient();
  const { data: asset } = await supabase
    .from("assets")
    .update({ status: "aprovado", feedback: null })
    .eq("id", assetId)
    .eq("folder_id", contexto.folderId)
    .select("name")
    .maybeSingle();

  if (asset) {
    await notificarDono({
      ownerId: contexto.ownerId,
      assunto: `Aprovado: ${asset.name}`,
      linhas: [
        `O cliente aprovou o arquivo <strong>${escaparHtml(asset.name)}</strong> na pasta ${escaparHtml(contexto.folderName)}.`,
      ],
      workspaceId: contexto.workspaceId,
      projectId: contexto.projectId,
      folderId: contexto.folderId,
    });
  }

  revalidatePath(`/aprovar/${token}`);
}

export type PedirAjusteState = { error?: string } | undefined;

export async function pedirAjusteAsset(
  token: string,
  assetId: string,
  _prevState: PedirAjusteState,
  formData: FormData,
): Promise<PedirAjusteState> {
  const feedback = formData.get("feedback");

  if (typeof feedback !== "string" || feedback.trim() === "") {
    return { error: "Escreva o que precisa mudar." };
  }

  const contexto = await contextoDoToken(token);
  if (!contexto) {
    return { error: "Link inválido." };
  }

  const supabase = createAdminClient();
  const { data: asset } = await supabase
    .from("assets")
    .update({ status: "ajuste_solicitado", feedback: feedback.trim() })
    .eq("id", assetId)
    .eq("folder_id", contexto.folderId)
    .select("name")
    .maybeSingle();

  if (asset) {
    await notificarDono({
      ownerId: contexto.ownerId,
      assunto: `Ajuste pedido: ${asset.name}`,
      linhas: [
        `O cliente pediu um ajuste no arquivo <strong>${escaparHtml(asset.name)}</strong> na pasta ${escaparHtml(contexto.folderName)}:`,
        escaparHtml(feedback.trim()),
      ],
      workspaceId: contexto.workspaceId,
      projectId: contexto.projectId,
      folderId: contexto.folderId,
    });
  }

  revalidatePath(`/aprovar/${token}`);
}
