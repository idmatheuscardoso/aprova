import Image from "next/image";
import Link from "next/link";
import { FileText } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { Button } from "@/components/ui/button";
import { formatarDataHora } from "@/lib/datas";
import { LinkInvalido } from "./link-invalido";
import { AssetApprovalActions } from "./asset-approval-actions";
import { RevisorCard } from "./revisor";

function formatarTamanho(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function contarComentarios(valor: unknown) {
  if (!Array.isArray(valor)) return 0;
  const primeiro = valor[0] as { count?: number } | undefined;
  return primeiro?.count ?? 0;
}

export default async function AprovacaoPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = createAdminClient();

  const { data: link } = await supabase
    .from("approval_links")
    .select("folder_id")
    .eq("token", token)
    .maybeSingle();

  if (!link) {
    return <LinkInvalido />;
  }

  const [{ data: pasta }, { data: assets }] = await Promise.all([
    supabase
      .from("folders")
      .select("id, name, projects(name)")
      .eq("id", link.folder_id)
      .maybeSingle(),
    supabase
      .from("assets")
      .select(
        "id, name, mime_type, size_bytes, storage_path, created_at, status, decided_by_name, decided_at, comments(count)",
      )
      .eq("folder_id", link.folder_id)
      .order("created_at", { ascending: true }),
  ]);

  if (!pasta) {
    return <LinkInvalido />;
  }

  const projeto = Array.isArray(pasta.projects) ? pasta.projects[0] : pasta.projects;

  const { data: signedUrls } =
    assets && assets.length > 0
      ? await supabase.storage
          .from("assets")
          .createSignedUrls(
            assets.map((asset) => asset.storage_path),
            3600,
          )
      : { data: null };

  const assetsComUrl = (assets ?? []).map((asset) => {
    const signed = signedUrls?.find((item) => item.path === asset.storage_path);
    return {
      ...asset,
      url: signed?.signedUrl ?? null,
      comentarios: contarComentarios(asset.comments),
    };
  });

  const aprovados = assetsComUrl.filter((asset) => asset.status === "aprovado").length;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-10 px-6 py-12">
      <div>
        {projeto?.name && (
          <p className="text-sm text-muted-foreground">{projeto.name}</p>
        )}
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">{pasta.name}</h1>
        {assetsComUrl.length > 0 && (
          <p className="mt-2 text-sm text-muted-foreground">
            {aprovados} de {assetsComUrl.length}{" "}
            {assetsComUrl.length === 1 ? "arquivo aprovado" : "arquivos aprovados"}
          </p>
        )}
      </div>

      <RevisorCard />

      <section className="flex flex-col gap-4">
        {assetsComUrl.length > 0 ? (
          <ItemGroup>
            {assetsComUrl.map((asset) => (
              <Item key={asset.id} variant="outline">
                {asset.mime_type.startsWith("image/") && asset.url ? (
                  <ItemMedia variant="image">
                    <Image src={asset.url} alt="" width={80} height={80} />
                  </ItemMedia>
                ) : (
                  <ItemMedia variant="icon">
                    <FileText />
                  </ItemMedia>
                )}
                <ItemContent>
                  <ItemTitle>{asset.name}</ItemTitle>
                  <ItemDescription>
                    {formatarTamanho(asset.size_bytes)}
                    {asset.comentarios > 0 &&
                      ` · ${asset.comentarios} ${asset.comentarios === 1 ? "comentário" : "comentários"}`}
                  </ItemDescription>
                </ItemContent>
                <ItemActions>
                  <Button
                    size="sm"
                    nativeButton={false}
                    render={<Link href={`/aprovar/${token}/arquivo/${asset.id}`} />}
                  >
                    Revisar
                  </Button>
                </ItemActions>
                <ItemFooter>
                  <AssetApprovalActions
                    token={token}
                    assetId={asset.id}
                    status={asset.status}
                    decisao={
                      asset.decided_by_name && asset.decided_at
                        ? `${asset.status === "aprovado" ? "Aprovado" : "Ajuste pedido"} por ${asset.decided_by_name} em ${formatarDataHora(asset.decided_at)}`
                        : null
                    }
                  />
                </ItemFooter>
              </Item>
            ))}
          </ItemGroup>
        ) : (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <FileText />
              </EmptyMedia>
              <EmptyTitle>Nenhum arquivo ainda</EmptyTitle>
              <EmptyDescription>
                Ainda não há materiais para revisar nesta pasta.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </section>
    </main>
  );
}
