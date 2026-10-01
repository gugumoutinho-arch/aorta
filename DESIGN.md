---
name: Biblioteca de Medicina
description: Índice de dedo — a biblioteca é um livro de referência do curso, com abas impressas na borda e entradas de sumário que terminam em "Abrir original".
colors:
  desk: "#e5e7eb"
  page: "#ffffff"
  page-2: "#f5f6f8"
  ink: "#15171c"
  ink-2: "#454954"
  ink-3: "#5a5f6c"
  rule: "#e3e5ea"
  rule-2: "#c9cdd5"
  edge: "#848a97"
  dots: "#b4b9c3"
  tab-hema: "#4338a8"
  tab-eosin: "#bb1d58"
  tab-giemsa: "#1762a8"
  tab-masson: "#22703a"
  tab-pas: "#8d2ea6"
  tab-safra: "#b13a0a"
  tab-neutral: "#565c69"
  tab-on: "#ffffff"
  hit: "#ffe066"
  focus: "#1762a8"
  danger: "#b42318"
  fav: "#9a5b00"
  dark-desk: "#08090b"
  dark-page: "#141519"
  dark-page-2: "#1b1c21"
  dark-ink: "#eceef2"
  dark-ink-3: "#9da1ac"
  dark-tab-hema: "#a99dff"
  dark-tab-eosin: "#ff8db5"
  dark-tab-giemsa: "#79bcff"
  dark-tab-masson: "#7fd892"
  dark-tab-pas: "#e19af2"
  dark-tab-safra: "#ffa46e"
  dark-tab-on: "#111216"
typography:
  chapter:
    fontFamily: "Literata, Georgia, serif"
    fontSize: "34px (celular) · 46px (computador)"
    fontWeight: 600
    lineHeight: 1.05
    letterSpacing: "-0.02em"
  section:
    fontFamily: "Literata, Georgia, serif"
    fontSize: "23px · 29px"
    fontWeight: 600
    lineHeight: 1.15
  entry:
    fontFamily: "Literata, Georgia, serif"
    fontSize: "17px · 18.5px"
    fontWeight: 560
    lineHeight: 1.36
  ui:
    fontFamily: "Schibsted Grotesk, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.45
  meta:
    fontFamily: "Schibsted Grotesk, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
  running-head:
    fontFamily: "Schibsted Grotesk, system-ui, sans-serif"
    fontSize: "11.5px"
    fontWeight: 400
    letterSpacing: "0.08em (versaletes)"
rounded:
  tab: "8px 0 0 8px"
  control: "10px"
  panel: "12px"
  sheet: "16px · 18px no topo da folha"
spacing:
  gutter: "16px"
  tabs: "52px (coluna do índice)"
  running-head: "56px · 64px"
  bar: "64px"
components:
  thumb:
    backgroundColor: "{colors.tab-eosin}"
    textColor: "{colors.tab-on}"
    rounded: "{rounded.tab}"
    width: "44px"
    height: "≥ 44px, proporcional aos materiais"
  open-original:
    textColor: "{colors.tab-eosin}"
    height: "44px"
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.page}"
    rounded: "{rounded.control}"
    height: "44px"
  button:
    backgroundColor: "{colors.page}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    height: "44px"
  detail-open:
    backgroundColor: "{colors.tab-eosin}"
    textColor: "{colors.tab-on}"
    rounded: "{rounded.panel}"
    height: "52px"
---

# Design System: Biblioteca de Medicina

## Overview

**Índice de dedo.** A biblioteca é um livro de referência do curso, como um atlas ou um dicionário médico. Modo **Operate**: achar ou retomar um material e abrir o original, quase sempre no celular.

Dois elementos só existem por causa deste conteúdo:

1. **O índice de dedo.** Na borda direita há uma aba impressa por matéria, com altura proporcional ao número de materiais (com dados na forma do catálogo real, 18:8). Tocar salta até a seção. Arrastar o polegar folheia assunto a assunto, com um balão que mostra onde se está. A aba da seção atual sobressai. Com a busca ativa, o índice mostra só onde há resultado. Quando não couber uma aba por matéria, o índice passa a ter uma por unidade, depois por módulo.
2. **O livro.** A composição é o percurso do curso: módulo (parte), unidade (capítulo), matéria (seção com o fio na cor da aba) e assunto (subseção em ordem de semana). Cada material é uma **entrada de sumário**: título, depois tipo e uma linha pontilhada até "Abrir original".

A **cabeça corrente** no topo diz onde você está ("M1 · CIS 1 — Placentação / Práticas Médicas"). No computador, o livro abre em duas páginas: sumário à esquerda (busca, refinar e árvore com contagens) e conteúdo à direita, com as abas na borda.

Recusa as cinco identidades anteriores: lâminas, editorial, prontuário, painel com trilho verde e pauta com quadro. Também recusa cartões repetidos, botões azuis em cada linha e uma busca-herói.

## Colors

Estratégia **contida**: papel branco, tinta preta e tintas de impressão por matéria.

- **Tintas das abas** (`tab-*`): a cor vem de `areas.stain` (hema, eosin, giemsa, masson, pas, safra; neutro sem coloração). Aparecem na aba do índice, no fio da seção, no nome do assunto, em "Abrir original" e na ficha. Contraste medido: texto da aba e link sobre a página entre 6,0:1 e 8,9:1 no claro e entre 7,8:1 e 10,8:1 no escuro.
- **Tinta** (`ink`): ações primárias ("Adicionar link", "Buscar", seleção de situação, filtro ativo).
- **Grifo** (`hit`): só os termos encontrados pela busca.

### Named Rules
- **A aba é da matéria.** Nenhuma outra cor marca matéria; nada de bolinhas ou faixas soltas.
- **Escuro é leitura noturna**, desenhado à parte: papel `#141519`, mesa `#08090b`, abas com tintas claras e texto escuro por cima.

## Typography

**Literata** (500–600, sem eixo óptico, para economizar 40 KB) nos títulos de capítulo, seção, material e ficha. **Schibsted Grotesk** (400–700) na interface, nos metadados e nas abas. Números em algarismos tabulares. Não há fonte monoespaçada.

As fontes carregam sem bloquear (`media="print"` + `onload`, `display=swap`). O LCP medido no celular foi de 1,3 s e o CLS de 0,002.

- Capítulo: Literata 600, 34/46 px.
- Seção: Literata 600, 23/29 px.
- Material: Literata 560, 17/18,5 px, altura de linha 1,36. Títulos de 73 caracteres cabem em 2–3 linhas sem corte, mesmo a 320 px.
- Assunto: Schibsted 650, 14 px, na tinta da matéria.
- Cabeça corrente e partes: versaletes a 11,5–12,5 px, com espaçamento de 0,08–0,12 em.

## Layout

- **Celular (<1000 px):**
  - Cabeça corrente fixa no topo, com 56 px. Tocar nela abre o sumário em folha.
  - Abaixo vêm a busca e o "Refinar".
  - O livro tem margem direita de 60 px para o índice, fixo à direita.
  - Barra inferior de 64 px: Índice, Sumário, Adicionar, Organizar.
- **Computador (≥1000 px):**
  - Folha centralizada de até 1300 px sobre a mesa: 340 px de sumário, o conteúdo e 52 px de índice.
  - A cabeça corrente fica fixa no topo da página da direita.
  - Uma sombra de dobra separa as páginas.
- **Primeira tela**, com dados na forma do real e sem histórico: 3 materiais completos no Início e em Todos, e 4 na matéria a 375×812. No computador, 5, 6 e 8.

## Elevation & Depth

Plano. A profundidade só aparece em três lugares:
- na folha do computador sobre a mesa (`--shadow`);
- na dobra entre as páginas;
- nos painéis e no balão do índice.

As abas não têm sombra: são tinta impressa.

## Shapes

- As abas têm canto arredondado só do lado do texto (8 px 0 0 8 px), como o recorte de um índice de dedo.
- Controles: 10 px. Painéis: 12 px. Folha inferior: 18 px no topo.

## Components

### Índice de dedo (`#thumbs`, `.thumb`)
- Cada aba é um link `#a-<área>` com a sigla (`areas.short` ou abreviação) e a contagem, e tem nome acessível completo (sigla, nome da matéria e contagem).
- Altura: `flex: n 1 44px`, nunca menor que 44 px.
- A aba atual recebe `aria-current="location"` e `translateX(-8px)`.
- **Folhear:** basta arrastar mais de 8 px no índice. O balão (`#bubble`) mostra a matéria e o assunto, e a página salta sem animação.
- Teclado: Tab chega às abas, ↑/↓/Home/End percorrem, Enter abre.

### Entrada de sumário (`.entry`)
- O título é um botão (`[data-mid]`) que abre a ficha; a área toda da linha também abre.
- `.e-line` traz tipo, situação, favorito, a linha pontilhada e `a.open`, que diz "Abrir original" e é sublinhado na tinta da matéria.
- Fora do livro (estantes do Início), a entrada mostra `.e-where`: a aba em miniatura, a localização e o assunto.

### Cabeça corrente (`.rh`)
- `#rh-path` mostra a localização em versaletes e `#rh-title` o nome da seção, atualizados pela rolagem.
- No celular, abre o sumário. No computador, leva o foco ao item atual do sumário.

### Sumário (`#toc-tree`, `#dlg-toc`)
- "Todos os materiais", módulo, unidade, matéria (com aba em miniatura e contagem) e assuntos (botões que levam à subseção).

### Ficha (`#dlg-detail`)
- Folha inferior no celular, painel à direita no computador.
- Leva a aba da matéria na borda (`#d-tab`).
- Hierarquia: localização em versaletes, título, "Abrir original" (botão na tinta da matéria), situação de estudo, dados com linha pontilhada, etiquetas, observações, o link e o aviso de que o arquivo continua onde está.
- No rodapé: Editar e "Remover do catálogo", com confirmação e Desfazer.

### Estados
- **Carregando:** esqueleto em forma de livro.
- **Busca sem resultado:** título e explicação de que a busca lê só metadados.
- **Capítulo vazio:** "Nenhum material ainda" + "Adicionar material", já com a área marcada.
- **Sem login e erro:** avisos no topo da página; a busca some porque não há catálogo.
- **Confirmação de remoção:** em linha, no vermelho de perigo.

## Motion

Curva de saída forte (`cubic-bezier(.23,1,.32,1)`), sempre abaixo de 300 ms:
- aba atual: 180 ms, só `transform`;
- fio de chegada da seção, ao saltar por aba ou sumário: `scaleX`, 280 ms;
- ficha: 220 ms no computador, 260 ms na folha do celular;
- toque em controles: `scale(.97)`.

O que não anima:
- o gesto de folhear e os saltos (seguem o dedo ou o teclado);
- a passagem do mouse só vale com ponteiro fino.

Com `prefers-reduced-motion`, nada se move e os painéis só esmaecem (150 ms).

## Do's and Don'ts

### Do:
- Derivar livro, abas e sumário dos dados (`areas`, `subject`, `period`). Nada fixo no código.
- Ordenar assuntos pelo ordinal ("1ª semana" → "1ª e 2ª semanas" → "2ª semana"), depois em ordem alfabética.
- Manter "Abrir original" com texto em toda entrada, alvos de 44 px e contraste de 4,5:1 nos dois temas.

### Don't:
- Cartões repetidos, botões cheios em cada linha, busca como herói ou mapa que vira obstáculo.
- Gravar atributos `data-view` fora das seções de tela: a rota esconde todo `[data-view]` que não é a tela atual. Por isso o `<body>` usa `data-mode`.
- Pôr texto `.sr` dentro de elemento rolável ou fixo sem ancestral posicionado (já causou rolagem lateral).
- Usar link arrastável no índice: o arrasto nativo cancela o gesto. As abas usam `draggable="false"`.

## Para o Codex

- **Fonte única:** `index.html`.
- **Produtores (JS):**
  - `entry`, `feature`, `shelf`, `renderHome`;
  - `bookOf` (estrutura do livro), `subsOf`, `secNode`, `renderBook`;
  - `renderThumbs` (com o recuo para unidade/módulo), `tocTree`, `renderToc`;
  - `spy` (posição atual), `goTo` (salto com o fio de chegada);
  - o gesto de folhear (bloco logo após `renderLibrary`), `renderDetail`, `openToc`.
- **Rotas:** `#inicio` (estantes + livro), `#todos` (livro desde o começo), `#a-<id>` (livro aberto na área; `#a-sem-area` para material sem área), `#organizar`. O salto acontece em `renderLibrary` via `S.pendingGo`.
- **Ids que os testes usam:** `#lib-q`, `#more`, `#f-*`, `#active-filters`, `#result-line`, `#clear-filters`, `#home-focus`, `#h-feature`, `#lib-results`, `#thumbs`, `#bubble`, `#rh-title`, `#rh-path`, `#rh-where`, `#dlg-toc`, `#toc-tree`, `#dlg-detail`, `#d-fav`, `#d-foot`, `#d-rm-yes`, `[data-mid]`, `.tabbar [data-action]`.
- **Testes:**
  - `tools/flows.mjs` (fluxos);
  - `_fora-do-site/remodelacao/v2/verificar-indice.mjs` (primeira tela, índice, sumário, contraste, 320/768 px);
  - `_fora-do-site/remodelacao/v2/adversarial.mjs` (tarefa e clique em cada controle).
- **Uma matéria nova** escolhe uma das seis colorações; não crie tintas soltas.
