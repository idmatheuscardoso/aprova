"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
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

const RevisorContext = createContext<{
  revisor: Revisor | null;
  carregado: boolean;
  salvar: (dados: FormData) => void;
}>({ revisor: null, carregado: false, salvar: () => {} });

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

  const salvar = useCallback((dados: FormData) => {
    const nome = dados.get("nome");
    const email = dados.get("email");
    if (typeof nome !== "string" || nome.trim() === "") return;

    const novo: Revisor = {
      nome: nome.trim(),
      email: typeof email === "string" ? email.trim() : "",
    };

    try {
      window.localStorage.setItem(CHAVE_STORAGE, JSON.stringify(novo));
    } catch {
      // sem localStorage o nome vale só nesta visita
    }
    window.dispatchEvent(new Event(EVENTO_REVISOR));
  }, []);

  return (
    <RevisorContext.Provider value={{ revisor, carregado, salvar }}>
      {children}
    </RevisorContext.Provider>
  );
}

function FormularioRevisor({
  revisor,
  aoSalvar,
}: {
  revisor: Revisor | null;
  aoSalvar: (dados: FormData) => void;
}) {
  return (
    <form action={aoSalvar}>
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
            Fica registrado junto de cada comentário e de cada decisão.
          </FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="revisor-email">Seu e-mail (opcional)</FieldLabel>
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
  );
}

/** Cartão de identificação da tela de índice. */
export function RevisorCard() {
  const { revisor, salvar } = useRevisor();
  const [editando, setEditando] = useState(false);

  function aoSalvar(dados: FormData) {
    salvar(dados);
    setEditando(false);
  }

  return (
    <section className="flex flex-col gap-4 rounded-lg border p-4">
      {revisor && !editando ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="flex items-center gap-2 text-sm">
            <UserRound className="size-4 text-muted-foreground" />
            <span>
              Revisando como <span className="font-medium">{revisor.nome}</span>
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
        <FormularioRevisor revisor={revisor} aoSalvar={aoSalvar} />
      )}
    </section>
  );
}

/** Versão enxuta para o cabeçalho do visualizador. */
export function RevisorLinhaCompacta() {
  const { revisor, carregado, salvar } = useRevisor();
  const [editando, setEditando] = useState(false);

  function aoSalvar(dados: FormData) {
    salvar(dados);
    setEditando(false);
  }

  if (editando || (carregado && !revisor)) {
    return (
      <div className="flex flex-col gap-3 rounded-lg border p-4">
        {!revisor && (
          <Alert>
            <AlertDescription>
              Preencha seu nome para poder comentar e decidir.
            </AlertDescription>
          </Alert>
        )}
        <FormularioRevisor revisor={revisor} aoSalvar={aoSalvar} />
      </div>
    );
  }

  if (!revisor) return null;

  return (
    <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
      <UserRound className="size-4" />
      <span>
        Revisando como{" "}
        <span className="font-medium text-foreground">{revisor.nome}</span>
      </span>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setEditando(true)}
      >
        Trocar
      </Button>
    </p>
  );
}
