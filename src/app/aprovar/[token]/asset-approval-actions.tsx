"use client";

import { useActionState, useState } from "react";
import { Check, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FieldError } from "@/components/ui/field";
import { AssetStatusBadge, type AssetStatus } from "@/components/asset-status-badge";
import { aprovarAsset, pedirAjusteAsset, type PedirAjusteState } from "./actions";
import { useRevisor } from "./revisor";

export function AssetApprovalActions({
  token,
  assetId,
  status,
  feedback,
  decisao,
}: {
  token: string;
  assetId: string;
  status: AssetStatus;
  feedback: string | null;
  decisao: string | null;
}) {
  const { revisor, carregado } = useRevisor();
  const [mostrarForm, setMostrarForm] = useState(false);
  const aprovar = aprovarAsset.bind(null, token, assetId);
  const [state, pedirAjuste] = useActionState<PedirAjusteState, FormData>(
    pedirAjusteAsset.bind(null, token, assetId),
    undefined,
  );

  const podeDecidir = carregado && revisor !== null;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <AssetStatusBadge status={status} />

        <form action={aprovar}>
          <input type="hidden" name="revisor_nome" value={revisor?.nome ?? ""} />
          <input type="hidden" name="revisor_email" value={revisor?.email ?? ""} />
          <Button
            type="submit"
            size="sm"
            disabled={!podeDecidir}
            variant={status === "aprovado" ? undefined : "outline"}
            className={
              status === "aprovado"
                ? "bg-approved text-approved-foreground hover:bg-approved/90"
                : undefined
            }
          >
            <Check /> Aprovar
          </Button>
        </form>

        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={!podeDecidir}
          onClick={() => setMostrarForm((valor) => !valor)}
        >
          <MessageSquare /> Pedir ajuste
        </Button>
      </div>

      {carregado && !revisor && (
        <p className="text-sm text-muted-foreground">
          Preencha seu nome no topo da página para aprovar ou pedir ajuste.
        </p>
      )}

      {mostrarForm && (
        <form action={pedirAjuste} className="flex flex-col gap-2">
          <input type="hidden" name="revisor_nome" value={revisor?.nome ?? ""} />
          <input type="hidden" name="revisor_email" value={revisor?.email ?? ""} />
          <Textarea
            name="feedback"
            defaultValue={feedback ?? ""}
            placeholder="O que precisa mudar?"
            required
          />
          <FieldError>{state?.error}</FieldError>
          <div>
            <Button type="submit" size="sm">
              Enviar
            </Button>
          </div>
        </form>
      )}

      {!mostrarForm && status === "ajuste_solicitado" && feedback && (
        <p className="text-sm text-muted-foreground">{feedback}</p>
      )}

      {status !== "pendente" && decisao && (
        <p className="text-sm text-muted-foreground">{decisao}</p>
      )}
    </div>
  );
}
