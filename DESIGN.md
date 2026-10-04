---
name: Aorta
description: Coração-mapa — o curso como um coração em que cada artéria é um módulo; folhas de material, busca por atalho e tema claro desenhado.
---

# Aorta — sistema visual implementado

## Lapidação visual (série L) — 05/10/2026

A regra: **embelezar é mudar o acabamento, nunca o esqueleto.** Estrutura, textos e comportamento ficam; muda como as coisas aparecem.

- **Tipografia:**
  - Literata com eixo óptico (`font-optical-sizing: auto`) e títulos com `text-wrap: balance`.
  - **Rótulo editorial = Literata itálica** (seções, grupos, legendas, etiquetas da ficha).
  - **Caixa alta só para códigos técnicos:** "ART. 01", "M1" e o tipo do material.
- **Carmim parado só em 3 papéis:** ação principal (1 por tela), fluxo da artéria e palavra de destaque do título.
  - Em interação (apontar, foco), pode acender: ex., "Abrir original" da linha.
  - Estados de leitura e navegação ficam em violeta.
- **Molduras:** tipografia e fio no lugar de caixa.
  - Fio = `var(--hairline)` (1 px; 0,5 px em telas 2x), na cor `--line`/`--hair`. Campos e botões mantêm 1 px.
  - Contorno só em campos, cartões, ficha, paleta e menus.
- **Raios:** 6 (controles), 12 (cartões), 16 (painéis), pílula.
- **Materiais:**
  - realce interno `--inset-light` e sombra `--shadow-float`;
  - luz do palco em camadas (`--glow-core`, `--glow-halo`, em oklab);
  - grão de filme (ruído SVG embutido, sobre a página, sem clique);
  - sem desfoque de vidro: na barra inferior, custava tempo de bloqueio no celular simulado.
- **Desempenho do acabamento:** o grão entra 2,5 s depois da carga e de uma vez (`html.fx-on`, em `main.js`). Desde o início, atrasava o LCP em ~0,3 s no celular simulado; com fade, somava tempo de bloqueio.
- **Coração:**
  - borda (fresnel) estreita e luminosa, miolo fundo, pontilhado contra faixas;
  - halo nas artérias com material;
  - no 3D, o desenho avança sob a borda interna das colunas de rótulos (`reach3d`: 0,85 ≥ 1200 px e 0,9 abaixo), medido sem guias cruzadas com 8 rótulos. O mapa em linhas mantém a coluna inteira.
- **Módulo:** numeral com luz (degradê na cor do módulo; alto contraste volta ao sólido) e miniatura do coração com a artéria acesa.
- **Movimento:** sem o anel do cursor. Microinterações em CSS, só em `@media (hover: hover)`; movimento reduzido desliga tudo.
- **Corte lateral no `body`** (não no `main`): brilhos de borda a borda não terminam numa linha reta.


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

- **Início** (`#inicio`, `src/views/home.js` + `home-index.js` + `map.js`; direção D, rodada B):
  - **Palco:** brilho radial (`--stage-glow`) atrás do mapa e a linha "Feito por estudantes · links para os originais · sem vínculo oficial com a IDOMED".
  - **Título grande:** "O curso inteiro, *irrigado* por bons materiais." no IDOMED; "A medicina ganha *corpo*." no geral.
  - **Abaixo do título:** o texto curto, a placa creme de busca ("Buscar entre N materiais e M assuntos", ⌘K no quadrado carmim), os números e o "Continuar" (painel translúcido; sem histórico, "Comece por aqui").
  - **Mapa:** coração ou corpo com os rótulos como painéis translúcidos sem desfoque ("ART. 01 · M1" / nome da artéria / contagem), em duas colunas ligadas por linhas-guia.
  - **Ao rolar, editorial:** índice numerado (grupo por módulo, linha por matéria com os assuntos e a contagem; números de materiais, assuntos e casos à esquerda) e a prateleira "Casos clínicos", o ÚNICO lugar com cartões grandes. Mesa de estudo, recentes, livros, próprios e internet viram listas em linhas.
  - **No celular:** palco compacto (título curto, busca, coração menor com um rótulo, "Continuar" abaixo) e barra inferior (Início, Mapa → índice, Favoritos, Buscar).
  - **Textos do acervo:** ficam em `window.aortaCopy` (`index.html`) e são aplicados antes da primeira pintura.
  - **Fontes substitutas:** com `size-adjust` medido; o CLS fica ≤ 0,03.
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

## Movimento (GSAP, sempre interrompível) — coreografia da rodada B

Toda animação responde "por quê?": orientar, dar continuidade espacial ou confirmar uma ação. Nada atrasa a tarefa: o teclado nunca espera animação, e o conteúdo novo é escrito na hora (só a pintura acompanha). Os tempos vêm de `tokens.css` (`--motion-*`), e o GSAP os lê por `src/ui/tokens.js`. Os utilitários ficam em `src/ui/choreo.js` (`enter`, `exit`, `swap`, `press`, `respond`, `cascade`) e `src/ui/motion.js` (`revealIn`, título por linhas, contadores). O `check` reprova duração literal e curva que só acelera na interface (`tools/motion-rules.mjs`).

| Categoria | Tempo (token) | Curva | Distância | Interrupção |
|---|---|---|---|---|
| **Gesto** (pressão, realce, estrela) | 100 ms ao afundar (`press`), 240 ms ao voltar (`release`) | `power2.out` | escala .97; estrela salta 1,35 | o próximo gesto substitui o tween (overwrite) e parte do estado atual |
| **Ponteiro** (inclinação, ímã, anel, câmera seguindo) | mola (`src/ui/spring.js`), sem duração fixa | física: rigidez e amortecimento | ≤ 5 px; inclinação ≤ 3° | trocar de alvo preserva a velocidade; repouso não desenha quadros |
| **Troca** (abas, pílula, sublinhado, painel da ficha, lista filtrada) | 320 ms (`swap`) | `power3.out` / `expo.out` | pílula desliza até a aba; conteúdo sobe 6 px | troca seguida reinicia do ponto atual; o conteúdo já mudou antes da pintura |
| **Entrada** (primeira dobra, cabeçalho do módulo) | 720 ms (`enter`); listas 480 ms (`reveal`) | `expo.out` | 12 px para cima ou escala .96 → 1 | movimento reduzido, troca de acervo ou de tela cancelam pela referência |
| **Saída** (diálogos, avisos, ficha) | 180 ms (`exit`), sempre mais curta que a entrada | `power2.out` (nunca ease-in) | volta para de onde veio | reabrir durante a saída retoma a entrada |
| **Lista** (cascata de linhas, grupos, cartões) | 480 ms por item | `power2.out` | 12 px | 40 ms entre itens, no máximo 8 passos; itens fora da tela entram ao aparecer |
| **Mergulho** (câmera até o destino do corpo) | 650 ms + voo do nome até o numeral (480 ms) | `power2.inOut` (câmera), `power3.out` (voo) | do rótulo até o cabeçalho | Esc, outro destino ou navegação cancelam; a câmera volta ao corpo inteiro |
| **Cena 3D** (batimento, pulso, crescimento das artérias) | batimento a cada 2,6 s; pulso 1,1–1,5 s | física da cena (o pulso acelera ao correr: `power1.in`) | — | pausa fora da tela, com a aba escondida e pelo botão; é o único loop |

- **Só transform e opacity** (e `filter` com parcimônia). O transform de posicionamento (âncoras dos rótulos do mapa) nunca é alvo de entrada: só o conteúdo dos rótulos se mexe.
- **Origem:** ficha e busca nascem de onde foram chamadas. A entrada parte de escala ~.96.
- **Toque:** hover só em `@media (hover: hover)`; a pressão vale enquanto o dedo está.
- **Foco:** volta ao acionador ou, se ele sumiu, a uma alternativa lógica (título da página, linha vizinha).
- **Movimento reduzido:** tudo funciona igual, sem deslocamento nem 3D animado. Trocar a preferência no meio encerra o que estiver em curso. A garantia por CSS fica no fim de `proto.css`.

## Desempenho

A primeira tela não depende do 3D. Three.js (~138 kB gz) e o modelo (4 MB) só carregam depois do `load`, com o navegador ocioso; a montagem devolve a vez ao navegador entre etapas; shaders compilam em paralelo quando possível; o traçado das artérias vem pré-calculado (`src/heart/arteries.json`). Sem WebGL, aparelho econômico (`deviceMemory ≤ 2`, `saveData`) ou modelo indisponível: mapa em linhas, com aviso discreto. Lighthouse (dados fictícios, 02/10/2026): celular 95, computador 99; acessibilidade e boas práticas 100.

## Para Codex e Claude

- Preserve `window.claude.use("db")`, `supaDb()`, campos, RLS, login e rotas.
- O catálogo guarda links. Remover mantém o original; Desfazer permanece.
- Favoritos e situação continuam sendo campos do catálogo (do dono), não progresso individual de cada aluno. Mudar isso é decisão de produto e de banco, separada do visual.
- `[data-edit]` marca toda ação de edição (Adicionar, Organizar, Editar, Remover); a regra que as esconde de quem não edita entra com a rodada de acesso aberto.
