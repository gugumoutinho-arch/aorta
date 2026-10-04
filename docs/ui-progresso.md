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
| U3 · Mapa e tarefa longa | concluído (revisão de design em andamento) | `e4bbae7` |

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
