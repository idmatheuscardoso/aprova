"use client";

import { useActionState } from "react";
import { criarProjeto, type CriarProjetoState } from "./actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";

export function CriarProjetoForm({ workspaceId }: { workspaceId: string }) {
  const criarProjetoNoWorkspace = criarProjeto.bind(null, workspaceId);
  const [state, formAction, pending] = useActionState<CriarProjetoState, FormData>(
    criarProjetoNoWorkspace,
    undefined,
  );

  return (
    <form action={formAction} className="w-full max-w-sm">
      <FieldGroup>
        {state?.error && (
          <Alert
            variant="destructive"
            className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-1 motion-safe:duration-200 motion-safe:ease-snappy"
          >
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}

        <Field>
          <FieldLabel htmlFor="nome">Nome do projeto</FieldLabel>
          <Input id="nome" name="nome" type="text" required placeholder="Ex: Campanha de Verão" />
        </Field>

        <Button type="submit" disabled={pending} className="self-start">
          {pending && <Spinner data-icon="inline-start" />}
          {pending ? "Criando..." : "Criar projeto"}
        </Button>
      </FieldGroup>
    </form>
  );
}
