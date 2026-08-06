import Link from "next/link";
import { Logo } from "@/components/logo";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-border px-6 py-4 sm:px-10">
        <Logo className="text-xl" />
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/entrar" className="text-muted-foreground hover:text-foreground">
            Entrar
          </Link>
          <Link
            href="/cadastro"
            className="rounded-full bg-foreground px-4 py-2 font-medium text-background transition-colors hover:opacity-90"
          >
            Criar conta
          </Link>
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
          <Link
            href="/cadastro"
            className="rounded-full bg-foreground px-6 py-3 font-medium text-background transition-colors hover:opacity-90"
          >
            Começar agora
          </Link>
          <Link
            href="/entrar"
            className="rounded-full border border-border px-6 py-3 font-medium transition-colors hover:bg-black/[.03] dark:hover:bg-white/[.06]"
          >
            Já tenho conta
          </Link>
        </div>
      </main>

      <footer className="border-t border-border px-6 py-8 text-center text-sm text-muted-foreground sm:px-10">
        <Logo className="text-base" /> — Aprovação sem enrolação.
      </footer>
    </div>
  );
}
