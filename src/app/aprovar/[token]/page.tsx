import Image from "next/image";
import { FileText, Link2Off } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { Logo } from "@/components/logo";
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
import { AssetApprovalActions } from "./asset-approval-actions";

function formatarTamanho(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function LinkInvalido() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center border-b px-6 py-4 sm:px-10">
        <Logo className="text-xl" />
      </header>
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-6 py-12">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Link2Off />
            </EmptyMedia>
            <EmptyTitle>Link inválido</EmptyTitle>
            <EmptyDescription>
              Este link de aprovação não existe mais. Peça um novo link para
              quem enviou os materiais.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </main>
    </div>
  );
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
      .select("id, name, mime_type, size_bytes, storage_path, created_at, status, feedback")
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
    return { ...asset, url: signed?.signedUrl ?? null };
  });

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center border-b px-6 py-4 sm:px-10">
        <Logo className="text-xl" />
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-10 px-6 py-12">
        <div>
          {projeto?.name && (
            <p className="text-sm text-muted-foreground">{projeto.name}</p>
          )}
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">{pasta.name}</h1>
        </div>

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
                  <ItemFooter>
                    <AssetApprovalActions
                      token={token}
                      assetId={asset.id}
                      status={asset.status}
                      feedback={asset.feedback}
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
    </div>
  );
}
