import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export function PalcoPdf({ url, nome }: { url: string | null; nome: string }) {
  return (
    <div className="flex h-[55vh] items-center justify-center rounded-lg border bg-muted/30 md:h-[calc(100vh-16rem)]">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <FileText />
          </EmptyMedia>
          <EmptyTitle>{nome}</EmptyTitle>
          <EmptyDescription>
            PDF abre em outra aba. Os comentários deste arquivo ficam aqui do
            lado.
          </EmptyDescription>
        </EmptyHeader>
        {url && (
          <Button
            nativeButton={false}
            render={<a href={url} target="_blank" rel="noreferrer" />}
          >
            Abrir PDF
          </Button>
        )}
      </Empty>
    </div>
  );
}
