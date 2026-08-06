# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Donos de Workspace: agências, estúdios e profissionais autônomos de design/criação/marketing que produzem materiais criativos (imagens, PDFs) para clientes. Cada Workspace tem um único dono — sem múltiplos membros de equipe no MVP. O segundo público é o cliente final da agência/estúdio: acessa e aprova materiais por um link direto, sem conta e sem login.

## Product Purpose

Centralizar a aprovação de materiais criativos com clientes num link direto, substituindo e-mail, WhatsApp e PDFs perdidos. Sucesso é o cliente conseguir ver e aprovar (ou pedir ajuste) um material rapidamente, sem fricção de login ou canais dispersos.

## Positioning

O diferencial é o acesso do cliente sem login: um link direto para a Pasta/Projeto onde ele aprova cada Asset. Não é uma ferramenta de gestão de projeto completa, nem um lugar para anotação/desenho sobre a peça — é o caminho mais curto entre "material pronto" e "cliente aprovou".

## Operating Context

Fluxo hoje: o dono cria Empresa → Workspace → Projetos → Pastas dentro do Workspace, e sobe Assets (imagem ou PDF, até 20MB) nas Pastas. Próxima etapa do roadmap: o dono compartilha um link público da Pasta/Projeto com o cliente; o cliente abre sem login e vê os Assets ali.

## Capabilities and Constraints

- MVP: 1 usuário dono por Workspace, sem múltiplos membros de equipe.
- Acesso do cliente é só por link direto, sem login/conta de cliente.
- Sem desenho/anotação sobre a peça.
- Sem múltiplas versões ou comparação de versões.
- Sem preview de código/site — só imagem e PDF.
- Upload de Assets até 20MB, armazenado em bucket privado do Supabase Storage com URL assinada.

## Evidence on Hand

Produto pré-lançamento: ainda não há clientes reais, depoimentos, casos de uso ou métricas de uso. Não inventar depoimentos, logos de clientes ou números — só existe o site no ar (https://aprova-lemon.vercel.app/) e o próprio dono testando.

## Product Principles

- Sem fricção para o cliente: nada de cadastro, senha ou app para aprovar algo.
- Uma etapa de cada vez: o MVP corta recursos (anotação, múltiplas versões, times) para lançar rápido e simples.
- Verde é sinal de aprovação, não decoração — reforça a clareza do estado de cada material.
- O link é a fonte da verdade da aprovação, substituindo e-mail/WhatsApp/PDF.

## Accessibility & Inclusion

Sem requisito formal definido além das boas práticas padrão do shadcn/ui.
