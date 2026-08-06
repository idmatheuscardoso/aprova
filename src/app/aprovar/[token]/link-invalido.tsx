import { Link2Off } from "lucide-react";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export function LinkInvalido() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-6 py-12">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Link2Off />
          </EmptyMedia>
          <EmptyTitle>Link inválido</EmptyTitle>
          <EmptyDescription>
            Este link de aprovação não existe mais. Peça um novo link para quem
            enviou os materiais.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </main>
  );
}
