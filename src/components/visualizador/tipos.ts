export type ComentarioState = { erro?: string } | undefined;

/** Assinatura das server actions de comentário, usadas com `useActionState`. */
export type AcaoComentario = (
  estado: ComentarioState,
  formData: FormData,
) => Promise<ComentarioState>;

/** Ações simples (aprovar, resolver), sem estado de erro na tela. */
export type AcaoSimples = (formData: FormData) => Promise<void>;
