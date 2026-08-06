import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { enviarEmail } from "@/lib/resend";

export function escaparHtml(texto: string) {
  return texto
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export type ContextoDoToken = {
  folderId: string;
  folderName: string;
  ownerId: string;
  projectId: string | null;
  projectName: string | null;
  workspaceId: string | null;
};

export async function contextoDoToken(
  token: string,
): Promise<ContextoDoToken | null> {
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

/**
 * Caminho da Pasta na área logada. Devolve null quando o Projeto ou o
 * Workspace não puderam ser resolvidos, para o chamador decidir o que fazer.
 */
export function caminhoDaPasta({
  workspaceId,
  projectId,
  folderId,
}: {
  workspaceId: string | null;
  projectId: string | null;
  folderId: string;
}) {
  if (!workspaceId || !projectId) return null;
  return `/workspace/${workspaceId}/projeto/${projectId}/pasta/${folderId}`;
}

export async function notificarDono({
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
  const caminho = caminhoDaPasta({ workspaceId, projectId, folderId });
  const linkPasta = caminho ? `${origem}${caminho}` : origem;

  const html = `
    ${linhas.map((linha) => `<p>${linha}</p>`).join("")}
    <p><a href="${linkPasta}">Ver na Approva</a></p>
  `;

  await enviarEmail({ to: email, subject: assunto, html });
}

/**
 * Nome com que o dono aparece para o cliente nos comentários: o nome da
 * Empresa, não o e-mail pessoal da conta.
 */
export async function nomeDoDono(ownerId: string) {
  const supabase = createAdminClient();

  const { data: empresa } = await supabase
    .from("companies")
    .select("name")
    .eq("owner_id", ownerId)
    .maybeSingle();

  if (empresa?.name) return empresa.name;

  const { data } = await supabase.auth.admin.getUserById(ownerId);
  return data.user?.email ?? "Equipe";
}
