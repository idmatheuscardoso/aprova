import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { AssetStatusBadge } from "@/components/asset-status-badge";
import { formatarDataHora } from "@/lib/datas";
import { sair } from "../../../../../actions";
import { EnviarAssetForm } from "./enviar-asset-form";
import { gerarLinkAprovacao } from "./actions";
import { CopiarLinkButton } from "./copiar-link-button";

function formatarTamanho(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function PastaPage({
  params,
}: {
  params: Promise<{ id: string; projetoId: string; pastaId: string }>;
}) {
  const { id: workspaceId, projetoId, pastaId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/entrar");
  }

  const [{ data: pasta }, { data: assets }, { data: linkAprovacao }] = await Promise.all([
    supabase
      .from("folders")
      .select("id, name, project_id, projects(id, name, workspace_id)")
      .eq("id", pastaId)
      .eq("project_id", projetoId)
      .single(),
    supabase
      .from("assets")
      .select(
        "id, name, mime_type, size_bytes, storage_path, created_at, status, feedback, decided_by_name, decided_by_email, decided_at",
      )
      .eq("folder_id", pastaId)
      .order("created_at", { ascending: true }),
    supabase
      .from("approval_links")
      .select("token")
      .eq("folder_id", pastaId)
      .eq("owner_id", user.id)
      .maybeSingle(),
  ]);

  const projeto = Array.isArray(pasta?.projects) ? pasta.projects[0] : pasta?.projects;

  if (!pasta || !projeto || projeto.workspace_id !== workspaceId) {
    notFound();
  }

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
    return { ...asset, url: signed?.signedUrl ?? null };
  });

  const gerarLinkComParametros = gerarLinkAprovacao.bind(
    null,
    workspaceId,
    projetoId,
    pastaId,
  );

  const headersList = await headers();
  const origem = `${headersList.get("x-forwarded-proto") ?? "https"}://${headersList.get("host")}`;
  const urlAprovacao = linkAprovacao ? `${origem}/aprovar/${linkAprovacao.token}` : null;

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b px-6 py-4 sm:px-10">
        <Logo className="text-xl" />
        <form action={sair}>
          <Button type="submit" variant="ghost" size="sm">
            Sair
          </Button>
        </form>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-10 px-6 py-12">
        <div>
          <Link
            href={`/workspace/${workspaceId}/projeto/${projetoId}`}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Voltar para {projeto.name}
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">{pasta.name}</h1>
        </div>

        <section className="flex flex-col gap-4 rounded-lg border p-4">
          <div>
            <h2 className="text-sm font-medium text-muted-foreground">
              Link de aprovação
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Compartilhe este link com o cliente. Ele abre sem precisar de
              login.
            </p>
          </div>

          {urlAprovacao ? (
            <div className="flex items-center gap-2">
              <Input readOnly value={urlAprovacao} />
              <CopiarLinkButton url={urlAprovacao} />
            </div>
          ) : (
            <form action={gerarLinkComParametros}>
              <Button type="submit" variant="outline" size="sm">
                Gerar link de aprovação
              </Button>
            </form>
          )}
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-medium text-muted-foreground">Arquivos</h2>

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
                    <ItemDescription>{formatarTamanho(asset.size_bytes)}</ItemDescription>
                  </ItemContent>
                  <ItemActions>
                    <AssetStatusBadge status={asset.status} />
                    {asset.url && (
                      <Button
                        variant="ghost"
                        size="sm"
                        nativeButton={false}
                        render={<a href={asset.url} target="_blank" rel="noreferrer" />}
                      >
                        Ver
                      </Button>
                    )}
                  </ItemActions>
                  {(asset.decided_by_name ||
                    (asset.status === "ajuste_solicitado" && asset.feedback)) && (
                    <ItemFooter>
                      <div className="flex flex-col gap-1">
                        {asset.status === "ajuste_solicitado" && asset.feedback && (
                          <p className="text-sm text-muted-foreground">{asset.feedback}</p>
                        )}
                        {asset.decided_by_name && asset.decided_at && (
                          <p className="text-sm text-muted-foreground">
                            {asset.status === "aprovado" ? "Aprovado" : "Ajuste pedido"} por{" "}
                            {asset.decided_by_name}
                            {asset.decided_by_email ? ` (${asset.decided_by_email})` : ""} em{" "}
                            {formatarDataHora(asset.decided_at)}
                          </p>
                        )}
                      </div>
                    </ItemFooter>
                  )}
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
                  Envie o primeiro arquivo para o cliente revisar.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </section>

        <section className="flex flex-col gap-4 border-t pt-8">
          <h2 className="text-sm font-medium text-muted-foreground">Enviar arquivo</h2>
          <EnviarAssetForm workspaceId={workspaceId} projectId={projetoId} folderId={pastaId} />
        </section>
      </main>
    </div>
  );
}
