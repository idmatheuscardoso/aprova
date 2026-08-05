"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type CriarProjetoState = { error?: string } | undefined;

export async function criarProjeto(
  workspaceId: string,
  _prevState: CriarProjetoState,
  formData: FormData,
): Promise<CriarProjetoState> {
  const nome = String(formData.get("nome") ?? "").trim();

  if (!nome) {
    return { error: "Dê um nome para o projeto." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/entrar");
  }

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id")
    .eq("id", workspaceId)
    .eq("owner_id", user.id)
    .single();

  if (!workspace) {
    return { error: "Workspace não encontrado." };
  }

  const { data: projeto, error } = await supabase
    .from("projects")
    .insert({ workspace_id: workspaceId, owner_id: user.id, name: nome })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  redirect(`/workspace/${workspaceId}/projeto/${projeto.id}`);
}
