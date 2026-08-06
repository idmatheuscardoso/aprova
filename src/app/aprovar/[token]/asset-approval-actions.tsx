"use client";

import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AssetStatusBadge, type AssetStatus } from "@/components/asset-status-badge";
import { aprovarAsset } from "./actions";
import { useRevisor } from "./revisor";

export function AssetApprovalActions({
  token,
  assetId,
  status,
  decisao,
}: {
  token: string;
  assetId: string;
  status: AssetStatus;
  decisao: string | null;
}) {
  const { revisor, carregado } = useRevisor();
  const aprovar = aprovarAsset.bind(null, token, assetId);

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
            disabled={!carregado || revisor === null}
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
      </div>

      {carregado && !revisor && (
        <p className="text-sm text-muted-foreground">
          Preencha seu nome acima para aprovar. Para pedir ajuste, abra o arquivo
          em &ldquo;Revisar&rdquo;.
        </p>
      )}

      {status !== "pendente" && decisao && (
        <p className="text-sm text-muted-foreground">{decisao}</p>
      )}
    </div>
  );
}
