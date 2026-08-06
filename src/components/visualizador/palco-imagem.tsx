"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Crosshair, Minus, Plus, Scan, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import type { Comentario } from "@/lib/comentarios";
import { Pin } from "./pin";
import { useZoomPan, type Ponto } from "./use-zoom-pan";

const PASSO_DA_MIRA = 0.02;
const PASSO_FINO_DA_MIRA = 0.005;

export function PalcoImagem({
  url,
  nome,
  comentarios,
  comentarioAtivoId,
  aoSelecionarComentario,
  podeComentar,
  rascunho,
  aoPosicionarRascunho,
  aoCancelarRascunho,
}: {
  url: string | null;
  nome: string;
  comentarios: Comentario[];
  comentarioAtivoId: string | null;
  aoSelecionarComentario: (id: string | null) => void;
  podeComentar: boolean;
  rascunho: Ponto | null;
  aoPosicionarRascunho: (fracao: Ponto) => void;
  aoCancelarRascunho: () => void;
}) {
  const router = useRouter();
  const [modoComentar, setModoComentar] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [expirou, setExpirou] = useState(false);
  const [mira, setMira] = useState<Ponto>({ x: 0.5, y: 0.5 });
  const palcoRef = useRef<HTMLDivElement>(null);

  const {
    viewportRef,
    conteudoRef,
    base,
    escala,
    tx,
    ty,
    arrastando,
    definirNatural,
    aumentar,
    diminuir,
    ajustarATela,
    garantirVisivel,
    handlers,
  } = useZoomPan({
    travarGestos: modoComentar,
    aoTocar: (fracao) => {
      if (modoComentar) {
        aoPosicionarRascunho(fracao);
        setModoComentar(false);
        return;
      }
      aoSelecionarComentario(null);
    },
  });

  const comFixacao = comentarios.filter((comentario) => comentario.ancora !== null);

  // Ao escolher um comentário na lista, traz o pin dele à vista se estiver
  // fora da área visível. O guard evita repetir a cada render.
  const ultimoRevelado = useRef<string | null>(null);
  useEffect(() => {
    if (comentarioAtivoId === ultimoRevelado.current) return;
    ultimoRevelado.current = comentarioAtivoId;
    if (!comentarioAtivoId) return;

    const alvo = comFixacao.find((item) => item.id === comentarioAtivoId);
    if (alvo?.ancora) garantirVisivel(alvo.ancora);
  }, [comentarioAtivoId, comFixacao, garantirVisivel]);

  function aoTeclar(evento: React.KeyboardEvent<HTMLDivElement>) {
    if (evento.key === "Escape") {
      if (modoComentar) {
        setModoComentar(false);
        evento.preventDefault();
      } else if (rascunho) {
        aoCancelarRascunho();
        evento.preventDefault();
      }
      return;
    }

    if (modoComentar) {
      const passo = evento.shiftKey ? PASSO_FINO_DA_MIRA : PASSO_DA_MIRA;
      const mover = (dx: number, dy: number) => {
        evento.preventDefault();
        setMira((atual) => ({
          x: Math.min(1, Math.max(0, atual.x + dx)),
          y: Math.min(1, Math.max(0, atual.y + dy)),
        }));
      };

      if (evento.key === "ArrowLeft") return mover(-passo, 0);
      if (evento.key === "ArrowRight") return mover(passo, 0);
      if (evento.key === "ArrowUp") return mover(0, -passo);
      if (evento.key === "ArrowDown") return mover(0, passo);
      if (evento.key === "Enter") {
        evento.preventDefault();
        aoPosicionarRascunho(mira);
        setModoComentar(false);
      }
      return;
    }

    if (evento.key === "+" || evento.key === "=") {
      evento.preventDefault();
      aumentar();
    } else if (evento.key === "-") {
      evento.preventDefault();
      diminuir();
    } else if (evento.key === "0") {
      evento.preventDefault();
      ajustarATela();
    }
  }

  if (!url || expirou) {
    return (
      <div className="flex h-[50vh] items-center justify-center rounded-lg border bg-muted/30 p-6">
        <Alert className="max-w-sm">
          <AlertDescription className="flex flex-col items-start gap-3">
            <span>
              A visualização desta imagem expirou. Atualize para carregar de novo.
            </span>
            <Button type="button" size="sm" onClick={() => router.refresh()}>
              Atualizar
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant={modoComentar ? "default" : "outline"}
          disabled={!podeComentar}
          aria-pressed={modoComentar}
          onClick={() => {
            setModoComentar((valor) => !valor);
            aoCancelarRascunho();
            palcoRef.current?.focus();
          }}
        >
          <Crosshair /> {modoComentar ? "Escolha o ponto" : "Comentar num ponto"}
        </Button>

        {modoComentar && (
          <Button type="button" size="sm" variant="ghost" onClick={() => setModoComentar(false)}>
            <X /> Cancelar
          </Button>
        )}

        <div className="ml-auto flex items-center gap-1">
          <Button
            type="button"
            size="icon-sm"
            variant="outline"
            aria-label="Diminuir zoom"
            onClick={diminuir}
          >
            <Minus />
          </Button>
          <span className="w-12 text-center text-sm tabular-nums text-muted-foreground">
            {Math.round(escala * 100)}%
          </span>
          <Button
            type="button"
            size="icon-sm"
            variant="outline"
            aria-label="Aumentar zoom"
            onClick={aumentar}
          >
            <Plus />
          </Button>
          <Button
            type="button"
            size="icon-sm"
            variant="outline"
            aria-label="Ajustar à tela"
            onClick={ajustarATela}
          >
            <Scan />
          </Button>
        </div>
      </div>

      {modoComentar && (
        <p className="text-sm text-muted-foreground">
          Clique no ponto da peça que você quer comentar. Pelo teclado: as setas
          movem a mira e Enter confirma.
        </p>
      )}

      <div
        ref={(elemento) => {
          viewportRef.current = elemento;
          palcoRef.current = elemento;
        }}
        tabIndex={0}
        role="application"
        aria-label={`Visualização de ${nome}`}
        onKeyDown={aoTeclar}
        {...handlers}
        style={{ touchAction: modoComentar || escala > 1 ? "none" : "pan-y" }}
        className={cn(
          "relative h-[55vh] overflow-hidden overscroll-contain rounded-lg border bg-muted/30",
          "outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
          "md:h-[calc(100vh-16rem)]",
          modoComentar
            ? "cursor-crosshair"
            : arrastando
              ? "cursor-grabbing"
              : escala > 1
                ? "cursor-grab"
                : "cursor-default",
        )}
      >
        {carregando && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Spinner />
          </div>
        )}

        <div
          ref={conteudoRef}
          className="absolute top-0 left-0 origin-top-left will-change-transform"
          style={{
            width: base?.w ?? 0,
            height: base?.h ?? 0,
            transform: `translate3d(${tx}px, ${ty}px, 0) scale(${escala})`,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- a URL
              assinada muda a cada request (o otimizador do Next nunca acertaria
              o cache) e o zoom precisa do arquivo em resolução cheia. */}
          <img
            src={url}
            alt={nome}
            draggable={false}
            onLoad={(evento) => {
              definirNatural({
                w: evento.currentTarget.naturalWidth,
                h: evento.currentTarget.naturalHeight,
              });
              setCarregando(false);
            }}
            onError={() => {
              setCarregando(false);
              setExpirou(true);
            }}
            className="block h-full w-full select-none"
          />

          {comFixacao.map((comentario) => (
            <Pin
              key={comentario.id}
              numero={comentario.numero!}
              x={comentario.ancora!.x}
              y={comentario.ancora!.y}
              escala={escala}
              ativo={comentario.id === comentarioAtivoId}
              resolvido={comentario.resolvidoEm !== null}
              rotulo={`Comentário ${comentario.numero}, de ${comentario.autor}`}
              aoSelecionar={() => aoSelecionarComentario(comentario.id)}
            />
          ))}

          {rascunho && (
            <div
              style={{
                left: `${rascunho.x * 100}%`,
                top: `${rascunho.y * 100}%`,
                transform: `translate(-50%, -50%) scale(${1 / escala})`,
              }}
              className="pointer-events-none absolute z-30 size-9"
            >
              <span className="flex size-7 items-center justify-center rounded-full border-2 border-dashed border-primary bg-background/80 motion-safe:animate-in motion-safe:zoom-in-50 motion-safe:duration-200 motion-safe:ease-snappy" />
            </div>
          )}

          {modoComentar && (
            <div
              style={{
                left: `${mira.x * 100}%`,
                top: `${mira.y * 100}%`,
                transform: `translate(-50%, -50%) scale(${1 / escala})`,
              }}
              className="pointer-events-none absolute z-30 size-6 rounded-full border-2 border-primary/70"
            />
          )}
        </div>
      </div>
    </div>
  );
}
