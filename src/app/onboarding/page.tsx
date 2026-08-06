import { redirect } from "next/navigation";
import Link from "next/link";
import { Building2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Item, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from "@/components/ui/item";
import { sair } from "../workspace/actions";
import { OnboardingForm } from "./onboarding-form";
import { CriarWorkspaceForm } from "./criar-workspace-form";

type WorkspaceComEmpresa = {
  id: string;
  name: string;
  companies: { name: string } | { name: string }[] | null;
};

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/entrar");
  }

  const { data: workspaces } = (await supabase
    .from("workspaces")
    .select("id, name, companies(name)")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: true })) as { data: WorkspaceComEmpresa[] | null };

  if (!workspaces || workspaces.length === 0) {
    return <OnboardingForm />;
  }

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
          <h1 className="text-2xl font-semibold tracking-tight">Seus Workspaces</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Escolha um Workspace para continuar.
          </p>
        </div>

        <ItemGroup>
          {workspaces.map((workspace) => {
            const empresa = Array.isArray(workspace.companies)
              ? workspace.companies[0]
              : workspace.companies;

            return (
              <Item
                key={workspace.id}
                variant="outline"
                className="hover:bg-muted"
                render={<Link href={`/workspace/${workspace.id}`} />}
              >
                <ItemMedia variant="icon">
                  <Building2 />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>{workspace.name}</ItemTitle>
                  {empresa?.name && <ItemDescription>{empresa.name}</ItemDescription>}
                </ItemContent>
              </Item>
            );
          })}
        </ItemGroup>

        <section className="flex flex-col gap-4 border-t pt-8">
          <h2 className="text-sm font-medium text-muted-foreground">Novo Workspace</h2>
          <CriarWorkspaceForm />
        </section>
      </main>
    </div>
  );
}
