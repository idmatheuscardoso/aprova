"use client";

import { useActionState, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, Check, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { FieldError } from "@/components/ui/field";
import { AssetStatusBadge } from "@/components/asset-status-badge";
import type { Comentario } from "@/lib/comentarios";
import type { ArquivoNoVisualizador } from "@/lib/visualizador-dados";
import { PalcoImagem } from "./palco-imagem";
import { PalcoPdf } from "./palco-pdf";
import { PainelComentarios } from "./painel-comentarios";
import { CampoComentario } from "./campo-comentario";
import type { Ponto } from "./use-zoom-pan";
import type { AcaoComentario, AcaoSimples, ComentarioState } from "./tipos";

export function Visualizador({
  arquivo,
  comentarios,
  papel,
  autor,
  podeComentar,
  voltarHref,
  voltarRotulo,
  cabecalhoExtra,
  decisao,
  comentar,
  aprovar,
  pedirAjuste,
  resolver,
}: {
  arquivo: ArquivoNoVisualizador;
  comentarios: Comentario[];
  papel: "cliente" | "dono";
  autor: { nome: string; email: string } | null;
  podeComentar: boolean;
  voltarHref: string;
  voltarRotulo: string;
  cabecalhoExtra?: ReactNode;
  decisao?: string | null;
  comentar: AcaoComentario;
  aprovar?: AcaoSimples;
  pedirAjuste?: AcaoComentario;
  resolver?: AcaoSimples;
}) {
  const [comentarioAtivoId, setComentarioAtivoId] = useState<string | null>(null);
  const [rascunho, setRascunho] = useState<Ponto | null>(null);

  const [estadoAjuste, enviarAjuste, ajustePendente] = useActionState<
    ComentarioState,
    FormData
  >(pedirAjuste ?? (async () => undefined), undefined);

  const eImagem = arquivo.mimeType.startsWith("image/");
  const quantidade = comentarios.length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Link
          href={voltarHref}
          className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> {voltarRotulo}
        </Link>

        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-xl font-semibold tracking-tight">{arquivo.nome}</h1>
          <AssetStatusBadge status={arquivo.status} />
        </div>

        {decisao && <p className="text-sm text-muted-foreground">{decisao}</p>}
        {cabecalhoExtra}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0">
          {eImagem ? (
            <PalcoImagem
              url={arquivo.url}
              nome={arquivo.nome}
              comentarios={comentarios}
              comentarioAtivoId={comentarioAtivoId}
              aoSelecionarComentario={setComentarioAtivoId}
              podeComentar={podeComentar}
              rascunho={rascunho}
              aoPosicionarRascunho={setRascunho}
              aoCancelarRascunho={() => setRascunho(null)}
            />
          ) : (
            <PalcoPdf url={arquivo.url} nome={arquivo.nome} />
          )}
        </div>

        <aside className="flex min-w-0 flex-col gap-4">
          <h2 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <MessageSquare className="size-4" />
            {quantidade === 1 ? "1 comentário" : `${quantidade} comentários`}
          </h2>

          <div className="max-h-[32rem] overflow-y-auto lg:max-h-[calc(100vh-24rem)]">
            <PainelComentarios
              comentarios={comentarios}
              comentarioAtivoId={comentarioAtivoId}
              aoSelecionarComentario={setComentarioAtivoId}
              papel={papel}
              autor={autor}
              podeComentar={podeComentar}
              comentar={comentar}
              resolver={resolver}
            />
          </div>

          {podeComentar && (
            <div className="flex flex-col gap-2 border-t pt-4">
              {rascunho && (
                <p className="text-sm text-muted-foreground">
                  Comentando no ponto marcado na peça.
                </p>
              )}
              <CampoComentario
                key={rascunho ? `${rascunho.x}-${rascunho.y}` : "geral"}
                acao={comentar}
                autor={autor}
                ancora={rascunho}
                rotulo={rascunho ? "O que muda neste ponto?" : "Comentário geral"}
                textoDoBotao="Comentar"
                autoFoco={rascunho !== null}
                aoCancelar={rascunho ? () => setRascunho(null) : undefined}
                aoSucesso={() => setRascunho(null)}
              />
            </div>
          )}

          {papel === "cliente" && (aprovar || pedirAjuste) && (
            <div className="flex flex-col gap-2 border-t pt-4">
              <div className="flex flex-wrap gap-2">
                {aprovar && (
                  <form action={aprovar}>
                    <input type="hidden" name="revisor_nome" value={autor?.nome ?? ""} />
                    <input
                      type="hidden"
                      name="revisor_email"
                      value={autor?.email ?? ""}
                    />
                    <Button
                      type="submit"
                      size="sm"
                      disabled={!podeComentar}
                      variant={arquivo.status === "aprovado" ? undefined : "outline"}
                      className={
                        arquivo.status === "aprovado"
                          ? "bg-approved text-approved-foreground hover:bg-approved/90"
                          : undefined
                      }
                    >
                      <Check /> Aprovar
                    </Button>
                  </form>
                )}

                {pedirAjuste && (
                  <form action={enviarAjuste}>
                    <input type="hidden" name="revisor_nome" value={autor?.nome ?? ""} />
                    <input
                      type="hidden"
                      name="revisor_email"
                      value={autor?.email ?? ""}
                    />
                    <Button
                      type="submit"
                      size="sm"
                      variant="outline"
                      disabled={!podeComentar || ajustePendente}
                    >
                      {ajustePendente && <Spinner data-icon="inline-start" />}
                      <MessageSquare /> Pedir ajuste
                    </Button>
                  </form>
                )}
              </div>
              <FieldError>{estadoAjuste?.erro}</FieldError>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
