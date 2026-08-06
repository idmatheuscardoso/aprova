import { notFound, redirect } from "next/navigation";
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
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { sair } from "../../../../../actions";
import { EnviarAssetForm } from "./enviar-asset-form";

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

  const { data: pasta } = await supabase
    .from("folders")
    .select("id, name, project_id, projects(id, name, workspace_id)")
    .eq("id", pastaId)
    .eq("project_id", projetoId)
    .single();

  const projeto = Array.isArray(pasta?.projects) ? pasta.projects[0] : pasta?.projects;

  if (!pasta || !projeto || projeto.workspace_id !== workspaceId) {
    notFound();
  }

  const { data: assets } = await supabase
    .from("assets")
    .select("id, name, mime_type, size_bytes, storage_path, created_at")
    .eq("folder_id", pastaId)
    .order("created_at", { ascending: true });

  const assetsComUrl = await Promise.all(
    (assets ?? []).map(async (asset) => {
      const { data } = await supabase.storage
        .from("assets")
        .createSignedUrl(asset.storage_path, 3600);
      return { ...asset, url: data?.signedUrl ?? null };
    }),
  );

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

        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-medium text-muted-foreground">Arquivos</h2>

          {assetsComUrl.length > 0 ? (
            <ItemGroup>
              {assetsComUrl.map((asset) => (
                <Item key={asset.id} variant="outline">
                  {asset.mime_type.startsWith("image/") && asset.url ? (
                    <ItemMedia variant="image">
                      {/* eslint-disable-next-line @next/next/no-img-element -- miniatura de URL assinada dinâmica */}
                      <img src={asset.url} alt="" />
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
                  {asset.url && (
                    <ItemActions>
                      <Button
                        variant="ghost"
                        size="sm"
                        nativeButton={false}
                        render={<a href={asset.url} target="_blank" rel="noreferrer" />}
                      >
                        Ver
                      </Button>
                    </ItemActions>
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
