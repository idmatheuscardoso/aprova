"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/logo";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";

export function EntrarForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(() =>
    searchParams.get("erro") === "link_invalido"
      ? "Esse link de confirmação expirou ou já foi usado. Tente entrar normalmente ou peça um novo cadastro."
      : null,
  );
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setCarregando(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });

    setCarregando(false);

    if (error) {
      setErro("E-mail ou senha incorretos.");
      return;
    }

    router.push("/onboarding");
    router.refresh();
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-16">
      <Logo className="text-2xl" />
      <form onSubmit={handleSubmit} className="w-full max-w-sm">
        <FieldGroup>
          <h1 className="text-center text-xl font-semibold">Entrar</h1>

          {erro && (
            <Alert
              variant="destructive"
              className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-1 motion-safe:duration-200 motion-safe:ease-snappy"
            >
              <AlertDescription>{erro}</AlertDescription>
            </Alert>
          )}

          <Field>
            <FieldLabel htmlFor="email">E-mail</FieldLabel>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="senha">Senha</FieldLabel>
            <Input
              id="senha"
              type="password"
              required
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
            />
          </Field>

          <Button type="submit" disabled={carregando} className="mt-2">
            {carregando && <Spinner data-icon="inline-start" />}
            {carregando ? "Entrando..." : "Entrar"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Ainda não tem conta?{" "}
            <Link href="/cadastro" className="font-medium text-foreground underline underline-offset-4">
              Criar conta
            </Link>
          </p>
        </FieldGroup>
      </form>
    </div>
  );
}
