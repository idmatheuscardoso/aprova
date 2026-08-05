"use client";

import { useActionState } from "react";
import { criarPasta, type CriarPastaState } from "./actions";

export function CriarPastaForm({
  workspaceId,
  projectId,
}: {
  workspaceId: string;
  projectId: string;
}) {
  const criarPastaNoProjeto = criarPasta.bind(null, workspaceId, projectId);
  const [state, formAction, pending] = useActionState<CriarPastaState, FormData>(
    criarPastaNoProjeto,
    undefined,
  );

  return (
    <form action={formAction} className="flex w-full max-w-sm flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="nome" className="text-sm font-medium">
          Nome da pasta
        </label>
        <input
          id="nome"
          name="nome"
          type="text"
          required
          placeholder="Ex: Peças para Instagram"
          className="rounded-lg border border-border bg-transparent px-3 py-2 outline-none focus:border-foreground"
        />
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-colors hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Criando..." : "Criar pasta"}
      </button>
    </form>
  );
}
