"use client";

import { useActionState } from "react";
import { Logo } from "@/components/logo";
import { criarEmpresaEWorkspace } from "./actions";

export function OnboardingForm() {
  const [state, formAction, pending] = useActionState(criarEmpresaEWorkspace, undefined);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-16">
      <Logo className="text-2xl" />
      <form action={formAction} className="flex w-full max-w-sm flex-col gap-4">
        <div>
          <h1 className="text-center text-xl font-semibold">Quase lá</h1>
          <p className="mt-2 text-center text-sm text-muted">
            Conte um pouco sobre sua empresa e crie seu primeiro Workspace.
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="nomeEmpresa" className="text-sm font-medium">
            Nome da empresa
          </label>
          <input
            id="nomeEmpresa"
            name="nomeEmpresa"
            type="text"
            required
            placeholder="Ex: Estúdio Nave"
            className="rounded-lg border border-border bg-transparent px-3 py-2 outline-none focus:border-foreground"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="nomeWorkspace" className="text-sm font-medium">
            Nome do Workspace
          </label>
          <input
            id="nomeWorkspace"
            name="nomeWorkspace"
            type="text"
            required
            placeholder="Ex: Clientes 2026"
            className="rounded-lg border border-border bg-transparent px-3 py-2 outline-none focus:border-foreground"
          />
        </div>

        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="mt-2 rounded-full bg-foreground px-6 py-3 font-medium text-background transition-colors hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Criando..." : "Criar Workspace"}
        </button>
      </form>
    </div>
  );
}
