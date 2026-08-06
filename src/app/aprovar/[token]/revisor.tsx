"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";

const CHAVE_STORAGE = "approva:revisor";
const EVENTO_REVISOR = "approva:revisor";

export type Revisor = { nome: string; email: string };

function assinarRevisor(callback: () => void) {
  window.addEventListener(EVENTO_REVISOR, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(EVENTO_REVISOR, callback);
    window.removeEventListener("storage", callback);
  };
}

function lerRevisorBruto() {
  try {
    return window.localStorage.getItem(CHAVE_STORAGE);
  } catch {
    return null;
  }
}

function salvarRevisor(revisor: Revisor) {
  try {
    window.localStorage.setItem(CHAVE_STORAGE, JSON.stringify(revisor));
  } catch {
    // sem localStorage o nome vale só nesta visita
  }
  window.dispatchEvent(new Event(EVENTO_REVISOR));
}

const RevisorContext = createContext<{
  revisor: Revisor | null;
  carregado: boolean;
}>({ revisor: null, carregado: false });

export function useRevisor() {
  return useContext(RevisorContext);
}

export function RevisorProvider({ children }: { children: ReactNode }) {
  // No servidor (e na hidratação) ainda não dá pra ler o localStorage;
  // "carregado" evita mostrar a dica de nome pendente antes da hora.
  const carregado = useSyncExternalStore(
    assinarRevisor,
    () => true,
    () => false,
  );
  const bruto = useSyncExternalStore(
    assinarRevisor,
    lerRevisorBruto,
    () => null,
  );
  const [editando, setEditando] = useState(false);

  const revisor = useMemo<Revisor | null>(() => {
    if (!bruto) return null;
    try {
      const dados = JSON.parse(bruto) as Partial<Revisor>;
      if (typeof dados.nome !== "string" || dados.nome.trim() === "") {
        return null;
      }
      return {
        nome: dados.nome,
        email: typeof dados.email === "string" ? dados.email : "",
      };
    } catch {
      return null;
    }
  }, [bruto]);

  function salvar(dados: FormData) {
    const nome = dados.get("nome");
    const email = dados.get("email");
    if (typeof nome !== "string" || nome.trim() === "") return;

    salvarRevisor({
      nome: nome.trim(),
      email: typeof email === "string" ? email.trim() : "",
    });
    setEditando(false);
  }

  return (
    <RevisorContext.Provider value={{ revisor, carregado }}>
      <section className="flex flex-col gap-4 rounded-lg border p-4">
        {revisor && !editando ? (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="flex items-center gap-2 text-sm">
              <UserRound className="size-4 text-muted-foreground" />
              <span>
                Revisando como{" "}
                <span className="font-medium">{revisor.nome}</span>
              </span>
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setEditando(true)}
            >
              Trocar
            </Button>
          </div>
        ) : (
          <form action={salvar}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="revisor-nome">Seu nome</FieldLabel>
                <Input
                  id="revisor-nome"
                  name="nome"
                  type="text"
                  required
                  defaultValue={revisor?.nome ?? ""}
                  placeholder="Ex: Ana Souza"
                />
                <FieldDescription>
                  Fica registrado junto de cada aprovação ou pedido de ajuste.
                </FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor="revisor-email">
                  Seu e-mail (opcional)
                </FieldLabel>
                <Input
                  id="revisor-email"
                  name="email"
                  type="email"
                  defaultValue={revisor?.email ?? ""}
                  placeholder="ana@empresa.com"
                />
              </Field>
              <Button type="submit" size="sm" className="self-start">
                Começar a revisar
              </Button>
            </FieldGroup>
          </form>
        )}
      </section>
      {children}
    </RevisorContext.Provider>
  );
}
