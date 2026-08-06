"use client";

import { Visualizador } from "@/components/visualizador/visualizador";
import type { Comentario } from "@/lib/comentarios";
import type { ArquivoNoVisualizador } from "@/lib/visualizador-dados";
import type { AcaoComentario, AcaoSimples } from "@/components/visualizador/tipos";
import { RevisorLinhaCompacta, useRevisor } from "../../revisor";

export function VisualizadorCliente({
  arquivo,
  comentarios,
  voltarHref,
  voltarRotulo,
  decisao,
  comentar,
  aprovar,
  pedirAjuste,
}: {
  arquivo: ArquivoNoVisualizador;
  comentarios: Comentario[];
  voltarHref: string;
  voltarRotulo: string;
  decisao: string | null;
  comentar: AcaoComentario;
  aprovar: AcaoSimples;
  pedirAjuste: AcaoComentario;
}) {
  const { revisor } = useRevisor();

  return (
    <Visualizador
      arquivo={arquivo}
      comentarios={comentarios}
      papel="cliente"
      autor={revisor}
      podeComentar={revisor !== null}
      voltarHref={voltarHref}
      voltarRotulo={voltarRotulo}
      cabecalhoExtra={<RevisorLinhaCompacta />}
      decisao={decisao}
      comentar={comentar}
      aprovar={aprovar}
      pedirAjuste={pedirAjuste}
    />
  );
}
