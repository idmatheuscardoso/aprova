"use client";

import { useActionState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { FieldError } from "@/components/ui/field";
import type { AcaoComentario, ComentarioState } from "./tipos";

export function CampoComentario({
  acao,
  autor,
  ancora,
  parentId,
  rotulo,
  textoDoBotao,
  autoFoco,
  aoCancelar,
  aoSucesso,
}: {
  acao: AcaoComentario;
  /** Nome e e-mail do cliente; nulo quando quem comenta é o dono (vem da sessão). */
  autor: { nome: string; email: string } | null;
  ancora?: { x: number; y: number } | null;
  parentId?: string;
  rotulo: string;
  textoDoBotao: string;
  autoFoco?: boolean;
  aoCancelar?: () => void;
  aoSucesso?: () => void;
}) {
  const [state, enviar, pendente] = useActionState<ComentarioState, FormData>(
    acao,
    undefined,
  );
  const campoRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const enviou = useRef(false);

  useEffect(() => {
    if (autoFoco) campoRef.current?.focus();
  }, [autoFoco]);

  // Limpa o campo (e avisa a casca) só depois de um envio que deu certo. O
  // `enviou` impede que a montagem do componente conte como sucesso.
  useEffect(() => {
    if (pendente) {
      enviou.current = true;
      return;
    }
    if (!enviou.current || state !== undefined) return;

    enviou.current = false;
    formRef.current?.reset();
    aoSucesso?.();
  }, [pendente, state, aoSucesso]);

  return (
    <form ref={formRef} action={enviar} className="flex flex-col gap-2">
      {autor && (
        <>
          <input type="hidden" name="revisor_nome" value={autor.nome} />
          <input type="hidden" name="revisor_email" value={autor.email} />
        </>
      )}
      {ancora && (
        <>
          <input type="hidden" name="ancora_x" value={ancora.x} />
          <input type="hidden" name="ancora_y" value={ancora.y} />
        </>
      )}
      {parentId && <input type="hidden" name="parent_id" value={parentId} />}

      <Textarea
        ref={campoRef}
        name="texto"
        required
        rows={3}
        aria-label={rotulo}
        placeholder={rotulo}
      />
      <FieldError>{state?.erro}</FieldError>

      <div className="flex items-center gap-2">
        <Button type="submit" size="sm" disabled={pendente}>
          {pendente && <Spinner data-icon="inline-start" />}
          {pendente ? "Enviando..." : textoDoBotao}
        </Button>
        {aoCancelar && (
          <Button type="button" size="sm" variant="ghost" onClick={aoCancelar}>
            Cancelar
          </Button>
        )}
      </div>
    </form>
  );
}
