import Link from "next/link";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b px-6 py-4 sm:px-10">
        <Logo className="text-xl" />
        <nav className="flex items-center gap-2 text-sm">
          <Button variant="ghost" nativeButton={false} render={<Link href="/entrar" />}>
            Entrar
          </Button>
          <Button nativeButton={false} render={<Link href="/cadastro" />}>
            Criar conta
          </Button>
        </nav>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center sm:px-10">
        <h1 className="max-w-2xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
          Do talvez ao aprovado.
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
          O Approva é onde seu cliente aprova, você entrega. Centralize a
          revisão e aprovação dos seus materiais em um só lugar — sem
          e-mail, sem WhatsApp, sem PDF perdido.
        </p>
        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <Button size="lg" nativeButton={false} render={<Link href="/cadastro" />}>
            Começar agora
          </Button>
          <Button size="lg" variant="outline" nativeButton={false} render={<Link href="/entrar" />}>
            Já tenho conta
          </Button>
        </div>
      </main>

      <footer className="border-t px-6 py-8 text-center text-sm text-muted-foreground sm:px-10">
        <Logo className="text-base" /> — Aprovação sem enrolação.
      </footer>
    </div>
  );
}
