"use client";

import { useActionState } from "react";
import { criarPasta, type CriarPastaState } from "./actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";

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
          <FieldLabel htmlFor="nome">Nome da pasta</FieldLabel>
          <Input
            id="nome"
            name="nome"
            type="text"
            required
            placeholder="Ex: Peças para Instagram"
          />
        </Field>

        <Button type="submit" disabled={pending} className="self-start">
          {pending && <Spinner data-icon="inline-start" />}
          {pending ? "Criando..." : "Criar pasta"}
        </Button>
      </FieldGroup>
    </form>
  );
}
