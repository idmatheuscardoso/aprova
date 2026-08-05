"use client";

import { useActionState } from "react";
import { criarProjeto, type CriarProjetoState } from "./actions";

export function CriarProjetoForm({ workspaceId }: { workspaceId: string }) {
  const criarProjetoNoWorkspace = criarProjeto.bind(null, workspaceId);
  const [state, formAction, pending] = useActionState<CriarProjetoState, FormData>(
    criarProjetoNoWorkspace,
    undefined,
  );

  return (
    <form action={formAction} className="flex w-full max-w-sm flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="nome" className="text-sm font-medium">
          Nome do projeto
        </label>
        <input
          id="nome"
          name="nome"
          type="text"
          required
          placeholder="Ex: Campanha de Verão"
          className="rounded-lg border border-border bg-transparent px-3 py-2 outline-none focus:border-foreground"
        />
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-colors hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Criando..." : "Criar projeto"}
      </button>
    </form>
  );
}
