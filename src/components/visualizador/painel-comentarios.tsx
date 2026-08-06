"use client";

import { useEffect, useRef, useState } from "react";
import { Check, CornerDownRight, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { cn } from "@/lib/utils";
import { formatarDataHora } from "@/lib/datas";
import type { Comentario } from "@/lib/comentarios";
import { CampoComentario } from "./campo-comentario";
import type { AcaoComentario, AcaoSimples } from "./tipos";

function Autoria({
  autor,
  papel,
  criadoEm,
}: {
  autor: string;
  papel: "cliente" | "dono";
  criadoEm: string;
}) {
  return (
    <p className="flex flex-wrap items-baseline gap-x-2 text-sm">
      <span className="font-medium">{autor}</span>
      {papel === "dono" && (
        <Badge variant="secondary" className="text-xs">
          Equipe
        </Badge>
      )}
      {criadoEm && (
        <span className="text-xs text-muted-foreground">
          {formatarDataHora(criadoEm)}
        </span>
      )}
    </p>
  );
}

export function PainelComentarios({
  comentarios,
  comentarioAtivoId,
  aoSelecionarComentario,
  papel,
  autor,
  podeComentar,
  comentar,
  resolver,
}: {
  comentarios: Comentario[];
  comentarioAtivoId: string | null;
  aoSelecionarComentario: (id: string | null) => void;
  papel: "cliente" | "dono";
  autor: { nome: string; email: string } | null;
  podeComentar: boolean;
  comentar: AcaoComentario;
  resolver?: AcaoSimples;
}) {
  const [respondendoId, setRespondendoId] = useState<string | null>(null);
  const itensRef = useRef(new Map<string, HTMLLIElement>());

  // Ao clicar num pin, rola a lista até o comentário correspondente.
  useEffect(() => {
    if (!comentarioAtivoId) return;
    const item = itensRef.current.get(comentarioAtivoId);
    if (!item) return;

    const suave = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    item.scrollIntoView({ block: "nearest", behavior: suave ? "smooth" : "auto" });
  }, [comentarioAtivoId]);

  if (comentarios.length === 0) {
    return (
      <Empty className="border-0">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <MessageSquare />
          </EmptyMedia>
          <EmptyTitle>Nenhum comentário ainda</EmptyTitle>
          <EmptyDescription>
            {papel === "cliente"
              ? "Clique num ponto da peça para marcar o que precisa mudar, ou escreva um comentário geral abaixo."
              : "Quando o cliente comentar, os pontos aparecem aqui."}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {comentarios.map((comentario) => {
        const ativo = comentario.id === comentarioAtivoId;
        const resolvido = comentario.resolvidoEm !== null;

        return (
          <li
            key={comentario.id}
            ref={(elemento) => {
              if (elemento) itensRef.current.set(comentario.id, elemento);
              else itensRef.current.delete(comentario.id);
            }}
            className={cn(
              "rounded-lg border p-3 transition-colors motion-safe:duration-200 motion-safe:ease-snappy",
              ativo && "border-ring bg-muted/50",
              resolvido && "opacity-70",
            )}
          >
            <div className="flex items-start gap-2">
              {comentario.numero !== null && (
                <Button
                  type="button"
                  size="icon-sm"
                  variant={resolvido ? "secondary" : "default"}
                  aria-label={`Mostrar o comentário ${comentario.numero} na peça`}
                  onClick={() => aoSelecionarComentario(comentario.id)}
                  className="rounded-full text-xs font-semibold"
                >
                  {comentario.numero}
                </Button>
              )}

              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <Autoria
                  autor={comentario.autor}
                  papel={comentario.papel}
                  criadoEm={comentario.criadoEm}
                />
                <p className="text-sm whitespace-pre-wrap">{comentario.texto}</p>

                {resolvido && (
                  <p className="text-xs text-muted-foreground">
                    Resolvido em {formatarDataHora(comentario.resolvidoEm!)}
                  </p>
                )}
              </div>
            </div>

            {comentario.respostas.length > 0 && (
              <ul className="mt-3 flex flex-col gap-3 border-l pl-3">
                {comentario.respostas.map((resposta) => (
                  <li key={resposta.id} className="flex flex-col gap-1">
                    <Autoria
                      autor={resposta.autor}
                      papel={resposta.papel}
                      criadoEm={resposta.criadoEm}
                    />
                    <p className="text-sm whitespace-pre-wrap">{resposta.texto}</p>
                  </li>
                ))}
              </ul>
            )}

            {!comentario.legado && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {podeComentar && respondendoId !== comentario.id && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setRespondendoId(comentario.id)}
                  >
                    <CornerDownRight /> Responder
                  </Button>
                )}

                {resolver && (
                  <form action={resolver}>
                    <input type="hidden" name="comentario_id" value={comentario.id} />
                    <input
                      type="hidden"
                      name="resolvido"
                      value={resolvido ? "" : "1"}
                    />
                    <Button type="submit" size="sm" variant="ghost">
                      <Check /> {resolvido ? "Reabrir" : "Marcar como resolvido"}
                    </Button>
                  </form>
                )}
              </div>
            )}

            {respondendoId === comentario.id && (
              <div className="mt-3">
                <CampoComentario
                  acao={comentar}
                  autor={autor}
                  parentId={comentario.id}
                  rotulo="Sua resposta"
                  textoDoBotao="Responder"
                  autoFoco
                  aoCancelar={() => setRespondendoId(null)}
                  aoSucesso={() => setRespondendoId(null)}
                />
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
