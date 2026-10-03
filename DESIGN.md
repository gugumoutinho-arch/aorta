---
name: Aorta
description: Coração-mapa — o curso como um coração em que cada artéria é um módulo; folhas de material, busca por atalho e tema claro desenhado.
---

# Aorta — sistema visual implementado

## Fundamentos v5 — 03/10/2026

Espaçamento `--space-1…8`: 4, 8, 12, 16, 24, 32, 48 e 64 px. Raios pequeno/cartão/painel/pílula: 6/10/14/99 px. Elevações `--elevation-card` e `--elevation-panel` usam a sombra do tema. A migração trocou só medidas equivalentes (o valor do token é igual ao número que substituiu); nada mudou na tela.

Tempos de movimento em `tokens.css` (`--motion-enter` 720 ms, `reveal` 480, `swap` 320, `exit` 180, `release` 240, `press` 100); `src/ui/tokens.js` lê os mesmos valores em segundos para o GSAP, com padrões iguais caso a folha ainda não tenha carregado. As curvas continuam as do v4. Reservas de espaço contra CLS e ajustes tipográficos ficaram para a fase de desempenho (F4).

## Refino v4 — ramo local `prototipo-v4`, 02/10/2026

- **IDOMED:** coração, módulos e identidade Aorta preservados.
- **Medicina geral:** corpo inteiro, disciplinas em duas colunas equilibradas, rótulos Schibsted completos, introdução mais estreita para dar espaço ao mapa. Título “A medicina ganha corpo”. A distribuição é visual; não restringe uma disciplina ao órgão associado.
- **Navegação:** abas escolhem também o mapa; links diretos sincronizam o acervo. Removido o seletor flutuante de conceitos.
- **Movimento:** mola amortecida sem loop ocioso no cursor, inclinação do modelo e resposta dos cartões; pressão de botão mantida até soltar. Entradas de órgãos por opacidade, mantendo o volume. Mergulho de 650 ms, interrompível por Esc, novo destino ou outra navegação. Transição de título de 480 ms, sem entrada concorrente do mesmo título.
- **Tema claro do órgão:** token da disciplina aplicado corretamente; shader limita a luz de borda para preservar a cor da parte selecionada.
- **Referência de layout:** sem referência externa nova; evolução do V4 existente segundo a escolha do dono. Orientação de movimento das skills ECC `make-interfaces-feel-better` e `motion-patterns`, usando apenas GSAP/Three já instalados.

| Antes | Agora |
|---|---|
| Conceito independente do acervo | Coração no IDOMED, corpo na Medicina geral |
| Rótulos agrupados perto dos órgãos | Duas colunas com espaçamento distribuído |
| Ponteiro reinicia tween a cada evento | Mola mantém continuidade e velocidade |
| Botão retorna antes de soltar | Pressionado enquanto o gesto dura |
| Câmera termina uma navegação já abandonada | Interrupção invalida o destino pendente |

As seções seguintes descrevem a base v3 que foi preservada; os ajustes acima prevalecem no ramo v4.

Atualizado em 02/10/2026 por Claude, na migração para Vite. Implementa a v3 do Codex (protótipo em `versoes/prototipos-2026-10-02/aorta-v3/`) sobre o site real, com as correções da revisão. A fonte das regras é a skill `.claude/skills/aorta-design/SKILL.md`; este arquivo descreve **o que está no código**. O sistema anterior ("Atlas digital", estante de capas, índice de dedo) está em `versoes/claude-2026-10-02-antes-vite.html`.

## Direção

Escuro arroxeado como fundo, violeta como luz, carmim como ação e fluxo, creme no texto. O início é um mapa do curso: um coração anatômico translúcido (HuBMAP, CC BY 4.0, crédito no rodapé) em que cada artéria é um módulo. O pulso de luz só corre nas artérias de módulos com material; sem material, a artéria é tracejada ("Em produção", deduzido dos dados). As artérias são traçado estilizado, e isso está dito no rodapé.

## Tokens (`src/styles/tokens.css`)

Todas as cores ficam ali, com o escuro em `:root`, o claro em `@media (prefers-color-scheme: light)` (sem `data-theme`) e em `[data-theme="light"]`. Nenhum hexadecimal fora desse arquivo (o `check` confere).

| Token | Escuro | Claro | Uso |
|---|---|---|---|
| `--bg` | #0d0817 | #f6eee8 | página e `theme-color` |
| `--surface` / `--paper` | #1a1030 / #221632 | #ede2dd / #fffaf4 | campos / folhas, cartões, diálogos |
| `--text` / `--muted` | #f6eee8 / #b4a6c4 | #301930 / #6b5266 | texto / texto secundário |
| `--line` / `--line-strong` | #3d2e52 / #5a4775 | #dccbcd / #b9a2aa | divisórias / bordas de controle |
| `--action` | #ff4f7e | #a9204b | ação principal (Abrir original, busca) |
| `--flow` | #ff8fb0 | #a9204b | itálico do título, links, pulso |
| `--violet-2` / `--focus` | #c9b8ff | #5b3a8a | foco, segmento ativo |
| `--m1` … `--m8` | violeta, rosa, lilás, verde-água, âmbar, azul, rosa-claro, oliva | versões escuras de mesma família | cor de cada módulo/artéria (rodízio a partir do nono) |
| `--atrium` / `--ventricle` / `--valve` | — | — | materiais do coração 3D (relidos ao trocar o tema) |

## Tipografia

Literata (títulos, numerais de módulo, títulos de material), Schibsted Grotesk (interface e, pelo token `--label`, os rótulos técnicos em caixa alta "ART. 01" e tipos de material, com números tabulares). Google Fonts com `display=swap`.

## Telas

- **Início** (`#inicio`, `src/views/home.js` + `map.js`): título em dois tons com "hoje?" em itálico; placa de busca clara que abre a busca rápida; números reais (materiais, módulos com material); "Continuar" com o último material aberto; coração-mapa com rótulos tipográficos ("ART. 01 / M1 / 4 materiais") em duas colunas, cada um do lado em que a artéria termina, ligados por linhas-guia finas à ponta da artéria; "Módulos do curso" (índice com unidades e artéria; os em produção numa linha à parte); "Sua mesa de estudo" (em estudo e favoritos) e "Acabou de chegar". No celular, o "Continuar" vem depois do coração, para não empurrar o mapa quando os dados chegam.
- **Módulo** (`#a-<área>`, `#todos`, `src/views/module.js`): numeral grande na cor da artéria, "ART. 01 · DESCENDENTE ANTERIOR", resumo real (materiais, unidades, quais estão em produção), mini-artéria; unidades em abas; matérias ao lado (fichas em pílula no celular); busca e filtros (tipo, situação, coleção, ordem, favoritos) com chips removíveis; folhas agrupadas por matéria (ou por assunto, com uma matéria escolhida). `#todos` usa a mesma tela com os módulos como abas. A rota `#a-<id>` de uma unidade ou matéria abre o módulo já com ela escolhida.
  - **Abas de assunto** (`src/views/topic-tabs.js`, lógica em `src/domain/topics.js`):
    - **o que aparece:** com uma matéria escolhida que tem assuntos cadastrados, surge acima da busca uma faixa "Todos · assuntos da matéria (na ordem do editor, com contagem; zero = "—", em produção) · Casos clínicos" (só se houver caso);
    - **visual:** mesma pílula deslizante das abas de acervo; no celular a faixa rola de lado e a aba ativa é trazida à vista sem mexer na página;
    - **endereço:** cada aba tem o seu (`#a-<matéria>/<slug>`, `#a-<matéria>/casos`); slug antigo de assunto renomeado continua funcionando e é corrigido, aba inexistente volta a "Todos";
    - **agrupamento:** um caso clínico aparece na aba do seu assunto e em "Casos clínicos"; em "Todos" aparece uma vez, no grupo do primeiro assunto;
    - **sem assuntos no banco:** a tela é a de antes.
- **Ficha** (`src/views/detail.js`): painel à direita no computador, folha que sobe no celular (arrastar a alça para baixo fecha). Onde fica, título completo, assunto, favorito, situação em segmentos, "Abrir original" em carmim, aviso de que o site guarda o link, período, coleções, etiquetas, observações, "Origem e datas", e para quem edita Editar e Remover (com aviso de que o original não é apagado e Desfazer).
- **Busca rápida** (Ctrl/⌘+K, "/" fora do módulo, placa e lupa): materiais, matérias/unidades e módulos; sem acento e sem maiúscula; grifo do termo; setas, Enter e Esc; sem resultado, sugere os módulos que têm material.
- **Organizar** (`#organizar`) e **formulário** de material: mesmas funções de antes, no visual Aorta.

## Movimento (GSAP, sempre interrompível)

- Coração: entrada crescendo até o tamanho (1,1 s, expo.out); batimento "lub-dub" (átrios 0,12 s, ventrículos a partir de 0,16 s com retorno elástico); pulso de luz de 1,1 s nas artérias irrigadas; repouso a cada 2,6 s, pausado fora da tela, com a aba escondida ou pelo botão "Pausar batimento". Apontar ou focar um rótulo realça a artéria e dispara o pulso só nela. Render sob demanda.
- Do coração ao módulo: o nome tocado voa até o numeral do cabeçalho (0,7 s, expo.inOut) e o cabeçalho entra em cascata. Voltar devolve a rolagem e o foco ao rótulo de onde se veio.
- Diálogos: entrada 0,32 s expo.out, saída 0,18 s; com teclado ou movimento reduzido, troca direta.
- Estrela: salto de 280 ms que continua se o item for redesenhado.
- Movimento reduzido: sem coração 3D (mapa em linhas), sem voo, sem deslocamentos; o resto funciona igual.

## Desempenho

A primeira tela não depende do 3D. Three.js (~138 kB gz) e o modelo (4 MB) só carregam depois do `load`, com o navegador ocioso; a montagem devolve a vez ao navegador entre etapas; shaders compilam em paralelo quando possível; o traçado das artérias vem pré-calculado (`src/heart/arteries.json`). Sem WebGL, aparelho econômico (`deviceMemory ≤ 2`, `saveData`) ou modelo indisponível: mapa em linhas, com aviso discreto. Lighthouse (dados fictícios, 02/10/2026): celular 95, computador 99; acessibilidade e boas práticas 100.

## Para Codex e Claude

- Preserve `window.claude.use("db")`, `supaDb()`, campos, RLS, login e rotas.
- O catálogo guarda links. Remover mantém o original; Desfazer permanece.
- Favoritos e situação continuam sendo campos do catálogo (do dono), não progresso individual de cada aluno. Mudar isso é decisão de produto e de banco, separada do visual.
- `[data-edit]` marca toda ação de edição (Adicionar, Organizar, Editar, Remover); a regra que as esconde de quem não edita entra com a rodada de acesso aberto.
