"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

async function pastaDoToken(token: string) {
  const supabase = createAdminClient();
  const { data: link } = await supabase
    .from("approval_links")
    .select("folder_id")
    .eq("token", token)
    .maybeSingle();

  return link?.folder_id ?? null;
}

export async function aprovarAsset(token: string, assetId: string) {
  const folderId = await pastaDoToken(token);
  if (!folderId) return;

  const supabase = createAdminClient();
  await supabase
    .from("assets")
    .update({ status: "aprovado", feedback: null })
    .eq("id", assetId)
    .eq("folder_id", folderId);

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

  const folderId = await pastaDoToken(token);
  if (!folderId) {
    return { error: "Link inválido." };
  }

  const supabase = createAdminClient();
  await supabase
    .from("assets")
    .update({ status: "ajuste_solicitado", feedback: feedback.trim() })
    .eq("id", assetId)
    .eq("folder_id", folderId);

  revalidatePath(`/aprovar/${token}`);
}
