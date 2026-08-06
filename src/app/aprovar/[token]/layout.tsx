import type { ReactNode } from "react";
import { Logo } from "@/components/logo";
import { RevisorProvider } from "./revisor";

export default function AprovacaoLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center border-b px-6 py-4 sm:px-10">
        <Logo className="text-xl" />
      </header>
      <RevisorProvider>{children}</RevisorProvider>
    </div>
  );
}
