"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Pin({
  numero,
  x,
  y,
  escala,
  ativo,
  resolvido,
  rotulo,
  aoSelecionar,
}: {
  numero: number;
  x: number;
  y: number;
  escala: number;
  ativo: boolean;
  resolvido?: boolean;
  rotulo: string;
  aoSelecionar: () => void;
}) {
  return (
    <div
      // A ordem importa: translate antes de scale mantém o centro do pin
      // exatamente sobre o ponto ancorado em qualquer nível de zoom. Como o
      // palco aplica scale(escala), o 1/escala aqui deixa o tamanho visual
      // (e a área de toque) constante.
      style={{
        left: `${x * 100}%`,
        top: `${y * 100}%`,
        transform: `translate(-50%, -50%) scale(${1 / escala})`,
      }}
      className={cn(
        "absolute flex size-9 items-center justify-center",
        ativo ? "z-20" : "z-10",
      )}
    >
      <Button
        type="button"
        size="icon-sm"
        variant={resolvido ? "secondary" : "default"}
        aria-label={rotulo}
        aria-pressed={ativo}
        onClick={aoSelecionar}
        onPointerDown={(evento) => evento.stopPropagation()}
        className={cn(
          "rounded-full text-xs font-semibold shadow-sm ring-2 ring-background",
          "motion-safe:animate-in motion-safe:zoom-in-50 motion-safe:duration-200 motion-safe:ease-snappy",
          ativo && "ring-3 ring-ring",
          resolvido && "opacity-70",
        )}
      >
        {numero}
      </Button>
    </div>
  );
}
