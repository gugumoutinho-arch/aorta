# Progresso da rodada B (interface e movimento) — ramo `nuvem/ui-lapidacao`

Prompt: `docs/nuvem/rodada-b-interface.md` (ramo `prototipo-v4`, commit `69490d9`). Alvo: a DIREÇÃO D aprovada pelo dono (maquetes `docs/nuvem/direcao-d/*.dc.html` no `prototipo-v4`).

Quem retomar: leia esta lista, rode `cd tools && npm test && npm run check` e siga do primeiro pacote não concluído.

## Ponto de partida

- **Repositório:** `git rev-parse --show-toplevel` = `/home/user/aorta`. Este checkout Linux substitui `C:\claude e codexx`.
- **Remote:** `origin` = `https://github.com/gugumoutinho-arch/aorta`. Ao começar, o ramo era `nuvem/f1-conteudo` com o status limpo.
- **Rodada A:**
  - última linha "RODADA A ENCERRADA (com o complemento local) em 03/10/2026, SHA 0ad655f";
  - `git merge-base --is-ancestor 0ad655f origin/nuvem/f1-conteudo` → ancestral;
  - `git diff --stat 0ad655f..origin/nuvem/f1-conteudo` → só `docs/nuvem-progresso.md` (11 linhas).
- **Ramo:** `nuvem/ui-lapidacao`, criado do topo de `origin/nuvem/f1-conteudo`.
- **SHA base:** `d5fcad2`.

## Preflight (`node tools/ambiente.mjs`, saída em `tools/reports/ambiente/`)

- **Node e navegador:** Node v22.22.0; Chromium 141.0.7390.37 (`/opt/pw-browsers/chromium`).
  - O `npx playwright-core install` do prompt não foi rodado: este ambiente proíbe `playwright install` e já traz o Chromium.
  - Por isso, `CHROME_PATH=/opt/pw-browsers/chromium` e `CI=1`.
- **WebGL:** "ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero)))". WebGL2 funciona por software, sem GPU.
- **Captura PNG:** ok (308 KB, 1440×900).
- **Vídeo:** `recordVideo` gera `.webm` FINALIZADO depois de fechar o contexto (228 KB). Há `ffmpeg` em `/opt/pw-browsers/ffmpeg-1011` e em `/usr/bin/ffmpeg`.
- **Fontes:**
  - na 1ª tentativa, NÃO carregaram (`net::ERR_CERT_AUTHORITY_INVALID` em fonts.googleapis.com). O banco de certificados do navegador (`~/.pki/nssdb`) estava vazio, embora o README do proxy diga que vem configurado;
  - na 2ª tentativa, instalei o `certutil` (`libnss3-tools`) e registrei no NSS as CAs do proxy da nuvem que já estão em `/root/.ccr/ca-bundle.crt` (as "O = Anthropic"). A verificação TLS continua ligada; nada foi desligado;
  - depois disso, `document.fonts` mostra 16 faces e 3 carregadas na tela inicial, e os 4 pedidos de fonte (css2, Literata ×2, Schibsted) retornam ok.
  - **Consequência:** as capturas e o Lighthouse desta rodada TÊM as fontes reais e passam a ser comparáveis com o computador do dono, ao contrário da rodada A.
  - **Para retomar noutro contêiner:** a configuração é só deste contêiner (fora do repositório); refaça com `certutil -d sql:$HOME/.pki/nssdb -A -t "C,," -n <nome> -i <ca.pem>` para cada CA "O = Anthropic" do bundle.
- **Bateria G na base (`d5fcad2`, cópia isolada, com fontes):**
  - `npm test` 110/110; `check` 0 erros e 0 avisos; `flows` 364/364; `acervos` 71/71; `topics` 57/57; `topic-edit` 52/52; `import` 59/59;
  - `orcamento`: passa no modo não estrito; o CLS fica acima de 0,03 em 18 de 20 combinações (máx. 0,29);
  - Lighthouse (mediana de 3):
    - celular: IDOMED 91 [72/91/91], LCP 2,7 s; geral 90 [90/91/71], LCP 4,6 s;
    - computador: 100 e 99;
    - acessibilidade 100 e boas práticas **100** (com as fontes, o erro de certificado da rodada A some).

## Pacotes

| Pacote | Situação | Commit |
|---|---|---|
| U0 · Auditoria | concluído | `c64013e` (ferramentas), `8080fbe`, `d8f4da3` (doc) |
| U1 · Sistema de movimento | concluído (aceite parcial, ver abaixo) | `110d1de`, `d8f4da3` |
| U2 · Início na direção D | concluído | `0755196`, `654428c` |
| U3 · Mapa e tarefa longa | concluído | `e4bbae7`, correções da revisão no commit seguinte |
| U4 · Página do módulo na direção D | concluído (revisão local) | `5dbc810`, acabamento no commit seguinte |
| U5 · Ficha do material | concluído (testado localmente) | `79dd68b`, `4fd3856` |
| U6 · Busca rápida | concluído (local) | `522c7c9` |
| U7 · Organizar e colagem | concluído (local) | `9c9332d` |
| U8 · Estados e avisos | concluído (local) | `45726d2` |
| U9 · Acabamento | concluído (local) | `1cb0e42`, fontes no commit seguinte |

### U0 · Auditoria

- **Saída:** `docs/ui-auditoria.md`, com 162 capturas da base em `tools/reports/ui/u0/` (fora do git).
- **Medidas da base, `medir-v5` (5 sequências, CPU 4×, 390 px, SwiftShader, `seed-v4`), maior tarefa (mediana / pior):**

  | Etapa | IDOMED | Geral |
  |---|---|---|
  | Entrada | 660 / 749 ms | 299 / 408 ms |
  | Troca de acervo | 289 ms | 275 ms |
  | Mergulho | 92 ms | 86 ms |

  CLS mediano: IDOMED 0,022; geral 0,064.
- **`movimento.mjs`:** p95 do quadro SÓ durante o movimento ativo, mediana de 5 sequências, Chromium 141, `seed-v4` + `fixtures-topics`, sem limite de CPU, rede local:

  | Largura | Pílula do acervo | Unidades | Abas | Estrela | Ficha | Aviso | Busca |
  |---|---|---|---|---|---|---|---|
  | 1440 px | 300 | 33 | 33 | 67 | 383 | 267 | 400 ms |
  | 390 px | 233 | 17 | 17 | 17 | 200 | 117 | 150 ms |

### U1 · Sistema de movimento

- **Verificação (cópia de `110d1de`):** `check` 0/0; `flows` 364/364; `acervos` 71/71.
- **p95 ativo depois da migração (o mesmo ambiente):** igual à base dentro do ruído, como esperado, porque as propriedades animadas não mudaram.
  - 1440 px: pílula 317, unidades 33, abas 33, estrela 50, ficha 383, aviso 267, busca 433 ms;
  - 390 px: 217 / 17 / 17 / 17 / 200 / 117 / 150 ms.
- **Causa do custo alto em diálogos e avisos:** o `backdrop-filter: blur(3px)` do fundo dos diálogos, de tela cheia. Ele também contraria "vidro com parcimônia" da D.
  - **Medido depois de tirá-lo** (1440 px, árvore com o U2 em andamento, o que não afeta a página do módulo): ficha 383 → **83 ms**, aviso 267 → **67 ms**, busca 433 → **167 ms**. A busca roda sobre o coração 3D em movimento no início.
- **Aceite "p95 ativo ≤ 20 ms":**
  - cumprido a 390 px em unidades, abas e estrela;
  - NÃO cumprido em ficha, aviso, busca e pílula do acervo, que a 1440 px inclui o início do 3D;
  - este ambiente desenha por software (SwiftShader), então a medida serve só como tendência.
  - Pendente: medir em aparelho real.
- **Vídeos:** `tools/reports/ui/videos/u1-antes/` e `u1-depois/` (fora do git; vão no artefato final).
- **Movimento reduzido:** intacto. `flows` cobre a troca no meio da animação e passou.

### U2 · Início na direção D

- **Palco:**
  - brilho radial (`--stage-glow`);
  - linha "Feito por estudantes · sem vínculo oficial com a IDOMED";
  - título grande ("O curso inteiro, *irrigado* por bons materiais.");
  - busca creme que diz quantos materiais e assuntos há;
  - "Continuar" em vidro (o único `backdrop-filter`, ≥ 1000 px, com `@supports`);
  - rótulos do mapa como painéis translúcidos, com o nome da artéria no coração.
- **Mudança de composição:** o "Continuar" saiu de cima do mapa (como na maquete) para a coluna do texto, porque com oito módulos os rótulos não cabiam com ele sobre o mapa.
- **Editorial:**
  - índice numerado (grupo por módulo; linha por matéria com assuntos e contagem);
  - números à esquerda (materiais, assuntos, casos);
  - prateleira de casos clínicos (só aparece com caso);
  - listas em linhas para mesa, recentes, livros, próprios e internet.
- **Celular:**
  - palco compacto com um rótulo no mapa;
  - "Continuar" (ou "Comece por aqui") abaixo do coração;
  - barra inferior (Início, Mapa → índice, Favoritos, Buscar), com traço e cor no item ativo e área segura.
- **Estabilidade:**
  - fontes substitutas com `size-adjust` medido. Com e sem as fontes do Google, o layout fica idêntico (posições conferidas, ver `docs/ui-auditoria.md`);
  - texto do acervo e conceito do mapa aplicados antes da primeira pintura;
  - espaço reservado para contagens, "Continuar" e estado do 3D;
  - grade `minmax(0, 1fr)` no celular.
- **Carga:** a colagem de links passou a ser carregada só em Organizar: o JS inicial caiu de 75,99 para 68,9 kB comprimidos.
- **Testes trocados pela nova verdade (mais exigentes):**
  - `flows`:
    - índice com 2 grupos e linhas 01…08;
    - no celular, um rótulo à vista e os 8 módulos no índice;
    - setas só entre rótulos à vista;
    - "Comece por aqui" levando ao M1 quando não há histórico;
    - rótulos à vista dentro do mapa;
  - `acervos`: rótulos à vista, pelo menos um.
- **Resultados (árvore de `0755196`):**
  - `npm test` 120/120;
  - `check` 0/0;
  - `flows` 368/368;
  - `acervos` 71/71;
  - `topics` 57/57;
  - `import` 59/59;
  - `ORCAMENTO_ESTRITO=1 npm run orcamento` **passa**: crescimento do JS 8,5 kB; CLS máximo **0,0019** nas 20 combinações (base: 0,29).
- **Lighthouse (3 execuções; JSON em `tools/reports/lh-u2/`):**

  | | Celular IDOMED | Celular geral | Computador |
  |---|---|---|---|
  | Desempenho | **93** [93/93/93] | **93** [93/93/93] | 100/100 |
  | LCP | 2,6 s | 2,6 s (base 4,6) | — |
  | CLS | 0,001 | 0,001 | — |

  Acessibilidade 100 e boas práticas 100.
- **Não verificado:** compreensão em 5 s (fica para o piloto com alunos); celular real.
- **Revisão de design (só leitura): 0 bloqueantes, 8 importantes, corrigidos:**
  - foco restaurado no mesmo contêiner (chaves `area` e id do contêiner);
  - `#indice` vindo de outra tela religa o mapa;
  - nota da IDOMED diz "links para os originais";
  - "Buscar entre" (não "em");
  - desfoque removido (o "Continuar" está sobre o brilho liso), rótulos mais estreitos em volta do coração;
  - testes novos da barra inferior (Mapa, Favoritos, Buscar, Início), da prateleira de casos ("Ver todos" filtra por caso) e do mergulho no celular pelo rótulo destacado.
- **Sugestões aplicadas:**
  - crédito HuBMAP na legenda;
  - "Ver todos os materiais" no fim do índice;
  - filtro pendente para "Favoritos" e casos;
  - `reducedMotion()` na barra;
  - sem transições de `box-shadow` e `background`;
  - `color-mix` sem transparência acidental;
  - limpeza de duplicatas;
  - `import()` da colagem com `catch`;
  - seta "→" fora do leitor de tela;
  - "Em produção" de volta nos rótulos (regra da skill).
- **Não aplicadas, com motivo:**
  - título do "Continuar" sem limite no computador: o espaço reservado contra CLS depende das 2 linhas, e o título completo está no botão e na ficha;
  - índice como `<ol>`;
  - "Mapa" → "Índice": o nome vem da D, decisão do dono;
  - ordem do foco do "Continuar" no celular.
- **Depois das correções:** `npm test` 120/120; `check` 0/0; `flows` **391/391**; `acervos` 71/71; orçamento ESTRITO passa. Capturas em `tools/reports/ui/u2/`.

### U3 · Mapa e tarefa longa

- **Causas da maior tarefa da entrada** (profiler do Chromium com CPU 4× e mapas de código):
  - `canUse3D` criava um contexto WebGL só para testar o suporte (~190 ms), e o renderizador criava outro;
  - a 1ª medida da pílula das abas (`indicator.js`) forçava o layout da página inteira dentro do script (~110 ms);
  - `layout()` intercalava leituras e escritas;
  - as linhas-guia liam `getBoundingClientRect` de cada rótulo a cada quadro do 3D.
- **Correções:**
  - o contexto do teste vira o do desenho;
  - a 1ª medida da pílula vai para o quadro seguinte;
  - `layout()` lê tudo e depois escreve;
  - as guias usam as caixas guardadas.
- **Medida** (`medir-v5`, 5 sequências, CPU 4×, 390 px, SwiftShader, `seed-v4`; "antes" = `654428c`, numa cópia isolada; "depois" = `e4bbae7`): maior tarefa, mediana (pior)

  | Etapa | Base `d5fcad2` | Antes do U3 | Depois do U3 |
  |---|---|---|---|
  | Entrada IDOMED | 660 ms (749) | 968 ms (1113) | **174 ms (183)**, −82% |
  | Entrada geral | 299 ms | 159 ms (188) | **136 ms (148)**, −14% |
  | Troca IDOMED | 289 ms | 261 ms | 181 ms |
  | Troca geral | 275 ms | 167 ms | 165 ms |
  | Mergulho | 92 / 86 ms | 91 / 87 ms | 88 / 93 ms |

  O U2 tinha piorado a entrada do IDOMED (968 ms); o U3 corrigiu e foi além.
  - **Aceite de −20% na mediana:** cumprido no IDOMED, que é a entrada citada no prompt. No geral, −14% em relação ao U2 (−55% em relação à base).
  - `medir-v5.mjs` foi ajustado ao palco compacto: clica no rótulo à vista.
- **Rótulos:**
  - o desenho (mapa em linhas e escala do 3D) fica ENTRE as colunas de rótulos;
  - corpo: o lado de cada rótulo segue a posição da ponta, com colunas equilibradas;
  - vizinhos trocam de lugar enquanto duas guias se cruzarem.
  - **Teste novo** (`acervos`): nenhuma guia cruza outra nem atravessa rótulo, a 320/375/768/1440 px, nos dois acervos e nos dois temas. Antes da correção, falhava a 1440 px no IDOMED (três pontas sob os rótulos da direita) e a 768 px no geral (guias da mão e do fígado se cruzando).
- **Estado ativo:** barra na borda do rótulo (forma) além da cor; guia mais grossa. O anel "abrir" do cursor ficou vazado (não cobre o nome) e zera ao trocar de tela.
- **Órgão no tema claro:** parte ativa na cor plena do token (antes escurecida até quase preto); inativas mais leves. Captura do cerebelo nos dois temas conferida. O tom do token `--m8` do tema claro é escuro (oliva); o contraste com o creme é alto.
- **Resultados (`e4bbae7`):** `npm test` 120/120; `check` 0/0; `flows` 391/391; `acervos` **105** (eram 71: 768 px e o teste de guias).
- **Revisão de design: 0 bloqueantes, 4 importantes:**
  - **I1:** as cores do shader do órgão entravam linearizadas (`new Color(hex)`) e o shader próprio não volta para sRGB, por isso a parte ativa saía quase preta. Agora as cores entram sem linearizar. Capturas conferidas (`tools/reports/ui/u3/orgao-*`): cerebelo oliva no claro, creme-amarelo no escuro; rins em carmim;
  - **I2:** o 3D reescala com a largura atual quando o mapa muda de largura (antes só quando as colunas mudavam);
  - **I3:** teste novo em `flows`: as guias continuam sem cruzar com o 3D carregado e com o coração inclinado pelo ponteiro, a 375/768/1440 px;
  - **I4:** registro feito no commit `32b03ee`.
- **Sugestões aplicadas:**
  - contexto WebGL liberado quando a cena é abortada;
  - a troca de vizinhos para quando não reduz os cruzamentos;
  - código morto do cursor removido.
- **Depois:** `flows` **404/404**; `acervos` 105/105.

### Bateria G depois do U3 (`32b03ee`, cópia isolada)

- `npm test` 120/120; `check` 0/0; `flows` 391/391; `acervos` 105/105; `topics` 57/57; `topic-edit` 52/52; `import` 59/59; `orcamento` passa (crescimento do JS de 9,6 kB).
- **Lighthouse** (mediana de 3): celular 92 [92/92/92] e 93 [72/93/93]; computador 99/99; acessibilidade e boas práticas 100.
- **CLS do computador no IDOMED, 0,052:** introduzido pelo U3, porque o SVG do mapa em linhas mudava de tamanho depois da primeira pintura.
  - **Corrigido** no commit seguinte: o encaixe passou a ser feito por `transform`.
  - **Medido depois:** computador 100/100 com CLS 0,002/0,001; celular 92 [92/72/92] e 91 [72/91/92].
- **Pendente:** uma execução de 72 entre três no celular, nos dois acervos, como na base (91 [72/91/91]). Investigar no U9.

### U4 · Página do módulo na direção D (`5dbc810`)

- **Entrega da nuvem:** numeral gigante com foco em Literata, lista editorial no lugar dos cartões, ficha fixa à direita a partir de 1200 px, filtros compactos e "Em produção" desenhado.
- **Revisão de design (local, Claude, no Windows do dono):** a revisão pedida na nuvem não voltou. Revisei pelas capturas `node auditoria.mjs --so=modulo,ficha --larguras=390,1440 --temas=dark,light`. A composição segue a direção D.
  - **Um ajuste:** o resumo "5 materiais em 4 assuntos · 2 casos clínicos" deixava uma palavra sozinha na última linha com a ficha aberta. Agora `text-wrap: pretty` e medida de 46 caracteres quando há foco em matéria; captura conferida.
- **Resultados (cópia isolada, Windows, fontes reais):** `npm test` 120/120; `check` 0/0; `flows` 432/432; `topics` 57/57; `topic-edit` 52/52; `import` 59/59; `acervos` 105/105.

### U5 · Ficha do material (`79dd68b`, `4fd3856`)

- **Comportamento:**
  - a ficha e a busca nascem do ponto de onde foram chamadas;
  - ligar "reduzir movimento" no meio do arraste devolve a folha ao lugar;
  - 32 testes da folha no celular (cancelar o gesto, arrastar para fechar, reabrir durante o fechamento, movimento reduzido no meio).
- **Nos dois commits enviados pela nuvem sem teste:** rodados localmente, tudo verde (`flows` 432/432).

### U6 · Busca rápida (local)

- **Resultado curto:** caminho "unidade › matéria · assunto" (`src/domain/search.js`) no lugar de "IDOMED · M1 › CIS 1 › … · tipo"; o tipo vai para o rótulo da direita (no lugar de "Ficha"); o nome do acervo só aparece quando o material é do OUTRO acervo; módulos e matérias mostram o próprio nome em destaque e o caminho acima embaixo.
- **Sem tremor ao digitar:** a lista só é refeita quando a busca muda, ignorando acento, caixa e espaços extras.
- **Estado vazio:** a mensagem diz que acento e maiúscula não importam.
- **Testes:** `search.test` 6/6 (`npm test` 126/126); `flows` 444/444, com 2 verificações novas por largura (caminho curto em até 2 linhas com o título inteiro; outro acento não refaz a lista); `check` 0/0. Captura a 320 px conferida.

### U7 · Organizar e colagem (local)

- **Vírgulas:**
  - cabeçalho separado por vírgulas para com o aviso "copie as colunas direto da planilha (tabulação) ou cole só os links";
  - linha com vírgula logo depois do link recebe aviso específico;
  - vírgula dentro de uma URL continua valendo.
- **Microcópia:** "elas vêm separadas por tabulação, não por vírgula" e cabeçalho com "·".
- **Alvos de toque:** nomes curtos da árvore (M1, M2…) com pelo menos 44 px de largura (a auditoria mediu 21–41 px).
- **Captura:** a cena `colagem` da auditoria mostra agora o aviso; a nova `colagem-planilha` mostra a prévia (aviso e erro diferenciados por ícone e texto). Conferidas a 390 px; 0 alvos pequenos.
- **Testes:** `import.test` +3 (`npm test` 129/129); `import` 59/59; `check` 0/0.

### U8 · Estados e avisos (local)

- **Pausa de verdade no aviso com "Desfazer":** o tempo para com cursor, dedo ou foco e volta ao sair, com o que faltava e um piso de 3 s (`src/ui/timer.js`). Antes, o aviso só reconferia no fim e sumia 1 s depois de sair.
- **Espaço para o aviso:** com aviso na tela, a página ganha espaço embaixo (`body.has-toast`), e o aviso não cobre o fim da lista. No celular, ele já ficava acima da barra inferior.
- **Esqueleto:** imita a lista editorial (rótulo, título e assunto, com divisórias), em vez do bloco de 120 px. Captura conferida.
- **Testes:** `timer.test` 3/3 com relógio simulado (`npm test` 132/132); `flows` 450/450, com a verificação nova "aviso não cobre o fim da lista" em cada largura e tema; `check` 0/0.

### U9 · Acabamento (local)

- **Contraste:** `--m1…--m8` medidos sobre `--bg`, `--paper` e `--surface` nos dois temas, todos ≥ 4,5:1. O teste `contrast.test` lê `tokens.css` e reprova se algum cair.
- **Hover só com mouse:** as 12 regras de `:hover` fora de `@media (hover: hover)` foram movidas (nada "gruda" no toque). O `check` agora reprova `:hover` solto. O estado ativo das abas de assunto foi separado do hover.
- **Anel do cursor:** já só existe com `(hover: hover) and (pointer: fine)`. Nas capturas a 390 px ele aparece porque o navegador de teste usa mouse; em celular real não aparece.
- **Testes:** `npm test` 134/134; `check` 0/0, com a etapa nova; `flows` 450/450.

### U9 · Primeira pintura sem esperar as fontes (local)

- **Diagnóstico:** no Lighthouse do celular (Windows, rede doméstica), a folha do Google Fonts bloqueava a primeira pintura por ~1,9 s (FCP = LCP = 3,2 s; IDOMED 83 [83/89/79], reprovado). A "execução isolada de 72" era essa espera variando com a rede.
- **Correção:**
  - a folha de fontes carrega sem bloquear (`media="print"` + `onload`, com `<noscript>`);
  - o texto aparece com as substitutas calibradas que a nuvem criou e troca quando a fonte chega.
- **Efeito colateral medido e corrigido:**
  - a 768 px, a linha em caixa alta acima do título cabia em 1 linha com a Schibsted e quebrava em 2 com a substituta; a busca subia 17 px na troca (CLS 0,085 no orçamento estrito);
  - agora são 2 linhas reservadas entre 641 e 1100 px.
- **Depois:**
  - orçamento ESTRITO aprovado 2× (pior CLS 0,015);
  - Lighthouse com mediana de 3: celular IDOMED **90** [90/90/90] e geral **91** [84/91/91]; computador 100/100; LCP 2,4 s nos dois; CLS 0–0,001; acessibilidade e boas práticas 100;
  - `flows` 450/450; `acervos` 105/105; `topics` 57/57; `check` 0/0.

## Entrega e encerramento (local, Claude, Windows do dono, 04/10/2026)

- **Galeria:** `docs/ui/index.html`, 14 pares antes|depois (28 PNG, 4,3 MB), só com dados fictícios, revisados.
  - "Antes" = fim da rodada A (`d5fcad2`); "depois" = este ramo; capturados aqui com a mesma ferramenta (`auditoria.mjs`).
  - **Alvos "pequenos" apontados no depois:** são os títulos dos cartões de casos clínicos; o `::after` estende o clique ao cartão inteiro (≈190 px de altura), então a área real de toque está certa. Falso positivo da ferramenta, que mede só o botão.
- **Vídeos:** não gerados nesta etapa local. O movimento pode ser visto ao vivo na prévia (`cd tools && node demo.mjs --abas`). Evidência de movimento em vídeo: não entregue.
- **Bateria final, no Windows com fontes reais:**
  - `npm test` 134/134; `check` 0/0; `flows` 450/450; `topics` 57/57; `topic-edit` 52/52; `import` 59/59; `acervos` 105/105 (3×);
  - orçamento ESTRITO aprovado (pior CLS 0,015; JS inicial +11,1 kB sobre o baseline);
  - Lighthouse com mediana de 3: celular IDOMED 90 e geral 91, computador 100/100, LCP 2,4 s, CLS 0–0,001, acessibilidade e boas práticas 100.
- **Só o dono pode validar:** celular Android e iPhone reais, Safari e leitor de tela.

RODADA B ENCERRADA em 04/10/2026, SHA 16e45df

---

# Lapidação visual (série L, v3) — 05/10/2026

Foco visual, com a estrutura e o DNA mantidos: só muda o acabamento (tipografia, uso da cor, luz, grão, fios no lugar de
caixas, estados, movimento fino e o acabamento do coração). Ramo `lapidacao-visual`, a partir de `prototipo-v4` (`229eb81`).

### V0 · Preparação

- Base verde antes de qualquer mudança: `npm test` 134/134; `check` 0/0; `flows` 450/450; `acervos` 105/105;
  `topics` 57/57; `topic-edit` 52/52; `import` 59/59.
- Pares "antes" capturados (seed fictício em `tools/reports/ui/visual-antes/`; a cópia com o catálogo real fica fora do git).

### V1 + V2 · Fundação; molduras viram tipografia; carmim e caixa alta com disciplina

Os dois pacotes mexem nos mesmos arquivos de estilo, por isso vão num commit só.

- **Fundação (V1):**
  - tokens novos nos dois temas: fio (`--hair`, `--hairline`, que vira 0,5 px em telas 2x), realce interno do vidro, sombra que flutua, luz do palco em oklch, raios 12/16;
  - grão de filme (`src/assets/grao.png`, 128 px, 7,6 KB, gerado por `tools/grao.mjs`);
  - o anel de foco segue o raio de cada elemento;
  - botão principal com relevo (degradê leve, realce interno, 0,985 ao pressionar).
- **Molduras viram tipografia (V2):**
  - **seletor de acervo:** dois rótulos com fio violeta;
  - **faixa de assuntos:** abas com fio deslizante, sem caixa nem pílula; a borda esmaece quando há mais para o lado (linha do tempo da rolagem);
  - **lateral de matérias:** ponto violeta no ativo;
  - **Favoritos e Filtros:** sem contorno;
  - **busca da página:** superfície tonal;
  - **rótulos do mapa:** placa suave, sem contorno nem tracejado.
- **Caixa alta só para códigos técnicos** ("ART. 01", tipo do material). Rótulos de seção, grupos, legendas e etiquetas passam a Literata itálica.
- **Carmim em repouso só em 3 papéis:** ação principal, fluxo da artéria e palavra de destaque.
  - "Abrir original" (linha, caso, livro) fica calmo e acende ao apontar ou focar a linha.
  - O selo "Ctrl K" ficou neutro; no celular, o botão da busca é um quadrado de tinta.
  - Saiu o ponto carmim da contagem.
  - A busca rápida mostra um ponto na cor do módulo no lugar das iniciais.
- **Testes:** `check` 0/0; `flows` 450/450; `acervos` 105/105; `topics` 57/57; `topic-edit` 52/52; `import` 59/59, sem mudar nenhuma asserção.

### V3 · Início: palco e coração

- **O coração é o protagonista.** No coração 3D, o desenho avança sob a borda interna das colunas de rótulos (`reach3d`, em `map.js`), porque os rótulos têm placa.
  - **Medido com os 8 rótulos do seed:** 0,85 da coluna reservada a partir de 1200 px e 0,9 abaixo deixam as linhas-guia sem cruzar nem atravessar rótulos, de 700 a 1920 px. O coração fica cerca de 20% maior.
  - **O mapa em linhas e os outros conceitos continuam com a coluna inteira:** ali, qualquer avanço cruzava duas guias (`acervos.mjs` pegou).
- **Shader:**
  - borda mais estreita e luminosa e miolo mais fundo;
  - pontilhado de 1/255 contra faixas no degradê;
  - artérias com material ganham halo: um tubo largo, mais forte no centro da vista, que divide os uniformes com a artéria (pulso e destaque valem para os dois).
- **Luz do palco em camadas:** núcleo violeta e halo carmim tênue, em `oklab`, com reserva para navegadores sem suporte.
- **O grão passou para cima do conteúdo, como um filme.**
  - Desfaz as faixas dos brilhos.
  - Não recebe clique e por isso fica fora do teste de toque e de contraste.
  - Fica abaixo da barra inferior, dos avisos e dos diálogos.
- **Defeito antigo corrigido:** o `overflow-x: clip` do `main` cortava os brilhos "de borda a borda" (palco e cabeçalho do módulo) numa linha reta perto da borda direita, já visível nas capturas "antes". O corte foi para o `body`, que tem a largura exata da tela; nada cria rolagem lateral.

### V4 · Módulo: página de rosto, controles e ritmo do celular

- **Numeral com luz:** degradê vertical na cor do módulo, com recorte no texto. No alto contraste do Windows, volta à cor sólida.
- **Resumo da matéria** em Literata itálica.
- **Miniatura do coração:** o traço provisório à direita do cabeçalho virou o contorno do mapa em linhas, com a artéria do módulo acesa e as outras tracejadas. É o mesmo desenho do Início (`concept().outline()` e `flat()`), sem arte nova.
- **Linha de contagem:** fica só para o leitor de tela (continua `role=status`) quando não há busca, filtro nem "só favoritos". O cabeçalho já diz quantos são.
- **Celular:**
  - numeral de 64 px e espaçamentos compactos;
  - busca, ★ e Filtros numa linha só. A estrela é o mesmo `#f-fav`, com o nome "Favoritos" no texto para o leitor de tela.
- **Estado "Em estudo"** em violeta (estado de leitura, não ação).
- **Medido, celular 390 × 844** (real e seed):

  | Tela | 1º material (antes → depois) | Fim do título |
  |---|---|---|
  | Módulo | 693 → 567 px | 650 px |
  | Matéria | 789 → 654 px | 737 px |

  O título do 1º material fica inteiro acima da barra inferior (787 px). Chegar a ≤ 420 pede a rodada de estrutura.

### V5 · Rodapé, índice, ficha e barra inferior

- **Rodapé como colofão de livro:** os mesmos textos e créditos (HuBMAP, CC BY 4.0, com link) numa coluna centrada, com o nome em Literata, a frase em itálico e um traço curto como florão.
- **Índice como sumário de livro:** um pontilhado leva o nome da matéria até a contagem; os números do índice ficam em Literata 44.
- **Ficha fixa** com realce interno e sombra que flutua.
- **Barra inferior do celular em vidro:** testada e retirada no V8. O desfoque somava ~50 ms de tempo de bloqueio no Lighthouse do celular, e a barra continua opaca, como antes.

### V6 · Movimento fino

- **Saiu o anel que seguia o cursor (D-L3).** Ficam o ímã dos rótulos do mapa e a inclinação dos cartões de caso.
- **O "irrigado" do título ganha um brilho** que passa uma vez só. Com movimento reduzido, termina já no estado final; no alto contraste, fica na cor sólida.
- **Microinterações da lapidação** (linha que tinge e acende "Abrir original", seta do cartão que avança, cartão de caso que sobe 2 px): todas em CSS, dentro de `@media (hover: hover)`, desligadas pelo movimento reduzido.
- **Único ajuste de teste da rodada** (previsto no plano): `acervos.mjs`, o nome da verificação "remove cursor e 3D" passou a "remove o 3D", porque o anel não existe mais. A verificação em si não mudou.

### V7 · Tema claro "papel"

- **Grão mais leve no papel** (opacidade de 0,9 para 0,7): textura de papel sem sujar o creme.
- **Faixa de assuntos:** com abas escondidas dos dois lados, as duas bordas esmaecem por inteiro (antes, no meio da rolagem, cada uma esmaecia pela metade). Conferido pela linha do tempo da rolagem: no começo só a direita, no meio as duas, no fim só a esquerda.
- **Revisão nos 2 temas:** ficha (prancha), busca, índice, módulo e Início, com 3D e em linhas, sem ajuste extra de contraste (`check` com axe 0/0).

### V8 · Fechamento (Windows do dono, 05/10/2026)

- **Grão e desempenho, medidos e corrigidos:**
  - O grão em PNG (7,6 kB), presente desde o início, virou o "maior elemento pintado" e atrasava o LCP (2,4 → 2,9 s). Foi trocado por ruído SVG embutido no CSS (~0,6 kB, sem requisição); `src/assets/grao.png` e `tools/grao.mjs` saíram.
  - Mesmo em SVG, ligado desde o início, ele disputava a pintura do título (LCP +0,3 s). Agora entra 2,5 s depois da carga, de uma vez (`html.fx-on`, `main.js`). Com fade, somava tempo de bloqueio.
  - O vidro da barra inferior foi testado e retirado: custava ~50 ms de bloqueio, e a barra continua opaca.
- **Bateria final, sem mudar asserções** (exceto o nome da verificação do anel, no V6):
  - `npm test` 134/134; `check` 0/0;
  - `flows` 450/450; `acervos` 105/105; `topics` 57/57; `topic-edit` 52/52; `import` 59/59.
- **Orçamento ESTRITO aprovado:** pior CLS 0,0026; JS inicial sem crescimento relevante sobre a rodada anterior (+11,1 kB sobre o baseline v5, como antes).
- **Lighthouse, mediana de 5:**

  | Acervo | Celular | Computador | LCP celular | Bloqueio |
  |---|---|---|---|---|
  | IDOMED | **90** [90/89/91/90/90] | **100** | 2,7 s | 190 ms |
  | Medicina geral | **88** [88/90/87/88/84] | **99** | 2,8 s | 320 ms (oscilante) |

  - Acessibilidade e boas práticas 100 em tudo.
  - A versão de antes (`229eb81`), medida hoje na mesma máquina, deu IDOMED celular 90 [91/91/90/90/90] (LCP 2,6 s, bloqueio 220 ms) e computador 100.
  - O LCP do celular alterna entre 2,4 e 2,7 s de uma rodada para outra nas duas versões (é a montagem do título).
- **Celular 390 × 844** (catálogo real e seed):

  | Tela | 1º material (antes → depois) | Fim do título | Barra |
  |---|---|---|---|
  | Módulo | 693 → 567 px | 650 | 787 |
  | Matéria | 789 → 654 px | 737 | 787 |

  O título fica inteiro acima da barra.
- **Galeria** `docs/ui/index.html`: 15 pares antes|depois (30 PNG, 8,55 MB), só com dados fictícios. Os pares com o catálogo real ficam fora do git (`_fora-do-site/rodadas/capturas-L-visual/`).
- **Pontos do dono** (depois do V2 e do V4): sem resposta durante a execução; segui o plano e deixei os dois registrados. O dono vê o resultado na galeria e na prévia.
- **Fica para depois:**
  - a rodada de ESTRUTURA (`_fora-do-site/rodadas/L-estrutura-plano.md`, com o drill-down, que leva o 1º material a ≤ 420 px);
  - aparelho físico, Safari e leitor de tela.

LAPIDAÇÃO VISUAL ENCERRADA em 05/10/2026

## Lapidação visual, 2ª passada — 04/10/2026

Base `lapidacao-visual @ 3185d5b`; trabalho em `lapidacao-visual-2`. Auditoria local: `_fora-do-site/rodadas/L-visual2-auditoria.md` (15 pontos). Antes: 72 capturas real/seed, 390/1440, claro/escuro, 3D/linhas; mais 28 de editor/estados. Dados reais e diagnósticos permanecem fora do git.

### P1 — Início e acabamento global

Grão reduzido (0,48 escuro / 0,36 claro), ícones com traço comum e ativo violeta, retomada com sombra curta, placas legíveis com luz fina, símbolo de pausa/retomada, pontilhado mais delicado e casos com superfície menos saturada. HTML: apenas o desenho SVG de Todos os materiais. Geometria do mapa, textos e lógica preservados.

- Pares examinados: `visual-v2-antes` → `visual-v2-p1`, 24 imagens novas, ambas as fontes/temas/larguras. Sem rolagem lateral nem erros de console.
- Gates: `node check.mjs`: 0 erros/0 avisos, 24 telas e axe A/AA; `node acervos.mjs`: 105 aprovadas (inclusive guias, rótulos, 3D e interrupções).
- Ficha crítica (§5.1), julgamento do executor no escopo P1: **1 sim**, título/mapa continuam dominantes; **2 sim**, títulos/legendas/contagens diferenciados; **3 sim**, ornamentos e estados de navegação agora violetas; **4 sim**, caixa alta apenas nos códigos/tipos desta tela; **5 sim**, fios sem colisões (acervos); **6 sim**, ritmo e espaço reservado preservados; **7 sim**, menos ruído sobre letras; **8 sim**, foco de 2px, alvos de 44px e estados preservados/refinados nos componentes revistos; **9 sim**, papel claro com luz própria; **10 sim**, Aorta reconhecível. Isso é revisão de acabamento, não comprovação de perfeição nem teste em aparelho físico.

### P2 — Módulo e lista

Abas de unidade com pesos 450/550 e contagens tabulares; foco desenhado dentro das faixas roláveis; busca local com fio e luz interna; favoritos violetas que conservam a seleção ao apontar; títulos Literata 450; miniatura anatômica com contorno mais presente e menos brilho. Apenas `module.css` e `list.css`.

- Pares `visual-v2-antes` → `visual-v2-p2`: 24 capturas examinadas, ambas as fontes/temas/larguras, sem rolagem lateral nem erros. No celular, **567 px no módulo e 654 px na matéria**, iguais à base; fim do primeiro título em 650/737 px, antes da barra em 787 px.
- Revisor `aorta-design-reviewer`: aprovado visualmente, sem defeitos materiais; teclado/hover complementados por leitura do CSS e pelos gates.
- Ficha crítica: **1 sim**, numeral/foco e primeiro material mantêm prioridade; **2 sim**, título, tipo e metadados distintos; **3 sim**, favorito/seleção em violeta; **4 sim**, códigos e tipos apenas; **5 sim**, sublinhados/linhas finos; **6 sim**, nenhum deslocamento do primeiro material; **7 sim**, coração pequeno mais nítido e menos halo; **8 sim**, foco interno e estrela selecionada legíveis, sem reduzir alvos; **9 sim**, fios e fundos próprios em papel claro; **10 sim**, numeral, fonte e artéria preservados.
- Gates P2: `node flows.mjs`: **450/450**, zero falhas; `node topics.mjs`: **57 aprovadas**.

### P3 — Ficha, busca, avisos, esqueleto, Organizar e formulário (Astra; fechado pelo Claude)

- **Ficha:** degradê do topo mais curto; assunto em itálico; etiquetas como pequenas fichas em itálico; "Origem e datas" com seta de abrir.
- **Busca:** títulos em Literata, destaque do termo em violeta, item ativo em tom violeta e dica do rodapé mais legível.
- **Avisos e estados:** o "Desfazer" do aviso ganha um fio separador; a artéria tracejada do estado vazio ficou mais fina; as barras do esqueleto ficaram mais secas.
- **Organizar e formulário:** cabeçalhos e campos no mesmo acabamento.
- **Correção do Claude:** em Coleções, "Excluir" caía sozinho na linha de baixo quando o nome era longo. Agora o nome quebra na própria coluna, e contagem e ações ficam alinhadas.
- **Testes:** `check` 0/0; `flows` 450/450; `topic-edit` 52/52; `import` 59/59.
