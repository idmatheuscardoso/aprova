"use client";

import { useActionState, useState } from "react";
import { Check, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FieldError } from "@/components/ui/field";
import { AssetStatusBadge, type AssetStatus } from "@/components/asset-status-badge";
import { aprovarAsset, pedirAjusteAsset, type PedirAjusteState } from "./actions";

export function AssetApprovalActions({
  token,
  assetId,
  status,
  feedback,
}: {
  token: string;
  assetId: string;
  status: AssetStatus;
  feedback: string | null;
}) {
  const [mostrarForm, setMostrarForm] = useState(false);
  const aprovar = aprovarAsset.bind(null, token, assetId);
  const [state, pedirAjuste] = useActionState<PedirAjusteState, FormData>(
    pedirAjusteAsset.bind(null, token, assetId),
    undefined,
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <AssetStatusBadge status={status} />

        <form action={aprovar}>
          <Button
            type="submit"
            size="sm"
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
          onClick={() => setMostrarForm((valor) => !valor)}
        >
          <MessageSquare /> Pedir ajuste
        </Button>
      </div>

      {mostrarForm && (
        <form action={pedirAjuste} className="flex flex-col gap-2">
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
    </div>
  );
}
