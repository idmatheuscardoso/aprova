"use client";

import { useActionState } from "react";
import { enviarAsset, type EnviarAssetState } from "./actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";

export function EnviarAssetForm({
  workspaceId,
  projectId,
  folderId,
}: {
  workspaceId: string;
  projectId: string;
  folderId: string;
}) {
  const enviarAssetNaPasta = enviarAsset.bind(null, workspaceId, projectId, folderId);
  const [state, formAction, pending] = useActionState<EnviarAssetState, FormData>(
    enviarAssetNaPasta,
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
          <FieldLabel htmlFor="arquivo">Arquivo (imagem ou PDF)</FieldLabel>
          <Input id="arquivo" name="arquivo" type="file" required accept="image/*,application/pdf" />
        </Field>

        <Button type="submit" disabled={pending} className="self-start">
          {pending && <Spinner data-icon="inline-start" />}
          {pending ? "Enviando..." : "Enviar arquivo"}
        </Button>
      </FieldGroup>
    </form>
  );
}
