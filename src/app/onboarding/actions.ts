"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type OnboardingState = { error?: string } | undefined;

export async function criarEmpresaEWorkspace(
  _prevState: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const nomeEmpresa = String(formData.get("nomeEmpresa") ?? "").trim();
  const nomeWorkspace = String(formData.get("nomeWorkspace") ?? "").trim();

  if (!nomeEmpresa || !nomeWorkspace) {
    return { error: "Preencha o nome da empresa e do workspace." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/entrar");
  }

  const { data: empresa, error: erroEmpresa } = await supabase
    .from("companies")
    .insert({ owner_id: user.id, name: nomeEmpresa })
    .select()
    .single();

  if (erroEmpresa) {
    return { error: erroEmpresa.message };
  }

  const { data: workspace, error: erroWorkspace } = await supabase
    .from("workspaces")
    .insert({ company_id: empresa.id, owner_id: user.id, name: nomeWorkspace })
    .select()
    .single();

  if (erroWorkspace) {
    return { error: erroWorkspace.message };
  }

  redirect(`/workspace/${workspace.id}`);
}

export type CriarWorkspaceState = { error?: string } | undefined;

export async function criarWorkspace(
  _prevState: CriarWorkspaceState,
  formData: FormData,
): Promise<CriarWorkspaceState> {
  const nome = String(formData.get("nome") ?? "").trim();

  if (!nome) {
    return { error: "Dê um nome para o Workspace." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/entrar");
  }

  const { data: empresa } = await supabase
    .from("companies")
    .select("id")
    .eq("owner_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!empresa) {
    return { error: "Empresa não encontrada." };
  }

  const { data: workspace, error } = await supabase
    .from("workspaces")
    .insert({ company_id: empresa.id, owner_id: user.id, name: nome })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  redirect(`/workspace/${workspace.id}`);
}
