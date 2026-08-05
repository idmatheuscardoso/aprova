"use client";

import { useActionState } from "react";
import { enviarAsset, type EnviarAssetState } from "./actions";

export function EnviarAssetForm({
  workspaceId,
  projectId,
  folderId,
}: {
  workspaceId: string;
  projectId: string;
  folderId: string;
}) {
  const enviarAssetNaPasta = enviarAsset.bind(null, workspaceId, projectId, folderId);
  const [state, formAction, pending] = useActionState<EnviarAssetState, FormData>(
    enviarAssetNaPasta,
    undefined,
  );

  return (
    <form action={formAction} className="flex w-full max-w-sm flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="arquivo" className="text-sm font-medium">
          Arquivo (imagem ou PDF)
        </label>
        <input
          id="arquivo"
          name="arquivo"
          type="file"
          required
          accept="image/*,application/pdf"
          className="rounded-lg border border-border bg-transparent px-3 py-2 text-sm outline-none file:mr-3 file:rounded-full file:border-0 file:bg-foreground file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-background"
        />
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-colors hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Enviando..." : "Enviar arquivo"}
      </button>
    </form>
  );
}
