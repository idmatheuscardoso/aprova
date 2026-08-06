import { Badge } from "@/components/ui/badge";

export type AssetStatus = "pendente" | "aprovado" | "ajuste_solicitado";

export function AssetStatusBadge({ status }: { status: AssetStatus }) {
  if (status === "aprovado") {
    return (
      <Badge className="border-transparent bg-approved text-approved-foreground">
        Aprovado
      </Badge>
    );
  }

  if (status === "ajuste_solicitado") {
    return <Badge variant="secondary">Ajuste pedido</Badge>;
  }

  return <Badge variant="outline">Pendente</Badge>;
}
