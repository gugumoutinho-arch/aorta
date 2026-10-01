# Registro de mudanças — Biblioteca de Medicina

Mais recente primeiro. Regras completas em `AGENTS.md`.

## 2026-10-01 — Codex — Rodada pós-arena: marcador editorial, tema e resposta ao toque — não publicado

- **Pedido/H1:** reduzir a aparência de modelo pronto com composição editorial comprovada em `tools/reports/pos-arena-antes/`: retomada de cartão para marcador aberto, seleção secundária em disclosure e capítulos em Literata sem caixa; matérias recebem abas de tinta. No celular, o capítulo CIS 1 subiu de y848 para y573 e o primeiro material de y997 para y738 na medição visual comparável.
- **H2:** manter Explorar, arraste, busca, filtros, ficha, favorito, status e Desfazer já aprovados; corrigir resposta em movimento reduzido (régua sem deslocamento e borda fixa na aba) e acrescentar contorno imediato ao pressionar botões/status. Curvas existentes `--ease` e `--ease-drawer` preservadas.
- **Tema:** Sistema/Claro/Escuro em diálogo de radios nativos, alvos de 48 px, teclado, `localStorage` com fallback para Sistema, bootstrap antes da primeira pintura, reação a mudança do sistema e `theme-color` sincronizada. Ocupa o botão de aparência no cabeçalho; a busca continua na faixa principal.
- **Dono:** `dona` corrigido para `dono` em `AGENTS.md`, `PRODUCT.md` e `index.html`.
- **Cabeçalho/testes:** `tools/harness.mjs` e `tools/build-pages.mjs` compartilham o mesmo cabeçalho publicado, mantendo `noindex, nofollow` intencional. `npm.cmd run check` — 0 erros/avisos; `node flows.mjs` — 215/215; `npm.cmd run lighthouse` — segunda medição mobile 100/100/100 e desktop 99/100/100 (a primeira medição móvel variou para 92; SEO 54 é esperado com noindex no servidor local).
- **Referências e skills:** evidências, URLs, observações em 375 px, H1/H2 e limites em `_fora-do-site/referencias-pos-arena.md`. Skills abertas: Impeccable (critique/audit/bolder/distill/craft-floor), redesign-existing-projects, emil-design-eng, apple-design, mobile-native, find-animation-opportunities, review-animations, animate, ECC frontend-design-direction/frontend-a11y/motion-foundations/browser-qa/verification-loop. `design-taste-frontend` não instalada/não usada.
- **Capturas/prévia:** antes e depois em `tools/reports/pos-arena-antes/` e `tools/reports/pos-arena-depois/`, incluindo 320 px e reduced-motion. Prévia local pelo harness em `http://127.0.0.1:60890/`, somente seed fictício.
- **Não testado:** aparelho físico, Safari/Firefox, leitor de tela real, teclado virtual, login/gravações no Supabase real, Drive ou publicação. Ponto de retorno: `13812c7`; backup: `versoes/codex-2026-10-01-antes-pos-arena.html`.

## 2026-10-01 — Codex — Atlas: retomada, busca ampla e catálogo por margem — não publicado

- **Mudança:** a busca ocupa a faixa principal também no computador; “Retomar” e “Catálogo” formam uma navegação curta; o início separa “Em estudo”, “Favoritos” e “Recentes” por abas; a retomada ganhou cabeçalho próprio; o catálogo usa faixas de unidade e assuntos em margem; a ficha mantém “Abrir original” no rodapé.
- **Interação:** pressão curta nos comandos, indicador de seleção nas abas, foco persistente no campo e índice contextual com localização atual. Ações por teclado permanecem imediatas e `prefers-reduced-motion` remove deslocamentos.
- **Referências verificadas:** Bencho Like e Time scrubber (estado e alternativa por teclado); MicroKit Sliding Underline Tabs e Focus Field (seleção, foco e indicador); Cult Collab Toolbar (agrupamento). Details Reveal Hero exigia acesso de membro; Skiper permaneceu em carregamento; Originkit foi acessível apenas como leitura da seção. Nenhum padrão não verificado foi implementado.
- **Skills utilizadas:** Impeccable (contexto, craft floor e detector), redesign-existing-projects (diagnóstico e upgrades em CSS existente), emil-design-eng (tabela mental Before/After e limites de movimento), find-animation-opportunities (pressão, seleção, painéis e índice), review-animations (curvas, GPU e redução de movimento), apple-design (resposta no pointer-down e gesto interrompível), mobile-native (toque, safe area e alvos), apple-design (hierarquia e toque).
- **Testado:** `npm.cmd run check` — 0 erros/avisos, 24 telas, axe sem violações; `node flows.mjs` — 128/128; `npm.cmd run lighthouse` executado nas mesmas condições. Capturas comparáveis em `tools/reports/round-before/` e `tools/reports/round-after/`, incluindo matrizes de 375 e 1440 px nos dois temas.
- **Não testado:** aparelho físico, Safari/Firefox, leitor de tela real, teclado virtual, login/gravações no Supabase real e publicação. O servidor local usa apenas `tools/seed.json`; nenhum catálogo real, Drive ou Supabase foi acessado.

## 2026-10-01 — Codex — Atlas contínuo e resposta ao toque — não publicado

- **Pedido:** implementar o plano de autoavaliação de `_fora-do-site/feedback-codex.md` e deixar uma prévia para a dona revisar.
- **Visual:** materiais como entradas contínuas com margem de assunto e separadores, em vez de cartões iguais; retomada mais compacta como marcador verde, sem arcos decorativos; menos versaletes e espaçamento artificial; filtros em três linhas no celular; origem e datas recolhidas na ficha, mantendo ação principal e título inteiro.
- **Toque:** fundo de pressão nos materiais, árvore, filtros e navegação; compressões curtas nos botões; estrela preenchida ao favoritar. Teclado e movimento reduzido recebem resposta imediata sem animação de painel ou escala de pressão.
- **Gravações:** favorito/status respondem localmente, mostram “Salvando alteração…”, protegem contra repetição enquanto pendentes, preservam foco do radio e recuperam estado anterior em erro. O teste usa atraso/falha fictícios; o banco real não foi acessado.
- **Painéis e avisos:** saída pela direção de entrada, reabertura a partir da posição visível, Escape imediato e troca detalhe/formulário sem sobreposição; Desfazer disponível por 10 segundos, com prazo prorrogado durante foco/hover. Avisos comuns não eliminam um Desfazer ativo.
- **Explorar:** abas compactas e legíveis; balão acompanha o ponteiro por frame, com geometria medida no início e navegação apenas ao mudar destino. Índice agrupa matérias por unidades/módulos quando não cabe; com muitos módulos, passa a rolagem nativa e explica a alternativa.
- **Testado:** `npm.cmd run check` final com 0 erros/avisos, 24 telas sem overflow/console e axe sem violações; `node flows.mjs` final 128/128; auditoria adicional 34/34 para pendência, repetição, rollback, foco, teclado, redução de movimento e arraste touch por CDP; escala/interrupção 16/16, incluindo 1.200 materiais fictícios e 20 módulos. Relatórios em `tools/reports/interaction-audit.json` e `tools/reports/scale-interruption-audit.json`. Requisições ao Supabase bloqueadas nesses testes, sem tentativas.
- **Lighthouse final:** celular desempenho/acessibilidade/boas práticas 98/100/100, LCP 1,3 s, CLS 0,019, TBT 150 ms; computador 99/100/100, LCP 0,5 s, CLS 0,069, TBT 0 ms; SEO 82 em ambos. Uma medição anterior desta rodada marcou desempenho móvel 100 e desktop 99; não se afirma manutenção de 100 em todos os ensaios. O relatório desktop atribui a mudança de layout ao carregamento das fontes.
- **Prévia:** servidor local do próprio harness, com `tools/seed.json`; nenhuma cópia de index.html criada. Capturas atualizadas em `tools/reports/shots/` e `tools/reports/flows/`.
- **Não testado:** aparelho físico, teclado virtual, Safari/Firefox, leitor de tela real, login/gravações no Supabase real e publicação. Não houve gasto de créditos, mídia externa, mudança de esquema/RLS, empacotamento ou dependências.
- **Ponto de retorno:** `50f2412`. Mudanças limitadas a `index.html` e este registro.

## 2026-10-01 — Codex — Atlas digital, explorador contextual e leitura ampla — não publicado

- **Pedido:** implementar a modernização revisada com o usuário como a última rodada da noite.
- **Visual:** superfícies claras e carvão esverdeado no tema escuro; Literata nos capítulos e Schibsted Grotesk nos materiais; retomada em verde profundo, com título largo e ações alinhadas; materiais em superfícies discretas; cores das matérias concentradas na seleção. Removidos os pontilhados decorativos. Detalhe com título amplo, ferramentas no topo e metadados em duas colunas.
- **Celular:** os 52 px do índice permanente foram devolvidos à leitura. “Explorar” abre a árvore de matérias e assuntos com o índice de arraste. Tocar navega e fecha; arrastar mostra o destino e, ao soltar, fecha e foca um material. Escape devolve o foco e `aria-expanded` acompanha o estado. O índice e o balão mudam de posição no breakpoint sem duplicar IDs.
- **Computador:** sumário lateral de 280 px, retomada com toda a largura útil e abas inativas discretas. A matéria atual mantém a cor de localização.
- **Figma:** proposta editável em https://www.figma.com/design/uK8IhxlrNvcPCEm4mki3Ar, com três frames (375 claro/escuro e 1440 claro), textos fictícios e camadas editáveis. A implementação foi refinada com os títulos longos dos testes.
- **Higgsfield:** não havia conector nem CLI disponível; nenhum crédito foi gasto. Sem imagens externas ou dependências novas: a peça de retomada usa apenas CSS. Nada foi alterado no empacotamento/publicação.
- **Testado com dados fictícios:**
  - `npm.cmd run check`: 0 erros/avisos, 24 telas sem rolagem lateral e axe sem violações.
  - `node flows.mjs`: 128/128. Inclui o novo explorador, arraste, retorno do foco, busca, filtros, detalhes, favorito, status, remover/Desfazer e alvos de toque; adicionada auditoria axe no detalhe.
  - Auditoria adicional por Playwright/Chrome DevTools Protocol: 16/16. Toque simulado real do protocolo (`touchStart`/`touchMove`/`touchEnd`), foco ao soltar, Escape, mudança de 375 para 1440 px com explorador aberto, ausência de overflow em 320 px, axe nos diálogos e primeiro material inteiro na tela sem histórico, favoritos nem itens em estudo. Relatório gerado: `tools/reports/atlas-audit.json`.
  - `npm.cmd run lighthouse`, medição final sem outros navegadores de teste concorrentes: celular 100/100/100, LCP 1,3 s, CLS 0,001; computador 100/100/100, LCP 0,6 s, CLS 0,025. Uma medição anterior com testes concorrentes marcou desempenho móvel 93.
  - Capturas finais em `tools/reports/shots/`, `tools/reports/flows/` e `tools/reports/atlas/`; comparação anterior em `tools/reports/atlas-before/`. Inspeção visual em 375 e 1440 px, nos dois temas. `git diff --check` sem erros.
- **Não testado:** celular físico, leitor de tela real, Safari/Firefox, login ou gravações no Supabase real e publicação. Nenhum catálogo real foi lido ou alterado nesta rodada.
- **Documentação:** `DESIGN.md` substituído pela especificação atual, com tokens, componentes, interação e referência do Figma; identidade em `AGENTS.md` atualizada. Ponto de retorno: commit anterior `af84706`.

## 2026-10-01 — Claude — remodelação "Índice de dedo" (estrutura, navegação e interação novas) — não publicada

- **Pedido:** `_fora-do-site/prompt-vscode-redesign-v2.md`. Crítica da versão "Pauta e marca-texto" com 8 achados conferidos nas capturas. Os principais:
  - no celular, quadro, busca e filtros vinham antes do primeiro material (Todos: só o título dele em y≈720);
  - no computador, o quadro parecia uma tabela branca;
  - a mesma linha azul "Abrir original" se repetia em cada material;
  - o painel de detalhe era genérico;
  - no escuro, as faixas ficavam turvas.
- **Exploração:** duas direções com prancha, protótipo navegável e capturas lado a lado contra a versão atual (375 e 1440, claro e escuro), com dados fictícios na forma do catálogo real e com o `seed.json`. Tudo em `_fora-do-site/remodelacao/v2/`.
  - **A · Índice de dedo**, escolhida: livro contínuo com abas impressas na borda.
  - **B · Camadas**, descartada: as folhas empilhavam ~400 px antes do primeiro material no celular e deixavam três colunas quase vazias no computador.
  - **O que A ganha:** primeiro material completo na primeira tela em todas as rotas, um gesto até qualquer assunto e identidade própria.
  - **O que A perde:** o livro cresce com muitos períodos (compensado por busca, abas que se agrupam por unidade e sumário), a coluna do índice tira 52 px no celular e a opção "Grade" sai.
- **O que mudou no site:**
  - **Livro:** a página vira um livro: módulo › unidade (capítulo) › matéria (seção com fio na cor da coloração) › assunto (subseção em ordem de semana). Cada material é uma entrada de sumário com "Abrir original" na tinta da matéria.
  - **Índice de dedo:** uma aba por matéria, com altura proporcional. Tocar salta; arrastar o polegar folheia com um balão; ↑/↓ e Enter no teclado. Com a busca ativa, mostra só onde há resultado; se não couber, agrupa por unidade ou módulo.
  - **Navegação:** a cabeça corrente mostra onde você está. O sumário fica à esquerda no computador e em folha no celular (pela cabeça ou pela barra).
  - **Início:** "Aberto por último", "Em estudo" e "Favoritos" quando existem; sem histórico, "Recém-incluídos". Depois vem o livro.
  - **Busca e filtros:** a busca filtra o livro inteiro ao vivo e grifa os termos. "Refinar" recolhido traz tipo, situação, coleção, só favoritos, ordenar e dividir por assunto/período/nenhum.
  - **Ficha:** leva a aba da matéria. Folha no celular, painel no computador.
  - **Acessibilidade e temas:** botão "Ir para os materiais" ao receber foco; tema escuro desenhado à parte.
  - **Fontes:** Literata + Schibsted Grotesk, carregadas sem bloquear a renderização.
- **Preservado:** as duas pontas de banco, esquema e RLS (nada mudou no Supabase), login, coleções, favoritos, situação, cadastro e edição, rotas e voltar, remoção com aviso de que o original fica e Desfazer, busca só em metadados. A preferência antiga "agrupar por matéria" vira "assunto"; `layout` é ignorado.
- **Higgsfield:** não usado.
  - O Higgsfield não está conectado nesta sessão e a extensão Claude in Chrome também não; não houve acesso à conta, ao saldo nem ao preço.
  - O caminho oficial para o Claude Code instala uma CLI global (`npm i -g @higgsfield/cli`), o que você pediu para evitar.
  - Nenhum crédito foi gasto. O desenho usa só CSS e HTML.
- **Testado** (dados fictícios; nada lido nem gravado no banco real):
  - `npm run check`: 0 erros e 0 avisos (24 telas, axe sem violações).
  - `node flows.mjs`: 118 de 118. Novos testes: abas ≥44 px, toque na aba, folhear com balão, sumário em folha, rota de unidade no topo, divisão por assunto e nenhuma.
  - `verificar-indice.mjs`: 81 de 81. Cobre material completo na primeira tela (Início 3, Todos 3, matéria 4 a 375; 5, 6 e 8 a 1440), contraste das tintas (≥6:1 no claro, ≥7,8:1 no escuro), teclado, busca com e sem resultado, sumário, 320 e 768 px sem rolagem lateral, títulos longos sem corte e movimento reduzido.
  - `adversarial.mjs`: os três caminhos até um material no celular funcionam (busca, sumário, folhear), e os 108 controles visíveis clicados têm efeito.
  - `npm run lighthouse`: celular 100/100/100 (LCP 1,3 s, CLS 0,002), computador 100/100/100.
  - Revisão de acessibilidade com `design:accessibility-review`. Revisão de movimento seguindo o `SKILL.md` de `review-animations`, que não é invocável pelo modelo nesta sessão. Correções: atalho para os materiais, nomes acessíveis das abas e da cabeça corrente, fio de chegada em 280 ms.
- **Não testado:** celular de verdade (o gesto de folhear foi testado com mouse simulado, não com toque real), leitor de tela real, Supabase real (login e gravações), publicação no GitHub Pages, Safari e Firefox.
- **Backup:** `versoes/claude-2026-09-30-antes-indice-de-dedo.html` (commit 34de0a1).

## 2026-09-30 — Claude — remodelação "Pauta e marca-texto" (estrutura nova, não só pele) — não publicada

- **Pedido:** `_fora-do-site/prompt-vscode-redesign.md`. A dona confirmou que a biblioteca vai servir a alunos de vários períodos e crescer muito (registrado em `PRODUCT.md`).
- **Processo:**
  - contexto com `impeccable` e `PRODUCT.md`;
  - diagnóstico da versão anterior (Distinção 1, Interação 1, Primeira tela 3, Hierarquia 4, Temas 4, Estados 4, Acabamento 3);
  - três conceitos com prancha e protótipo da tela inicial no celular (A · Mapa do curso, B · Busca com marca-texto, C · Mesa da prova);
  - escolhido B (27 contra 26 e 26), com o quadro de A;
  - C foi recusado porque a situação de estudo é do catálogo, não de cada aluno.

  Tudo em `_fora-do-site/remodelacao/` (`escolha.md`, `pranchas/`, `prototipo/`, `capturas-*`, `antes/`, `depois/`, `referencias/`).
- **O que mudou no site:**
  - **Fora:** o trilho lateral.
  - **Cabeçalho:** abas de módulo com sublinhado deslizante.
  - **Início:** a pergunta "Qual material você procura?", o campo grande com resultados ao vivo e termos grifados (sem acentos, só metadados), os assuntos do curso em ordem de semana como atalhos e o "Quadro do curso" (módulos × unidades com as matérias grifadas). "Aberto por último" continua só com `lastOpenedAt` válido.
  - **Catálogo:** o quadro substitui as abas de unidade e matéria. Numa matéria, células de assunto filtram a lista (novo filtro `subject`, com chip removível); numa unidade, uma faixa por matéria leva à matéria já filtrada.
  - **Materiais:** título em primeiro lugar, a matéria como faixa de marca-texto e "Abrir original" sempre com texto.
  - **Detalhe:** "Abrir original" em destaque e a situação como controle segmentado. Folha no celular, painel no computador.
  - **Tema escuro próprio:** lousa azulada com faixas fluorescentes.
  - **Teclado:** "/", setas e Esc entre a busca e os resultados.
- **Preservado:** banco nas duas pontas, tabelas e campos (nada mudou no Supabase), login, coleções, favoritos, situação, remoção com aviso sobre o original e Desfazer, preferências salvas, agrupar e ordenar, ids usados por `tools/flows.mjs`.
- **Referências:** Originkit ("/"), details.so (assuntos com contagem), Skiper (contagem ao vivo), MicroKit (sublinhado deslizante), Cult UI (segmentado com opção elevada). Do Bencho, só a ideia dos pontos empilhados, que não foi usada. Capturas em `referencias/`.
- **Testado:**
  - `npm run check`: 0 erros e 0 avisos (24 telas, axe sem violações).
  - `node flows.mjs`: 94 de 94.
  - `node verificar-assinatura.mjs`: 49 de 49, com dados na forma do real, em 375 e 1440 px, claro e escuro. Cobre primeira tela com material inteiro e "Abrir original", busca ao vivo, grifo sem animação ao digitar, acentos, setas e Esc, assunto, quadro, filtro que não vaza, contraste das faixas ≥7,6:1 e movimento reduzido.
  - `npm run lighthouse`: celular 92/100/100 (CLS 0,032), computador 99/100/100 (CLS 0,015).
  - Revisões `review-animations` e `accessibility-review` feitas, com as correções aplicadas: grifo animado só no toque; borda dos campos ≥3:1; anúncio só da contagem.
  - Estados sem login e erro capturados.
- **Não testado:**
  - celular de verdade;
  - leitor de tela real (NVDA/VoiceOver);
  - Supabase real (login, gravações);
  - publicação no GitHub Pages;
  - Safari e Firefox (View Transitions e container queries têm alternativa, mas não foram vistas);
  - 768 px só pelo `check`.
- **Backup:** `versoes/claude-2026-09-30-antes-pauta-marca-texto.html` (commit 2cdc6a6).

## 2026-09-30 — Claude — remodelação "Biblioteca clínica" — ainda não publicada

- **O que mudou:** a pedido do usuário, que achou a identidade anterior pesada (títulos condensados em caixa alta, números grandes, fios pretos, lâminas e manchas). Nova identidade: Figtree na interface e nos materiais, JetBrains Mono só em contagens e datas; fundo cinza-esverdeado claro com superfícies claras; verde profundo no trilho lateral, nas ações principais e no item selecionado; a cor de cada matéria virou um ponto de localização; tema escuro com superfícies próprias (trilho, fundo e cartões distintos). O CSS foi reescrito num único bloco (sem camadas de sobrescrita), com tokens claros e escuros.
- **Composição:** no computador, trilho lateral verde distinto do catálogo, com índice módulo › unidade › matéria que abre só o caminho atual, seta de expansão e o local atual em faixa clara. No celular, cabeçalho compacto com abas de módulo e barra inferior clara com indicador. Início: busca na primeira tela; "Aberto por último" só com `lastOpenedAt` válido, como um cartão de material (localização completa, tipo, título, "Abrir original" e "Detalhes"); sem histórico começa por Em estudo e Adicionados recentemente; módulos ficam na navegação (computador) ou depois das listas (celular). Catálogo: linhas em que o título manda e localização (com ponto), tipo, assunto e situação ficam abaixo em tom secundário; "Abrir" separado do clique no título (detalhes); números grandes e numeração removidos; a exibição alternativa agora se chama "Grade" (mesma preferência salva, `grid`). Busca e filtros: busca + uma faixa compacta de seletores (sem caixas idênticas empilhadas); no celular, botão "Filtros · n" com painel rotulado; chips removíveis dos filtros ativos nas duas larguras. Detalhes: painel lateral/folha inferior com título, favorito, "Abrir original" e situação (controle segmentado) primeiro; metadados em segundo plano; Editar e "Remover do catálogo" no rodapé.
- **JavaScript:** só produtores de marcação (`entry`, `metaLine` no lugar de `codeLine`/`subLine`, `feature`, `renderDetail`, `renderModTabs`, novo `renderActiveFilters`). Removidos `codeParts`/`codeOf`/`abbr` (sem uso) e as faixas de cor do diálogo. Corrigido: ao fechar o detalhe com Esc depois de favoritar/mudar situação, o foco ia para o `body` (a lista é redesenhada com o painel aberto); agora volta ao mesmo material (`data-mid`). Banco, coleções, campos, ids usados pelo script, `<dialog>`, aviso de remoção e Desfazer não mudaram.
- **Referências:** Cult UI (controle segmentado de seleção única): aproveitei só a ideia de uma opção ativa destacada por superfície elevada, usada em Lista/Grade e na situação de estudo — sem mola, vidro nem biblioteca. Bencho e MicroKit: não consegui ler exemplos concretos pela ferramenta de busca (a página do Bencho devolveu só o título), então não aproveitei nada deles.
- **Fonte:** Figtree com `display=swap`; CLS 0 no celular e 0,002 no computador.
- **Testado:** `npm run check` sem erros nem avisos (24 telas, axe sem violações); `npm run lighthouse`: celular 92/100/100 (CLS 0), computador 99/100/100 (CLS 0,002); novo `tools/flows.mjs` com 94 verificações aprovadas em 375 e 1440 px, claro e escuro, com o banco fictício: início com histórico e sem histórico, carregando (esqueleto), catálogo, títulos longos sem corte, filtros ativos e remoção por chip, limpar, vazio, grade, agrupar por assunto, detalhe sem "null", foco dentro do painel, favorito, situação, Esc devolvendo o foco, remover com aviso do arquivo original e Desfazer, controles de pelo menos 44 px e ausência de erros de console. Capturas em `tools/reports/shots/` e `tools/reports/flows/`.
- **Não testado:** celular de verdade (toque, teclado virtual, área segura); 768 px só pelo `check` (sem fluxos); login real e gravações no Supabase; nada foi lido nem alterado no banco real; leitor de tela; `prefers-reduced-motion` e `prefers-contrast` só revistos no código; publicação no GitHub Pages (não publicado nem enviado nesta tarefa).
- **Backup:** `versoes/claude-2026-09-30-antes-remodelacao-clinica.html` (e o commit anterior do git).

## 2026-09-30 — Claude — catálogo no Supabase e site próprio (GitHub Pages)

- **O que mudou:** a pedido do usuário, para que Codex e Claude trabalhem no mesmo lugar. Criado o projeto Supabase `biblioteca-medicina` (grátis, São Paulo) com as tabelas `materials`, `areas` e `collections`, regras de acesso só para os e-mails da dona e tempo real ligado. O catálogo foi copiado do Artifact: 13 áreas, 2 coleções, 26 materiais (conferido por contagem). O `index.html` ganhou uma segunda ponta de banco (`supaDb`) e login sem senha por link/código no e-mail; dentro do claude.ai continua usando `window.claude.use("db")`. Novo `tools/build-pages.mjs` e fluxo `.github/workflows/pages.yml` para publicar no GitHub Pages. `AGENTS.md` reescrito.
- **Testado:** `npm run check` sem erros; 46 verificações de fluxo com o banco fictício; modo site próprio sem login mostra a tela de entrada, sem dados e sem erros de console (375 e 1440 px); verificador de segurança do Supabase sem alertas.
- **Não testado:** login real e gravação no Supabase (depende do usuário entrar); publicação no GitHub Pages (depende de `gh auth login`).

## 2026-09-30 — Claude — identidade "Prontuário + Laminário" (substitui a editorial) — ainda não publicada

- **O que mudou:** o usuário achou a versão editorial comum demais e escolheu misturar dois conceitos. Estrutura do **Prontuário**: Archivo condensada em caixa alta nos títulos, números grandes (01, 02…) em cada material, fios pretos, botão de abrir numa coluna própria, vermelho só no que está ativo e na ação principal, barra inferior preta. Identidade do **Laminário**: mini-lâmina (etiqueta fosca + vidro com a mancha da coloração) em cada material, no índice e no título da área; "Aberto por último" como uma lâmina grande com etiqueta escrita à mão (Kalam); a exibição alternativa "Lâminas" mostra cada material como lâmina de vidro. Só o CSS e os produtores de linha e destaque (`entry`, `feature`) mudaram; banco, ids, `<dialog>`, remoção e Desfazer seguem iguais.
- **Fontes:** Archivo (eixos de largura e peso), JetBrains Mono e Kalam, com `display=swap`. O visual depende da largura condensada, e com `optional` a primeira carga caía numa fonte larga que estourava o trilho.
- **Testado:** `npm run check` sem erros nem avisos (24 telas, axe sem violações); 46 verificações de fluxo com banco fictício aprovadas (detalhe sem "null", favorito, status, remover e Desfazer, filtros, agrupamento, voltar, "/", foco com Esc); Lighthouse celular 92/100/100 com CLS 0,026, computador 99/100/100 com CLS 0,01; exibição "Lâminas" sem rolagem lateral em 375 e 1440 px.
- **Não testado:** celular de verdade; gravações no banco real.
- **Anterior:** a versão editorial está no commit anterior do git.

## 2026-09-30 — Claude — remodelação editorial (direção B com a organização da A) — ainda não publicada

- **O que mudou:** nova identidade de "acervo editorial": Newsreader nos títulos, Public Sans na interface, papel claro e tinta escura, destaque terracota só para ações e seleção; no escuro, carvão quente. Os materiais viraram linhas numeradas (título em serifa, localização com o ponto de cor da unidade, tipo, assunto, "Abrir ↗"); a opção "Fichas" substitui a grade. Início compacto: busca, "Aberto por último" (só quando há `lastOpenedAt`), Em estudo, Favoritos e Adicionados recentemente; saíram o título gigante, o símbolo de microscópio e os quatro indicadores em bloco. No computador, trilho lateral claro com índice progressivo (módulo › unidade › matéria, abre só o caminho atual) e botão "Adicionar link"; detalhe como painel à direita. No celular, barra inferior com Início, Acervo, Adicionar e Organizar; filtros num botão "Filtros · n"; detalhe como folha inferior. Estados de carregamento em esqueleto; tecla "/" leva à busca.
- **Correções:** textos "null" no detalhe (`replaceChildren` com nós ausentes); nome acessível da marca ("Bibliotecade Medicina"); deslocamento de layout (fontes com `display=optional` e carregamento sem aviso que empurra a página); "1 favoritos"; preferências salvas agora são validadas.
- **Preservado:** `window.claude.use("db")`, coleções e campos; ids, `data-*` e `<dialog>` usados pelo script; aviso de remoção e Desfazer; busca só em metadados.
- **Por quê:** o primeiro material no celular aparecia em y=1445; agora aparece em y≈214 no início e ≈475 numa unidade (dados fictícios, 375×812).
- **Testado:** `npm run check` sem erros nem avisos (24 telas, axe sem violações); Lighthouse celular 90/100/100 com CLS 0 (antes 0,152), computador 99/100/100 com CLS 0,002; auditoria de rótulo aprovada nos dois. Fluxos com banco fictício em 375 px (claro e escuro) e 1440 px (escuro): detalhe sem "null", favorito, status, remover e Desfazer, filtro e limpar, agrupamento por assunto, voltar do navegador, "/" e retorno do foco ao fechar com Esc — 46 verificações aprovadas. Banco real lido só para conferir campos (nada gravado): 26 materiais, nenhum com `lastOpenedAt`, então o início real começa por "Adicionados recentemente".
- **Não testado:** celular de verdade (toque, teclado virtual, área segura); gravações no banco real; primeira visita com fontes ainda não baixadas (com `display=optional` pode aparecer Georgia/sistema na primeira carga).
- **Backup:** `versoes/claude-2026-09-30-antes-editorial.html` (a "nova composição" do Codex).

## 2026-09-30 — Claude — infraestrutura de verificação e histórico (nada mudou no site)

- **Repositório Git local** criado nesta pasta (`.gitignore` exclui `_fora-do-site/` e `node_modules/`). Primeiro commit com o `index.html` do momento (inclui as edições do Codex ainda não publicadas) e `versoes/`.
- **`tools/`**: `npm run check` (formato de publicação, sintaxe, CSS, HTML, 24 telas em 375/768/1440 px nos temas claro e escuro, erros de console e acessibilidade com axe-core) e `npm run lighthouse`. Usam dados fictícios e o Chrome instalado.
- **Resultado sobre o `index.html` atual (nova composição do Codex):** `check` sem erros e sem avisos; Lighthouse: acessibilidade 100 e boas práticas 100 nos dois tamanhos, desempenho 91 no celular e 96 no computador, SEO 82. **A corrigir:** deslocamento de layout (CLS) de 0,152 no celular (limite recomendado: 0,1) e o aviso "Elements with visible text labels do not have matching accessible names".
- **CI no GitHub** (`.github/workflows/check.yml`): roda o mesmo `check` a cada envio. Só funciona depois que o repositório for enviado ao GitHub.
- **Não testado:** a página publicada na conta do usuário; a gravação de dados (o teste usa um banco fictício em memória).

## 2026-09-30 — Codex — nova composição da biblioteca

- **O que mudou:** o computador ganhou uma navegação lateral persistente por acervo e módulos; a página inicial agora separa materiais para retomar da exploração por módulos; a biblioteca dispõe filtros em uma coluna própria; os cartões em grade passaram a ter formato vertical de lâmina, distinto da lista compacta. O celular conserva a navegação superior e inferior, com a exploração por módulos antes das listas de materiais. Mensagens de módulos e coleções deixam de declarar o catálogo vazio quando o banco está indisponível.
- **Por quê:** a revisão anterior preservava a estrutura da página e causava pouca mudança perceptível. Esta versão altera o percurso de navegação e a distribuição real do conteúdo, mantendo o catálogo e os comportamentos existentes.
- **Testado:** backup `versoes/codex-2026-09-30-0104.html` criado antes da edição. Sintaxe do JavaScript validada no Node. O Chrome headless com DevTools exibiu as telas Início, Todos e Organizar em 375 px e Início e Todos em 1440 px; a largura do documento não ultrapassou a janela nessas telas. Tema escuro em 375 px, preferência por movimento reduzido (transição calculada de 0 s) e foco visível após Tab também foram conferidos. O início do arquivo, as tags proibidas e o acesso `window.claude.use("db")` foram preservados.
- **Não testado:** cartões e navegação com os 26 registros reais, edição, favoritos, status e remoção no Artifact, porque a página local não recebe acesso ao banco. A publicação permanece com o Claude.

## 2026-09-30 — Codex — redesenho da interface da biblioteca

- **O que mudou:** a página inicial ganhou busca prioritária, atalhos para o acervo e uma referência estática ao campo do microscópio. A navegação de módulos, unidades e matérias, os cartões de materiais, a visualização em lista, os filtros, os estados selecionados, os formulários e os detalhes receberam uma hierarquia visual mais clara em temas claro e escuro. Os alvos principais passaram a ter pelo menos 44 px e as transições ficaram curtas e ligadas à ação.
- **Por quê:** tornar a localização e a leitura dos materiais mais rápidas em computador e celular. As referências consultadas orientaram decisões concretas: controle segmentado de grade/lista inspirado no [Cult UI](https://pro.cult-ui.com/docs/components/animated-segmented), estados de navegação mais claros a partir do [Skiper UI](https://skiper-ui.com/v1/skiper96), e uma única peça visual focal no lugar de efeitos contínuos, após examinar o [Originkit](https://www.originkit.dev/). Tudo foi implementado no arquivo existente, sem dependências novas.
- **Testado:** o arquivo manteve o início em `<title>` e não ganhou tags de documento; a sintaxe do JavaScript passou no `vm.Script` do Node; o script é idêntico ao do backup `versoes/codex-2026-09-30-0054.html`, inclusive o acesso ao banco e às três coleções. O Chrome em modo headless carregou a página local em janela de 375 px, manteve a tela inicial visível e apresentou o aviso correto de banco indisponível.
- **Revisado ou não testado:** regras de tema escuro, foco, movimento reduzido e dimensões móveis foram revisadas no código. A inspeção visual, o contraste calculado, a ausência de rolagem horizontal, a interação por teclado e os fluxos com catálogo real não puderam ser verificados nesta sessão: a ferramenta de DevTools encontrou um perfil do Chrome já em uso, e esta visualização não tem acesso ao banco do Artifact.

## 2026-09-30 — Claude — publicação dos ajustes de interface do Codex (versão 3 no ar)

- **O que foi publicado:** o resultado dos ajustes de interface feitos pelo Codex às 00:33 (`versoes/codex-ajustes-ui-0033.html`), no mesmo link do Artifact.
- **Conferido antes de publicar:** o Codex alterou **só o CSS** (+3.580 caracteres, em um bloco "Ajustes de interface Codex" no fim do `<style>`). O script e o HTML do corpo ficaram idênticos à versão anterior, então o catálogo e os campos do banco não foram afetados.
- **Ajustes do Claude no arquivo:**
  1. Removidas as tags `<!doctype>`, `<html>`, `<head>` e `<body>` que o Codex reintroduziu (o arquivo precisa começar em `<title>`; o claude.ai já envolve a página).
  2. Duas sombras com cor fixa (`rgba(34,26,58,…)`) trocadas por `color-mix(in srgb, var(--ink) 30%, transparent)`, para funcionar nos temas claro e escuro.
- **O que mudou na aparência:** título da página inicial maior, faixa de cores na base do cartão de busca, bordas coloridas nas unidades, cartões dos módulos e lâminas com mais espaço, ajustes para celular.
- **Testado:** navegador embutido com dados de teste, no computador (tema claro) e no celular a 375 px (tema escuro), sem rolagem horizontal. **Não testado:** a página publicada aberta na conta do usuário.

## 2026-09-30 00:33 — Codex — ajustes de interface

- Alterou apenas o CSS de `index.html` (guardado em `versoes/codex-ajustes-ui-0033.html`); base em `versoes/base-antes-do-codex.html`.

## 2026-09-30 — Claude — versão em abas (M1/M2 › unidade › matéria), versão 2 no ar

- Estrutura em três níveis, tema de lâminas de microscópio, 26 materiais migrados. Cópia em `versoes/publicado-v2-claude.html`.
