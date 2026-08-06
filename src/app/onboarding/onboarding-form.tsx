"use client";

import { useActionState } from "react";
import { Logo } from "@/components/logo";
import { criarEmpresaEWorkspace } from "./actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";

export function OnboardingForm() {
  const [state, formAction, pending] = useActionState(criarEmpresaEWorkspace, undefined);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-16">
      <Logo className="text-2xl" />
      <form action={formAction} className="w-full max-w-sm">
        <FieldGroup>
          <div>
            <h1 className="text-center text-xl font-semibold">Quase lá</h1>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              Conte um pouco sobre sua empresa e crie seu primeiro Workspace.
            </p>
          </div>

          {state?.error && (
            <Alert
              variant="destructive"
              className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-1 motion-safe:duration-200 motion-safe:ease-snappy"
            >
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}

          <Field>
            <FieldLabel htmlFor="nomeEmpresa">Nome da empresa</FieldLabel>
            <Input
              id="nomeEmpresa"
              name="nomeEmpresa"
              type="text"
              required
              placeholder="Ex: Estúdio Nave"
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="nomeWorkspace">Nome do Workspace</FieldLabel>
            <Input
              id="nomeWorkspace"
              name="nomeWorkspace"
              type="text"
              required
              placeholder="Ex: Clientes 2026"
            />
          </Field>

          <Button type="submit" disabled={pending} className="mt-2">
            {pending && <Spinner data-icon="inline-start" />}
            {pending ? "Criando..." : "Criar Workspace"}
          </Button>
        </FieldGroup>
      </form>
    </div>
  );
}
