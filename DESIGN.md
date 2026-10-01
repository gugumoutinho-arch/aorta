---
name: Biblioteca de Medicina
description: Pauta e marca-texto — o quadro do semestre impresso, com a busca no centro e os termos encontrados grifados.
colors:
  paper: "#f5f6f8"
  sheet: "#ffffff"
  fill: "#eef1f5"
  rule: "#dde2ea"
  rule-strong: "#b4bdcc"
  edge: "#7c8699"
  ink: "#141b2d"
  ink-2: "#424b62"
  ink-3: "#576075"
  pen: "#1d43c4"
  pen-hover: "#1636a3"
  pen-soft: "#e7ecff"
  hit: "#ffe45c"
  band-hema: "#dccbff"
  band-eosin: "#ffc3de"
  band-giemsa: "#b9e1ff"
  band-masson: "#c4efb2"
  band-pas: "#ffd3a8"
  band-safra: "#aeeee4"
  band-neutral: "#e2e6ed"
  danger: "#b42318"
  danger-bg: "#fde8e6"
  fav: "#9a5b00"
  dark-paper: "#0e121a"
  dark-sheet: "#151a25"
  dark-ink: "#e8ecf5"
  dark-pen: "#93abff"
  dark-hit: "#f2d64b"
typography:
  ask:
    fontFamily: "Atkinson Hyperlegible Next, system-ui, sans-serif"
    fontSize: "1.625rem (celular) · 2rem (tablet) · 2.25rem (computador)"
    fontWeight: 800
    lineHeight: 1.12
    letterSpacing: "-0.025em"
  heading:
    fontFamily: "Atkinson Hyperlegible Next, system-ui, sans-serif"
    fontSize: "1.0625rem–2.25rem"
    fontWeight: 750
    lineHeight: 1.2
    letterSpacing: "-0.015em"
  title:
    fontFamily: "Atkinson Hyperlegible Next, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 700
    lineHeight: 1.3
  body:
    fontFamily: "Atkinson Hyperlegible Next, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  meta:
    fontFamily: "Atkinson Hyperlegible Next, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.45
  number:
    fontFamily: "Atkinson Hyperlegible Mono, ui-monospace, monospace"
    fontSize: "0.75rem–0.8125rem"
    fontWeight: 500
rounded:
  sm: "8px"
  md: "12px"
  field: "14px"
  sheet: "16px"
  pill: "22px"
spacing:
  line: "28px"
  gutter: "16px"
  gap: "8px"
  section: "18px"
components:
  button-primary:
    backgroundColor: "{colors.pen}"
    textColor: "{colors.sheet}"
    rounded: "{rounded.sm}"
    height: "44px"
    padding: "0 18px"
  button-primary-hover:
    backgroundColor: "{colors.pen-hover}"
  button:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    height: "44px"
  open-original:
    backgroundColor: "{colors.pen}"
    textColor: "{colors.sheet}"
    rounded: "{rounded.sm}"
    height: "44px"
    padding: "0 14px"
  search-field:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
    rounded: "{rounded.field}"
    height: "56px"
  subject-chip:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    height: "44px"
  subject-chip-pressed:
    backgroundColor: "{colors.pen-soft}"
    textColor: "{colors.pen}"
  quadro-cell-active:
    backgroundColor: "{colors.pen-soft}"
    textColor: "{colors.pen}"
---

# Design System: Biblioteca de Medicina

## Overview

**Pauta e marca-texto.** A interface é o quadro do semestre impresso: papel sulfite frio pautado em azul-acinzentado, tinta azul-marinho, e o gesto de quem estuda, que grifa com marca-texto. Modo **Operate**: achar ou retomar um material e abrir o original no Drive, quase sempre no celular.

Dois elementos só existem por causa deste conteúdo:
1. **A busca com marca-texto.** O campo grande é a primeira coisa da tela. Os termos encontrados aparecem grifados nos títulos e assuntos, e os assuntos do curso ficam a um toque, em ordem de semana.
2. **O quadro.** A estrutura do curso vira uma grade de horários: matéria × assunto (na matéria), matéria por faixa (na unidade), unidades (no módulo e no início). O conteúdo vem dos campos `areas` e `subject`; nada é fixo no código.

Recusa: trilho lateral + cartões brancos + lista + filtros (as quatro identidades anteriores), caixa alta condensada, números grandes, manchas e escrita à mão.

## Colors

Estratégia **contida**: neutros frios, um azul de caneta e faixas de marca-texto.

### Primary
- **Azul-caneta** (`pen` #1d43c4; escuro #93abff): **tinta reservada**. Só a ação principal ("Abrir original", "Buscar", "Adicionar link") e a seleção ativa (aba de módulo, célula do quadro, assunto escolhido). Nunca decorativo.

### Secondary
- **Marca-texto das matérias** (`band-*`): a cor de cada matéria vem de `areas.stain` (hema → lilás, eosin → rosa, giemsa → azul, masson → verde, pas → laranja, safra → verde-água). Aparece só como faixa atrás do nome da matéria (`.band`), sempre com tinta escura por cima (contraste mínimo medido: 11,5:1 no claro e 7,6:1 no escuro).
- **Grifo da busca** (`hit` #ffe45c; escuro #f2d64b com tinta #141b2d): reservado aos termos encontrados (`mark.hit`) e à seleção de texto.

### Neutral
- `paper` (fundo pautado), `sheet` (folhas: listas, quadro, painéis), `fill` (trilhos e esqueletos), `rule`/`rule-strong` (pautas e divisórias), `edge` (borda de campos e seletores, ≥3:1), `ink`/`ink-2`/`ink-3` (texto; `ink-3` ≥4,5:1 nos dois temas).

### Named Rules
- **Tinta reservada:** o azul não marca nada que não seja ação ou seleção.
- **Faixa, não ponto:** a matéria é grifada, nunca representada por bolinhas, bordas coloridas ou fundos inteiros.
- **Tema escuro é lousa:** papel #0e121a, folha #151a25, faixas translúcidas fluorescentes e grifo amarelo sólido com tinta escura.

## Typography

**Atkinson Hyperlegible Next** (interface e materiais, pesos 400–800) e **Atkinson Hyperlegible Mono** (só números: contagens, datas e a tecla "/"). Google Fonts com `display=swap`; CLS medido de 0,032 no celular.

### Hierarchy
- **Pergunta** (`.ask`, 800, 1,625–2,25rem, −0,025em): "Qual material você procura?". É o único título grande do início.
- **Títulos de seção** (750–800, 1,0625rem): sempre em caixa normal, sem rótulo acima.
- **Título do material** (700, 1,0625rem, 1,3): é o protagonista da linha; títulos de 70+ caracteres quebram em 2–3 linhas sem cortar.
- **Meta** (400, 0,875rem, `ink-2`/`ink-3`): matéria grifada, tipo e assunto.
- **Números** (Mono 500, 0,75–0,8125rem, `ink-3`): pequenos, nunca competindo com títulos.

## Layout

- **Pauta de 28px** (`--line`) no fundo do papel e das folhas vazias. O ritmo vertical acompanha a pauta.
- **Celular (<760px):** cabeçalho compacto (marca + abas de módulo com sublinhado deslizante), barra inferior de 60px (Início, Acervo, Adicionar, Organizar), gutter de 16px. No início: pergunta → campo → assuntos (faixa rolável) → materiais. O quadro sangra até as bordas.
- **Tablet (≥760px):** cabeçalho em uma linha com "Organizar" e "Adicionar link"; filtros em linha; assuntos quebram em várias linhas; o quadro vira grade.
- **Computador (≥1080px):** sem trilho lateral. No início, busca e resultados à esquerda e o "Quadro do curso" à direita, fixo ao rolar. O detalhe é um painel à direita.
- **Linhas de material** usam container query: abaixo de 540px de largura, "Abrir original" vai para baixo do título; acima, fica à direita.

## Elevation & Depth

Plano por padrão: folhas com borda `rule-strong`. Elevação só onde há interação ou sobreposição:
- `--lift` no campo de busca e no destaque "Aberto por último";
- `--shadow` nos painéis (`<dialog>`) e nos avisos.

Sombras com a cor da tinta, nunca preto puro.

## Shapes

- Raio de 8px em botões, campos e células, de 12px nas folhas, de 14px no campo grande e de 16–18px nos painéis e na folha inferior. Os assuntos são pílulas (22px).
- O grifo é um retângulo de cantos de 2px que ocupa 12–90% da altura da linha: nítido, sem desfoque.

## Components

### Buttons
`.btn` (44px, borda `rule-strong`), `.btn.primary` (azul-caneta), `.btn.ghost` (sem borda), `.btn.danger`. Toque: `scale(.97)` em 140ms. A passagem do mouse só vale com ponteiro fino.

### Abrir original
`.open`: sempre com o texto "Abrir original" e o ícone de nova aba. É a ação principal de cada material, separada do clique no título (que abre os detalhes).

### Inputs / Fields
Borda `edge` (≥3:1), raio de 8px, 44px. O campo do início tem 56px, borda de 2px na cor da tinta, `--lift` e a dica "/".

### Navigation
- **Abas de módulo** (`.modtab`): um único sublinhado azul (`.tab-ink`) desliza até a aba atual, só com transform e em 240ms.
- **Migalhas** acima do título da área.
- **Barra inferior** no celular.

### Quadro (componente assinatura)
`.quadro > .q-row > .q-head + .q-cells > .q-cell`. Célula com nome (700), faixas das matérias (quando a célula é uma unidade) e contagem em Mono. Uma célula de assunto é um botão `aria-pressed`, que filtra; a de área é um link. A célula ativa usa `pen-soft` e uma barra de 3px de azul-caneta embaixo. No celular, as células ficam numa faixa rolável; do tablet para cima, viram uma grade de verdade.

### Busca com marca-texto (interação assinatura)
- Digitar em `#home-q` mostra até 8 resultados em `#home-live`, com os termos grifados. A busca ignora acentos e usa só metadados: título, área, assunto, tipo e etiquetas.
- Os assuntos (`#home-subjects`) preenchem a busca com um toque; um segundo toque limpa.
- Teclado: "/" foca a busca, ↓ vai ao primeiro resultado, ↑/↓ percorrem os resultados, Esc volta ao campo, Enter abre os detalhes.
- Leitor de tela: só a contagem é anunciada (`#home-live-status`).

### Chips
- Situação: "Em estudo" em `pen-soft`; "Revisado" com contorno e ✓.
- Filtros ativos (`.af`): pílula azul removível.

### Cards / Containers
Listas (`.list`) são folhas com divisórias; a grade alternativa (`.grid`) usa folhas pautadas. Nada de cartão dentro de cartão.

## Motion

Uma assinatura e transições curtas, sempre com curva de saída forte (`--ease-out` cubic-bezier(.23,1,.32,1)):
- **Varredura do grifo** (`grifo`, scaleX, 260ms, escalonada em 40/80ms): **só** quando um assunto é tocado (classe `.grifar`). Digitar nunca anima.
- Sublinhado das abas: 240ms. Painel: 220ms, entrando da direita. Folha inferior: 260ms (`--ease-drawer`). Diálogo: 200ms.
- Filtrar por célula do quadro usa View Transitions (cruzamento de 200ms), quando o navegador tem suporte.
- `prefers-reduced-motion`: sem deslocamento nem varredura; os painéis só esmaecem (150ms).

## Do's and Don'ts

### Do:
- Mostrar "Abrir original" com texto em todo material.
- Derivar quadro e assuntos dos dados; ordenar assuntos pelo número ordinal ("1ª semana" → "1ª e 2ª semanas" → "2ª semana"), depois em ordem alfabética.
- Usar faixas de marca-texto para matérias e o grifo amarelo só para termos encontrados.
- Manter alvos de 44px, foco visível e contraste de 4,5:1 nos dois temas.

### Don't:
- Trilho lateral, cartões brancos soltos e filtros empilhados como estrutura da página.
- Caixa alta condensada, números grandes, rótulos acima de títulos, manchas, desfoque, vidro ou escrita à mão.
- Animar o grifo durante a digitação ou qualquer ação de teclado frequente.
- Texto `.sr` com posição absoluta dentro de faixa rolável sem um ancestral `position:relative` (causa rolagem lateral).

## Para o Codex

- **Fonte única:** `index.html` (fragmento). O CSS deste sistema está todo no `<style>`. O protótipo e o rascunho do CSS ficam em `_fora-do-site/remodelacao/prototipo/sistema.css` (descartável; o `index.html` é a verdade).
- **Produtores de marcação (JS):** `entry`, `metaLine`, `marked` (grifo sem `innerHTML`), `feature`, `renderSubjects`, `renderLive`, `renderDirectory` (quadro do curso), `renderQuadro` + `pickSubject`, `renderActiveFilters`, `renderDetail`, `placeInk`.
- **Estado novo:** `S.hq` (busca do início), `S.f.subject` (filtro de assunto; `NO_SUBJ` para "sem assunto"), `S.keepF` (preserva o filtro ao navegar a partir do quadro), `S.grifar` (anima o grifo só no toque).
- **Ids que os testes usam:** `#home-q`, `#home-live`, `#home-subjects`, `#home-focus`, `#home-directory`, `#quadro`, `#lib-q`, `#lib-results`, `#active-filters`, `#more`, `#f-*`, `#clear-filters`, `#dlg-detail`, `#d-fav`, `#d-foot`, `#d-rm-yes`, `[data-mid]`, `[data-layout]`. Mudou um? Atualize `tools/flows.mjs` e `_fora-do-site/remodelacao/verificar-assinatura.mjs`.
- **Cores só por tokens.** Uma matéria nova usa uma das chaves de `stain`; não crie cores soltas.
- **Antes de entregar:** `npm run check`, `node flows.mjs` (em `tools/`) e `node verificar-assinatura.mjs` (em `_fora-do-site/remodelacao/`).
