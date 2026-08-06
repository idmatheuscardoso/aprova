import type { SupabaseClient } from "@supabase/supabase-js";
import {
  montarComentarios,
  comentarioLegado,
  type ComentarioBruto,
} from "@/lib/comentarios";
import type { AssetStatus } from "@/components/asset-status-badge";
import { formatarDataHora } from "@/lib/datas";

/**
 * TTL bem maior que o das miniaturas (1h): o visualizador fica aberto durante
 * toda a revisão, e uma URL vencida no meio do caminho quebra a tela.
 */
const TTL_VISUALIZADOR = 8 * 60 * 60;

export type ArquivoNoVisualizador = {
  id: string;
  nome: string;
  mimeType: string;
  status: AssetStatus;
  url: string | null;
};

/**
 * Carrega o arquivo e seus comentários. Recebe o client Supabase por
 * parâmetro para servir às duas telas: a pública passa o client de service
 * role (já tendo validado o token) e a logada passa o client sujeito a RLS.
 */
export async function carregarArquivo(
  supabase: SupabaseClient,
  { assetId, folderId }: { assetId: string; folderId: string },
) {
  const { data: asset } = await supabase
    .from("assets")
    .select(
      "id, name, mime_type, storage_path, status, feedback, decided_by_name, decided_at",
    )
    .eq("id", assetId)
    .eq("folder_id", folderId)
    .maybeSingle();

  if (!asset) return null;

  const [{ data: linhas }, { data: assinada }] = await Promise.all([
    supabase
      .from("comments")
      .select(
        "id, parent_id, author_role, author_name, author_email, body, anchor_x, anchor_y, resolved_at, created_at",
      )
      .eq("asset_id", assetId)
      .order("created_at", { ascending: true }),
    supabase.storage
      .from("assets")
      .createSignedUrl(asset.storage_path, TTL_VISUALIZADOR),
  ]);

  const comentarios = montarComentarios((linhas ?? []) as ComentarioBruto[]);
  const legado = comentarioLegado({
    feedback: asset.feedback,
    status: asset.status,
    autor: asset.decided_by_name,
    criadoEm: asset.decided_at,
  });

  return {
    arquivo: {
      id: asset.id,
      nome: asset.name,
      mimeType: asset.mime_type,
      status: asset.status as AssetStatus,
      url: assinada?.signedUrl ?? null,
    } satisfies ArquivoNoVisualizador,
    comentarios: legado ? [legado, ...comentarios] : comentarios,
    decisao: textoDaDecisao({
      status: asset.status,
      autor: asset.decided_by_name,
      quando: asset.decided_at,
    }),
  };
}

/** "Aprovado por Ana Souza em 06/08/2026, 14:30" — nulo enquanto pendente. */
function textoDaDecisao({
  status,
  autor,
  quando,
}: {
  status: string;
  autor: string | null;
  quando: string | null;
}) {
  if (!autor || !quando || status === "pendente") return null;
  const verbo = status === "aprovado" ? "Aprovado" : "Ajuste pedido";
  return `${verbo} por ${autor} em ${formatarDataHora(quando)}`;
}
