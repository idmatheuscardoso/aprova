"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CopiarLinkButton({ url }: { url: string }) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    await navigator.clipboard.writeText(url);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={copiar}>
      {copiado ? (
        <>
          <Check /> Copiado
        </>
      ) : (
        <>
          <Copy /> Copiar link
        </>
      )}
    </Button>
  );
}
