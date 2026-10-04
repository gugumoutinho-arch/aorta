# Auditoria de interface — rodada B, U0 (base `d5fcad2`)

**Como foi feita:**
- `node tools/auditoria.mjs --fase=u0`, numa cópia isolada do commit base, com os dados fictícios de `tools/seed-v4.json` + `fixtures-topics.mjs`;
- 21 cenas × 320/390/768/1440 px × escuro/claro = 162 capturas, com as fontes reais carregadas (ver preflight em `docs/ui-progresso.md`);
- as capturas ficam em `tools/reports/ui/u0/<cena>@<largura>-<tema>.png`, fora do git; os pares escolhidos vão para a galeria `docs/ui/`;
- cada achado diz a captura em que aparece.

**O que a régua mediu nas 162 capturas:**
- rolagem lateral: 0 em todas;
- alvos < 44 px: só links de nome curto na árvore de Organizar (21–41 × 44 px), o "Pausar batimento" (43 px de altura) e títulos-botão dentro de texto;
- erros de console: só o erro esperado da cena "banco fora do ar".

**Prioridade:**
- **P0** impede a tarefa;
- **P1** contraria a direção D ou uma regra do projeto;
- **P2** degrada a qualidade;
- **P3** acabamento.

## Medidas da base (ambiente da nuvem: SwiftShader, sem GPU; tendência, não aparelho real)

| Medida | Base | Como |
|---|---|---|
| CLS da jornada (orçamento) | ver tabela abaixo; 18 de 20 combinações acima de 0,03 | `npm run orcamento` |
| Lighthouse celular (mediana de 3) | IDOMED 91 [72/91/91], geral 90 [90/91/71]; LCP 2,7 s e 4,6 s | `npm run lighthouse` |
| Lighthouse computador | IDOMED 100, geral 99 | idem |
| Acessibilidade / boas práticas | 100 / 100 (com fontes reais) | idem |
| Entrada, maior tarefa (CPU 4×, 5 sequências; mediana / pior) | IDOMED 660 / 749 ms; geral 299 / 408 ms | `node medir-v5.mjs --fase=base-N` + `node resumo-medidas.mjs base` |
| Troca de acervo, maior tarefa (mediana) | IDOMED 289 ms; geral 275 ms | idem |
| Mergulho, maior tarefa (mediana) | IDOMED 92 ms; geral 86 ms | idem |
| CLS da jornada medir-v5 (mediana / pior) | IDOMED 0,022 / 0,042; geral 0,064 / 0,092 | idem |
| p95 do quadro só durante movimento ativo, 1440 px (mediana de 5) | pílula do acervo 300 ms; unidades 33; abas de assunto 33; estrela 67; ficha 383; aviso 267; busca 400 | `node movimento.mjs --fase=u1-antes` |
| idem, 390 px | pílula 233 ms; unidades 17; abas 17; estrela 17; ficha 200; aviso 117; busca 150 | idem, `--largura=390` |

**CLS do orçamento na base (`ORCAMENTO_ESTRITO` desligado; meta 0,03):**

| Cenário | Valores |
|---|---|
| v4 | 320: idomed 0,062, geral 0,292 · 375: 0,101 / 0,067 · 390: 0,079 / 0,065 · 768: 0,137 / 0,061 · 1440: geral 0,058 |
| abundante | 320: 0,191 / 0,116 · 375: 0,063 / 0,076 · 390: 0,081 / 0,070 · 768: 0,119 / 0,203 · 1440: geral 0,074 |

**Leitura das medidas de movimento:** no computador (1440 px), diálogos, aviso e busca passam de 250 ms por quadro durante o movimento. A causa provável é o `backdrop-filter` do fundo do diálogo e a área grande repintada por software (SwiftShader). A troca de acervo inclui o início do 3D. Esses números NÃO valem para um celular com GPU; servem para comparar antes e depois no mesmo ambiente.

**Leitura do CLS:**
- com as fontes reais, a troca de fonte (`display=swap`) e a chegada dos dados ("Continuar", contagens, rótulos do mapa) empurram a primeira dobra;
- o "~0,065 do geral" citado no prompt aparece, mas não é o pior caso;
- o pior caso é 320 px no geral (0,29): o mapa do corpo e o "Continuar" entram depois do título.

## Pontos conhecidos (confirmados)

| # | Ponto | Situação na base | Captura |
|---|---|---|---|
| K1 | Microanimações fracas e sem padrão | Confirmado. Tempos literais espalhados (0,32/0,18/0,25/0,38/0,48/0,15/0,7 s). Saída dos diálogos com `power2.in` (acelera no fim). Pressão de 0,975. Inclinação e brilho seguindo o ponteiro em cartões e livros, que são listas. | código; vídeos `u1-antes` |
| K2 | Rótulos do corpo cruzando linhas-guia | Confirmado no celular e a 768 px. As guias de Anatomia (mão) e Farmacologia (intestino) atravessam o corpo e passam por trás de rótulos vizinhos. | `inicio-geral@768-dark`, `inicio-geral@390-dark` |
| K3 | Contraste do órgão no tema claro | A confirmar no U3 com o 3D carregado. Na matriz, o órgão do módulo não chegou a aparecer em 1,8 s (vê-se a mini-artéria). | `modulo-geral@1440-light` |
| K4 | CLS da jornada do geral | Confirmado e pior que o citado: até 0,29 a 320 px. | orçamento |
| K5 | Maior tarefa na entrada do IDOMED | Confirmado e maior que o citado: mediana 660 ms, pior 749 ms (citado: 550–590). | `medir-v5` |
| K6 | Lighthouse do celular oscilando | Confirmado: uma execução de 71–72 em cada acervo, entre outras de 90–91. | lighthouse |

## Achados por tela

### Início (IDOMED e geral)

- **P1 · O início não é o palco da direção D.**
  - Título "O que você vai estudar hoje?" no lugar da tese do Aorta.
  - Sem a linha "feito por estudantes" junto do título: o aviso de não oficial fica pequeno, abaixo dos números.
  - O "Continuar" é um cartão grande no fluxo, não um painel sobre o palco.
  - Não há brilho de palco; há feixes e grão, mais próximos da direção C.
  - Capturas: `inicio-idomed@1440-dark`, `inicio-geral@1440-light`.
  - **Correção (U2):** palco com brilho radial (`--stage-glow`), linha "feito por estudantes", título grande, busca creme com ⌘K e "Continuar" em vidro.
- **P1 · No celular, o mapa ocupa a primeira tela inteira com 8 rótulos amontoados.**
  - Os rótulos ficam sobre o coração e o último é cortado pela dobra.
  - Não há índice à mão nem barra inferior.
  - Captura: `inicio-idomed@390-dark`.
  - **Correção (U2):** palco compacto com um rótulo (o do "Continuar"), índice em linhas e barra inferior (Início, Mapa, Favoritos, Buscar).
- **P1 · Abaixo da dobra, a mistura de seções e cartões (mesa, recentes, livros com capa, próprios, internet) disputa atenção.**
  - Na D, só a prateleira de casos tem cartões grandes; o resto é lista.
  - **Correção (U2):** índice editorial numerado, prateleira de casos e listas em linhas.
- **P2 · Na coluna estreita do geral, a placa de busca quebra o texto em duas linhas** (`inicio-geral@1440-light`). **Correção:** coluna do texto mais larga e texto da placa que diz o tamanho do acervo.
- **P2 · A legenda do mapa e o estado do 3D ocupam duas linhas abaixo do mapa**, e a legenda do geral quebra no celular (`inicio-geral@390-dark`). **Correção:** uma linha só, com o estado à direita.
- **P3 · O "Pausar batimento" tem 43 px de altura.** **Correção:** 44 px.

### Mapa (coração e corpo)

- **P1 · Linhas-guia cruzam o desenho e passam atrás de rótulos (corpo)** (K2). **Correção:** U3, ordenar pela ponta projetada e resolver colisões.
- **P2 · O anel "ABRIR" do cursor cobre parte do nome sob o ponteiro e continua visível depois de navegar** (`mapa-apontado@1440-*`; também visto na rodada A). **Correção:** U3, anel vazado e deslocado, e reinício ao trocar de rota.
- **P2 · O estado ativo do rótulo depende só da cor e do itálico do número.** **Correção:** U3, borda e marca de forma no rótulo ativo.

### Módulo

- **P1 · Os materiais são cartões grandes com fundo e brilho que segue o ponteiro; a D pede lista editorial** (`modulo-assunto@1440-light`). **Correção:** U4.
- **P1 · Sem a parte do corpo ou o órgão do assunto ativo no cabeçalho do IDOMED; só uma mini-artéria decorativa.** **Correção:** U4 (vista de órgão existente onde houver geometria; sem geometria, nada de destaque inventado).
- **P2 · Módulo "em produção" mostra a busca e os filtros sem nada para buscar** (`modulo-producao@390-dark`). **Correção:** U4, esconder a barra quando não há material.
- **P2 · Dez controles de filtro numa linha a 1440 px (busca, favoritos e 4 selects)**: pesa mais que a lista. **Correção:** U4, barra compacta.
- **P3 · Os setas ←/→ de módulo no topo direito não dizem para onde vão.** **Correção:** U4, rótulo com o nome do vizinho (`title` e texto para leitor de tela).

### Ficha

- **P1 · No computador, a ficha é um diálogo modal que escurece e bloqueia a lista** (`ficha@1440-dark`). A D pede painel fixo à direita a partir de 1200 px, sem cobrir a lista. **Correção:** U4/U5.
- **P2 · A ficha nasce da direita, não da linha clicada (768–1199 px).** **Correção:** U5.

### Busca rápida

- **P2 · Os resultados repetem o caminho inteiro (IDOMED · M1 · CIS 1 · Anatomia · assunto · tipo) e quebram em 3–4 linhas no celular** (`busca@390-dark`). **Correção:** U6, caminho curto e tipo no rótulo da direita.
- **P3 · O estado vazio já sugere os módulos com material** (`busca-vazia@*`); só falta o grifo e a dica de busca sem acento. **Correção:** U6.

### Organizar, formulário e colagem

- **P2 · A colagem com vírgulas (como sugere o texto "url, caminho, tipo…") não separa as colunas.** A linha de cabeçalho vira um erro e as outras ficam "sem título", sem tipo (`colagem@1440-dark`). O importador espera tabulação (cópia da planilha). **Correção:** U7, microcópia "colunas separadas por tabulação (copie da planilha)" e aviso específico quando a linha tem vírgulas e nenhuma tabulação.
- **P3 · Nomes curtos na árvore (M1, M2…) têm alvo de 21–41 px de largura.** **Correção:** U7, alvo mínimo de 44 px.

### Estados e avisos

- **P2 · O aviso "Removido do catálogo… Desfazer" cobre o fim da lista no celular e some no tempo, mesmo com o foco nele** (`aviso-desfazer@390-light`). **Correção:** U8, pausar o tempo com foco ou cursor e deixar espaço embaixo.
- **P3 · O esqueleto de carregamento é um bloco de 120 px que não acompanha a geometria das linhas** (`carregando@*`). **Correção:** U8.

### Transversais

- **P1 · Hover sem `@media (hover: hover)` em vários componentes** (cartões, botões e rótulos sobem ou mudam no toque). **Correção:** U1/U9, mover para `@media (hover: hover)`.
- **P2 · Contraste dos tokens `--m1…--m8` sobre `--paper` e `--surface` não verificado sistematicamente.** **Correção:** U9, tabela medida.
