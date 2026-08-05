import Link from "next/link";
import { Logo } from "@/components/logo";

export default function EntrarPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      <Logo className="text-2xl" />
      <p className="max-w-sm text-muted">
        O login ainda está sendo construído (Etapa 2). Volte em breve.
      </p>
      <Link href="/" className="text-sm font-medium underline underline-offset-4">
        Voltar para o início
      </Link>
    </div>
  );
}
