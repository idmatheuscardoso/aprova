"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export const ESCALA_MIN = 1;
export const ESCALA_MAX = 8;

const DISTANCIA_DE_TOQUE = 6;
const TEMPO_DE_TOQUE = 400;

export type Ponto = { x: number; y: number };
type Medidas = { w: number; h: number };
type Estado = { escala: number; tx: number; ty: number };

/**
 * Mantém a imagem colada nas bordas do palco. Quando ela é menor que o palco
 * (o caso de escala 1), o excedente é negativo e o resultado centraliza —
 * por isso não existe um estado "inicial" especial.
 */
function limitarEixo(t: number, conteudo: number, viewport: number) {
  const excedente = conteudo - viewport;
  if (excedente <= 0) return excedente / 2;
  return Math.min(0, Math.max(-excedente, t));
}

/**
 * Zoom ancorado num ponto: o pedaço da imagem sob o cursor (ou sob o meio dos
 * dois dedos) continua exatamente sob ele depois de mudar a escala.
 */
function aplicarZoom(estado: Estado, escalaBruta: number, ancora: Ponto): Estado {
  const nova = Math.min(ESCALA_MAX, Math.max(ESCALA_MIN, escalaBruta));
  const k = nova / estado.escala;
  return {
    escala: nova,
    tx: ancora.x - k * (ancora.x - estado.tx),
    ty: ancora.y - k * (ancora.y - estado.ty),
  };
}

function distancia(a: Ponto, b: Ponto) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function meio(a: Ponto, b: Ponto): Ponto {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

export function useZoomPan({
  aoTocar,
  travarGestos = false,
}: {
  /** Chamado num toque limpo (sem arrastar), com a fração 0..1 da imagem. */
  aoTocar?: (fracao: Ponto) => void;
  /** Com o modo de comentário ligado, arrastar não move a imagem. */
  travarGestos?: boolean;
}) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const conteudoRef = useRef<HTMLDivElement | null>(null);

  const [viewport, setViewport] = useState<Medidas>({ w: 0, h: 0 });
  const [natural, setNatural] = useState<Medidas | null>(null);
  const [estado, setEstado] = useState<Estado>({ escala: 1, tx: 0, ty: 0 });
  const [arrastando, setArrastando] = useState(false);

  const base = useMemo<Medidas | null>(() => {
    if (!natural || viewport.w === 0 || viewport.h === 0) return null;
    const fator = Math.min(viewport.w / natural.w, viewport.h / natural.h);
    return { w: natural.w * fator, h: natural.h * fator };
  }, [natural, viewport]);

  const limitar = useCallback(
    (proximo: Estado): Estado => {
      if (!base) return proximo;
      return {
        escala: proximo.escala,
        tx: limitarEixo(proximo.tx, base.w * proximo.escala, viewport.w),
        ty: limitarEixo(proximo.ty, base.h * proximo.escala, viewport.h),
      };
    },
    [base, viewport],
  );

  // O enquadramento é derivado, não guardado: quando o palco ou a imagem
  // mudam de tamanho, a posição se reajusta sozinha no próximo render, sem
  // precisar de efeito nenhum.
  const enquadrado = useMemo(() => limitar(estado), [limitar, estado]);

  useEffect(() => {
    const elemento = viewportRef.current;
    if (!elemento) return;

    const observador = new ResizeObserver(([entrada]) => {
      const { width, height } = entrada.contentRect;
      setViewport({ w: width, h: height });
    });
    observador.observe(elemento);
    return () => observador.disconnect();
  }, []);

  const zoomPara = useCallback(
    (escalaBruta: number, ancora?: Ponto) => {
      const centro = ancora ?? { x: viewport.w / 2, y: viewport.h / 2 };
      setEstado((atual) => limitar(aplicarZoom(limitar(atual), escalaBruta, centro)));
    },
    [limitar, viewport],
  );

  const aumentar = useCallback(
    () => zoomPara(enquadrado.escala * 1.5),
    [enquadrado.escala, zoomPara],
  );
  const diminuir = useCallback(
    () => zoomPara(enquadrado.escala / 1.5),
    [enquadrado.escala, zoomPara],
  );
  const ajustarATela = useCallback(() => zoomPara(ESCALA_MIN), [zoomPara]);

  const deslocar = useCallback(
    (dx: number, dy: number) => {
      setEstado((atual) => {
        const agora = limitar(atual);
        return limitar({ escala: agora.escala, tx: agora.tx + dx, ty: agora.ty + dy });
      });
    },
    [limitar],
  );

  /**
   * Converte um ponto da tela na fração 0..1 da imagem. O
   * `getBoundingClientRect` do elemento já reflete translate e scale, então
   * não é preciso inverter transform nenhuma.
   */
  const fracaoDoPonto = useCallback((cliente: Ponto): Ponto | null => {
    const conteudo = conteudoRef.current;
    if (!conteudo) return null;

    const retangulo = conteudo.getBoundingClientRect();
    if (retangulo.width === 0 || retangulo.height === 0) return null;

    const x = (cliente.x - retangulo.left) / retangulo.width;
    const y = (cliente.y - retangulo.top) / retangulo.height;
    if (x < 0 || x > 1 || y < 0 || y > 1) return null;

    return { x: Number(x.toFixed(4)), y: Number(y.toFixed(4)) };
  }, []);

  /** Traz um ponto da imagem para o centro do palco. */
  const centralizarEm = useCallback(
    (fracao: Ponto) => {
      if (!base) return;
      setEstado((atual) => {
        const agora = limitar(atual);
        return limitar({
          escala: agora.escala,
          tx: viewport.w / 2 - fracao.x * base.w * agora.escala,
          ty: viewport.h / 2 - fracao.y * base.h * agora.escala,
        });
      });
    },
    [base, limitar, viewport],
  );

  /**
   * Centraliza só quando o ponto está fora da área visível. Escolher um
   * comentário que já está à vista não deve sacudir a imagem.
   */
  const garantirVisivel = useCallback(
    (fracao: Ponto) => {
      if (!base) return;

      const margem = 24;
      const x = enquadrado.tx + fracao.x * base.w * enquadrado.escala;
      const y = enquadrado.ty + fracao.y * base.h * enquadrado.escala;
      const visivel =
        x >= margem &&
        x <= viewport.w - margem &&
        y >= margem &&
        y <= viewport.h - margem;

      if (!visivel) centralizarEm(fracao);
    },
    [base, centralizarEm, enquadrado, viewport],
  );

  // A roda do mouse precisa de listener não-passivo: o onWheel do React é
  // registrado como passivo e o preventDefault() seria ignorado, deixando a
  // página rolar atrás do palco.
  useEffect(() => {
    const elemento = viewportRef.current;
    if (!elemento) return;

    const aoRolar = (evento: WheelEvent) => {
      evento.preventDefault();
      const retangulo = elemento.getBoundingClientRect();
      const ancora = {
        x: evento.clientX - retangulo.left,
        y: evento.clientY - retangulo.top,
      };
      // ctrlKey é como o pinch de trackpad do macOS chega aqui.
      const fator = Math.exp(-evento.deltaY * (evento.ctrlKey ? 0.01 : 0.0015));
      setEstado((atual) => {
        const agora = limitar(atual);
        return limitar(aplicarZoom(agora, agora.escala * fator, ancora));
      });
    };

    elemento.addEventListener("wheel", aoRolar, { passive: false });
    return () => elemento.removeEventListener("wheel", aoRolar);
  }, [limitar]);

  const ponteiros = useRef(new Map<number, Ponto>());
  const inicioDoToque = useRef<{ x: number; y: number; t: number } | null>(null);
  const pinch = useRef<{ distancia: number; escala: number; meio: Ponto } | null>(
    null,
  );

  const posicaoNoViewport = useCallback((evento: React.PointerEvent): Ponto => {
    const retangulo = evento.currentTarget.getBoundingClientRect();
    return {
      x: evento.clientX - retangulo.left,
      y: evento.clientY - retangulo.top,
    };
  }, []);

  const aoDescerPonteiro = useCallback(
    (evento: React.PointerEvent<HTMLDivElement>) => {
      evento.currentTarget.setPointerCapture(evento.pointerId);
      ponteiros.current.set(evento.pointerId, posicaoNoViewport(evento));

      if (ponteiros.current.size === 1) {
        inicioDoToque.current = {
          x: evento.clientX,
          y: evento.clientY,
          t: Date.now(),
        };
        pinch.current = null;
      }

      if (ponteiros.current.size === 2) {
        const [a, b] = [...ponteiros.current.values()];
        pinch.current = {
          distancia: distancia(a, b),
          escala: enquadrado.escala,
          meio: meio(a, b),
        };
        // Dois dedos nunca viram toque de comentário.
        inicioDoToque.current = null;
      }
    },
    [enquadrado.escala, posicaoNoViewport],
  );

  const aoMoverPonteiro = useCallback(
    (evento: React.PointerEvent<HTMLDivElement>) => {
      if (!ponteiros.current.has(evento.pointerId)) return;

      const anterior = ponteiros.current.get(evento.pointerId)!;
      const atual = posicaoNoViewport(evento);
      ponteiros.current.set(evento.pointerId, atual);

      if (ponteiros.current.size === 2 && pinch.current) {
        const [a, b] = [...ponteiros.current.values()];
        const novoMeio = meio(a, b);
        const fator = distancia(a, b) / pinch.current.distancia;
        const escalaInicial = pinch.current.escala;
        const deslocamentoX = novoMeio.x - pinch.current.meio.x;
        const deslocamentoY = novoMeio.y - pinch.current.meio.y;
        pinch.current.meio = novoMeio;

        setEstado((anteriorEstado) => {
          const agora = limitar(anteriorEstado);
          return limitar(
            aplicarZoom(
              {
                escala: agora.escala,
                tx: agora.tx + deslocamentoX,
                ty: agora.ty + deslocamentoY,
              },
              escalaInicial * fator,
              novoMeio,
            ),
          );
        });
        return;
      }

      if (ponteiros.current.size !== 1 || travarGestos) return;

      const dx = atual.x - anterior.x;
      const dy = atual.y - anterior.y;
      if (dx === 0 && dy === 0) return;

      setArrastando(true);
      deslocar(dx, dy);
    },
    [deslocar, limitar, posicaoNoViewport, travarGestos],
  );

  const aoSubirPonteiro = useCallback(
    (evento: React.PointerEvent<HTMLDivElement>) => {
      const eraUnico = ponteiros.current.size === 1;
      ponteiros.current.delete(evento.pointerId);
      if (ponteiros.current.size < 2) pinch.current = null;
      if (ponteiros.current.size === 0) setArrastando(false);

      const inicio = inicioDoToque.current;
      inicioDoToque.current = null;
      if (!eraUnico || !inicio) return;

      const percorreu = Math.hypot(
        evento.clientX - inicio.x,
        evento.clientY - inicio.y,
      );
      const demorou = Date.now() - inicio.t;
      if (percorreu >= DISTANCIA_DE_TOQUE || demorou >= TEMPO_DE_TOQUE) return;

      const fracao = fracaoDoPonto({ x: evento.clientX, y: evento.clientY });
      if (fracao) aoTocar?.(fracao);
    },
    [aoTocar, fracaoDoPonto],
  );

  return {
    viewportRef,
    conteudoRef,
    base,
    escala: enquadrado.escala,
    tx: enquadrado.tx,
    ty: enquadrado.ty,
    arrastando,
    definirNatural: setNatural,
    aumentar,
    diminuir,
    ajustarATela,
    deslocar,
    centralizarEm,
    garantirVisivel,
    fracaoDoPonto,
    handlers: {
      onPointerDown: aoDescerPonteiro,
      onPointerMove: aoMoverPonteiro,
      onPointerUp: aoSubirPonteiro,
      onPointerCancel: aoSubirPonteiro,
    },
  };
}
