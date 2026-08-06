import { createAdminClient } from "@/lib/supabase/admin";
import { contextoDoToken } from "@/lib/aprovacao";
import { carregarArquivo } from "@/lib/visualizador-dados";
import { LinkInvalido } from "../../link-invalido";
import { aprovarAsset } from "../../actions";
import { comentarAsset, pedirAjusteAsset } from "./actions";
import { VisualizadorCliente } from "./visualizador-cliente";

export default async function ArquivoPage({
  params,
}: {
  params: Promise<{ token: string; assetId: string }>;
}) {
  const { token, assetId } = await params;

  const contexto = await contextoDoToken(token);
  if (!contexto) return <LinkInvalido />;

  const dados = await carregarArquivo(createAdminClient(), {
    assetId,
    folderId: contexto.folderId,
  });
  if (!dados) return <LinkInvalido />;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 py-8">
      <VisualizadorCliente
        arquivo={dados.arquivo}
        comentarios={dados.comentarios}
        voltarHref={`/aprovar/${token}`}
        voltarRotulo={`Voltar para ${contexto.folderName}`}
        decisao={dados.decisao}
        comentar={comentarAsset.bind(null, token, assetId)}
        aprovar={aprovarAsset.bind(null, token, assetId)}
        pedirAjuste={pedirAjusteAsset.bind(null, token, assetId)}
      />
    </main>
  );
}
