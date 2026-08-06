export type PapelAutor = "cliente" | "dono";

/** Uma linha de `comments` como vem do banco. */
export type ComentarioBruto = {
  id: string;
  parent_id: string | null;
  author_role: PapelAutor;
  author_name: string;
  author_email: string | null;
  body: string;
  anchor_x: number | null;
  anchor_y: number | null;
  resolved_at: string | null;
  created_at: string;
};

/** Um comentário raiz já com respostas e número do pin resolvidos. */
export type Comentario = {
  id: string;
  autor: string;
  papel: PapelAutor;
  texto: string;
  criadoEm: string;
  ancora: { x: number; y: number } | null;
  /** Posição na numeração dos pins (1, 2, 3...). Nulo em comentário geral. */
  numero: number | null;
  resolvidoEm: string | null;
  /** Comentário sintético vindo do campo `feedback` legado: não aceita resposta. */
  legado?: boolean;
  respostas: {
    id: string;
    autor: string;
    papel: PapelAutor;
    texto: string;
    criadoEm: string;
  }[];
};

/**
 * Monta as threads a partir das linhas cruas: agrupa respostas sob a raiz e
 * numera os pins pela ordem de criação. O número do pin não é guardado no
 * banco justamente para renumerar sozinho quando um comentário é apagado.
 */
export function montarComentarios(linhas: ComentarioBruto[]): Comentario[] {
  const ordenadas = [...linhas].sort((a, b) =>
    a.created_at.localeCompare(b.created_at),
  );

  const raizes = ordenadas.filter((linha) => linha.parent_id === null);
  const respostasPorPai = new Map<string, ComentarioBruto[]>();

  for (const linha of ordenadas) {
    if (!linha.parent_id) continue;
    const lista = respostasPorPai.get(linha.parent_id) ?? [];
    lista.push(linha);
    respostasPorPai.set(linha.parent_id, lista);
  }

  let proximoNumero = 0;

  return raizes.map((raiz) => {
    const temAncora = raiz.anchor_x !== null && raiz.anchor_y !== null;
    if (temAncora) proximoNumero += 1;

    return {
      id: raiz.id,
      autor: raiz.author_name,
      papel: raiz.author_role,
      texto: raiz.body,
      criadoEm: raiz.created_at,
      ancora: temAncora ? { x: raiz.anchor_x!, y: raiz.anchor_y! } : null,
      numero: temAncora ? proximoNumero : null,
      resolvidoEm: raiz.resolved_at,
      respostas: (respostasPorPai.get(raiz.id) ?? []).map((resposta) => ({
        id: resposta.id,
        autor: resposta.author_name,
        papel: resposta.author_role,
        texto: resposta.body,
        criadoEm: resposta.created_at,
      })),
    };
  });
}

/**
 * O feedback escrito antes da Etapa 12 (campo `assets.feedback`) vira um
 * comentário sintético no topo da lista, para o histórico não sumir da tela.
 */
export function comentarioLegado({
  feedback,
  status,
  autor,
  criadoEm,
}: {
  feedback: string | null;
  status: string;
  autor: string | null;
  criadoEm: string | null;
}): Comentario | null {
  if (!feedback || status !== "ajuste_solicitado") return null;

  return {
    id: "legado",
    autor: autor ?? "Cliente",
    papel: "cliente",
    texto: feedback,
    criadoEm: criadoEm ?? "",
    ancora: null,
    numero: null,
    resolvidoEm: null,
    legado: true,
    respostas: [],
  };
}

export const LIMITE_CARACTERES = 2000;

/** Mesma validação do `check` da migração 0009, para errar antes do banco. */
export function validarTexto(valor: FormDataEntryValue | null) {
  if (typeof valor !== "string" || valor.trim() === "") {
    return { erro: "Escreva o comentário." as const };
  }
  const texto = valor.trim();
  if (texto.length > LIMITE_CARACTERES) {
    return { erro: `O comentário passou de ${LIMITE_CARACTERES} caracteres.` };
  }
  return { texto };
}

/** Fração 0..1 vinda do formulário, rejeitando qualquer coisa fora da faixa. */
export function validarAncora(
  x: FormDataEntryValue | null,
  y: FormDataEntryValue | null,
) {
  if (typeof x !== "string" || typeof y !== "string" || x === "" || y === "") {
    return null;
  }

  const numeroX = Number(x);
  const numeroY = Number(y);
  const dentroDaFaixa = (valor: number) =>
    Number.isFinite(valor) && valor >= 0 && valor <= 1;

  if (!dentroDaFaixa(numeroX) || !dentroDaFaixa(numeroY)) return null;

  return { x: numeroX, y: numeroY };
}
