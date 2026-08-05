"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type CriarPastaState = { error?: string } | undefined;

export async function criarPasta(
  workspaceId: string,
  projectId: string,
  _prevState: CriarPastaState,
  formData: FormData,
): Promise<CriarPastaState> {
  const nome = String(formData.get("nome") ?? "").trim();

  if (!nome) {
    return { error: "Dê um nome para a pasta." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/entrar");
  }

  const { data: projeto } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("owner_id", user.id)
    .single();

  if (!projeto) {
    return { error: "Projeto não encontrado." };
  }

  const { error } = await supabase
    .from("folders")
    .insert({ project_id: projectId, owner_id: user.id, name: nome });

  if (error) {
    return { error: error.message };
  }

  redirect(`/workspace/${workspaceId}/projeto/${projectId}`);
}
