# Registro de mudanças — Aorta (antes Biblioteca de Medicina)

Mais recente primeiro. Regras completas em `AGENTS.md`.

## 2026-10-04 — Claude — Rodada B, U7: colagem que explica a tabulação — ramo `nuvem/ui-lapidacao`

- **Colagem:** colar com vírgulas dá um aviso claro ("copie direto da planilha ou cole só os links"), em vez de erros genéricos; o texto de ajuda diz que as colunas vêm separadas por tabulação.
- **Organizar:** nomes curtos da árvore com alvo de 44 px.
- **Testado:** `npm test` 129/129; `import` 59/59; `check` 0/0.

## 2026-10-04 — Claude — Rodada B, U6: busca rápida mais limpa — ramo `nuvem/ui-lapidacao`

- **Resultado:** caminho curto (unidade › matéria · assunto); tipo do material à direita; acervo só quando é o outro; a lista não é refeita quando a busca não mudou (acento e caixa ignorados).
- **Testado:** `npm test` 126/126; `flows` 444/444; `check` 0/0.

## 2026-10-04 — Claude — Rodada B, U4 e U5 (direção D): página do módulo e ficha — ramo `nuvem/ui-lapidacao`, não publicado

- **U4 (nuvem, `5dbc810`):**
  - numeral gigante com foco em Literata;
  - lista editorial no lugar dos cartões;
  - ficha fixa à direita a partir de 1200 px;
  - filtros compactos e "Em produção" desenhado.
  Revisão de design feita localmente pelas capturas; um ajuste (resumo sem palavra sozinha na última linha).
- **U5 (nuvem, `79dd68b` e `4fd3856`, testados localmente):**
  - ficha e busca nascem de onde foram chamadas;
  - movimento reduzido no meio do arraste devolve a folha;
  - 32 testes novos da folha no celular.
- **Testado no Windows, com fontes reais:** `npm test` 120/120; `check` 0/0; `flows` 432/432; `topics` 57/57; `topic-edit` 52/52; `import` 59/59; `acervos` 105/105.
- **Não testado:** aparelho físico, Safari, leitor de tela.

## 2026-10-04 — Claude (nuvem) — Rodada B · U3 · Mapa e tarefa longa — ramo `nuvem/ui-lapidacao`, não publicado

- **O que mudou:**
  - desenho entre as colunas de rótulos;
  - guias sem cruzar (lado pela ponta, troca de vizinhos);
  - rótulo ativo por forma;
  - anel do cursor vazado;
  - órgão legível no tema claro;
  - entrada mais leve: um contexto WebGL só, 1ª medida da pílula no quadro seguinte, layout com leituras antes das escritas e guias sem ler o DOM a cada quadro.
- **Medido:** maior tarefa da entrada do IDOMED, mediana de 5 com CPU 4×: 968 ms → 174 ms (base 660).
- **Testado:** `npm test` 120/120; `check` 0/0; `flows` 391/391; `acervos` 105/105, com o teste novo de guias sem cruzar.
- **Não verificado:** aparelho real (as medidas são do SwiftShader).

## 2026-10-04 — Claude (nuvem) — Rodada B · U2 · Início na direção D — ramo `nuvem/ui-lapidacao`, não publicado

- **O que mudou:**
  - palco: brilho, título, busca e "Continuar" em vidro;
  - rótulos do mapa como painéis;
  - índice editorial numerado e prateleira de casos clínicos;
  - listas em linhas;
  - no celular: palco compacto e barra inferior (Início, Mapa, Favoritos, Buscar).
- **Por quê:** é a direção D aprovada pelo dono.
- **Estabilidade:**
  - fontes substitutas com largura medida;
  - textos do acervo antes da primeira pintura;
  - espaços reservados;
  - colagem de links carregada só em Organizar.
- **Testado:**
  - `npm test` 120/120; `check` 0/0; `flows` 368/368; `acervos` 71/71; `topics` 57/57; `import` 59/59;
  - orçamento ESTRITO passa (CLS máximo 0,0019);
  - Lighthouse celular 93/93, acessibilidade e boas práticas 100.
  - Verificações antigas trocadas pela nova verdade em `flows` e `acervos` (ver `docs/ui-progresso.md`).
- **Não verificado:** celular real; compreensão em 5 s com alunos.
- **Correções da revisão de design:**
  - foco, rota do índice e texto honesto ("links para os originais", "Buscar entre");
  - sem desfoque;
  - testes da barra inferior e da prateleira de casos.
  - `flows` 391/391.

## 2026-10-04 — Claude (nuvem) — Rodada B · U1 · Sistema de movimento — ramo `nuvem/ui-lapidacao`, não publicado

- **O que mudou:**
  - coreografia por categoria (gesto, ponteiro, troca, entrada, saída, lista, mergulho, cena 3D) em DESIGN.md › Movimento;
  - utilitários `src/ui/choreo.js` (`enter`, `exit`, `swap`, `press`, `respond`, `cascade`) sobre os tokens;
  - migrados os usos da interface: diálogos, ficha, cabeçalho do módulo, voo do título, entrada do início, pressão e inclinação. Os diálogos não saem mais com `power2.in`, e a pressão foi de .975 para .97.
- **Régua no `check`** (`tools/motion-rules.mjs`, teste com fixtures positivas e negativas):
  - na interface (`src/ui`, `src/views`) não pode haver duração literal nem curva que só acelera;
  - exceção só com "movimento: exceção — <motivo>" na mesma linha;
  - a cena 3D fica fora da régua, com justificativa.
  - O hexadecimal fora de `tokens.css` passou de aviso a erro.
- **Fundo dos diálogos sem desfoque:** só o palco pode ter vidro. Medido: o p95 ativo da ficha a 1440 px caiu de 383 para 83 ms (SwiftShader).
- **Testado (cópia isolada de `110d1de`):** `npm test` 115/115 com `CHROME_PATH`; `check` 0 erros e 0 avisos; `flows` 364/364; `acervos` 71/71. Vídeos e medidas antes e depois em `docs/ui-progresso.md`. O aceite de p95 ≤ 20 ms é só parcial (ver lá).
- **Não verificado:** sensação do movimento em aparelho real (o vídeo é SwiftShader, sem GPU).

## 2026-10-04 — Claude (nuvem) — Rodada B · preflight e U0 · Auditoria — ramo `nuvem/ui-lapidacao`, não publicado

- **Preflight:** as fontes reais passaram a carregar no Chromium da nuvem. A CA do proxy foi registrada no NSS, com a verificação TLS ligada. Bateria G na base `d5fcad2` toda verde; Lighthouse celular 91/90, acessibilidade e boas práticas 100.
- **Ferramentas novas:**
  - `tools/ambiente.mjs` (preflight);
  - `tools/auditoria.mjs` (matriz de capturas);
  - `tools/movimento.mjs` (vídeos e p95 só do movimento ativo);
  - `tools/resumo-medidas.mjs` (mediana e pior caso de `medir-v5`);
  - `tools/galeria.mjs` (`docs/ui/`).
- **Auditoria:** `docs/ui-auditoria.md`, com 162 capturas da base, achados P0–P3 e as medidas da base (CLS, maior tarefa, p95 ativo).

## 2026-10-03 — Claude (nuvem) — Rodada A · N5 (seguimento da revisão de design) — ramo `nuvem/f1-conteudo`, não publicado

- **Por quê:** a revisão (`aorta-design-reviewer`) apontou que a borda do coração ficava na cor da Cardiologia o tempo todo, inclusive no batimento de repouso, que é de todos os módulos. Ele acendia duas vezes por ciclo e ficava tingido mesmo com a Cardiologia "em produção".
- **O que mudou** (`src/body/body.js`, `src/body/routes.js`):
  - a borda do coração volta a ser sempre `--flow`;
  - a cor do módulo entra num brilho próprio (`accent`/`own`), que só acende quando a Cardiologia é apontada e tem material;
  - o repouso não acende o coração;
  - o realce dos órgãos continua depois do pulso enquanto o módulo está apontado (antes apagava);
  - o pulso nos órgãos passa a começar quando chega (`immediateRender: false`);
  - pausar o batimento zera os brilhos congelados.
- **Regras puras:** `lightsOnArrival` e `restingGlow`.
- **Testado:** `routes.test` 8/8; `npm test` 108/108; `acervos` 71/71; `check` 0 erro(s); `flows` 364/364.
- **Não verificado:** o brilho no 3D em si. Os testes conferem a regra e a classe `.hot` da guia; capturas do SwiftShader não provam a animação.
- **Pendentes (já existiam antes):**
  - o anel "ABRIR" do cursor cobre parte do nome sob o ponteiro e continua visível depois de mudar de rota;
  - a página do módulo usa `--atrium` como base do coração, e o corpo usa `--ventricle`.

## 2026-10-03 — Claude (nuvem) — Rodada A · N5 · Cardiologia acende o coração do corpo — ramo `nuvem/f1-conteudo`, não publicado

- **Antes desta rodada:** o destino "coracao" já existia (`e60e5e3`): rótulo "Coração", traçado da raiz da aorta até perto do ápice, mergulho até a ponta e coração 3D na página do módulo. Mas o `body.js` desenhava o coração **fora** dos órgãos, então ele não acendia nem pulsava com o módulo.
- **O que mudou:**
  - função pura `organOwners` (`src/body/routes.js`): órgão (ou o coração) → módulo cujo destino o inclui;
  - no corpo 3D, quando há Cardiologia, o coração conta como órgão dela: borda na cor do módulo, acende ao apontar ou focar o rótulo e pulsa quando o fluxo chega. A cor de base (`--ventricle`) e a entrada do coração não mudam;
  - sem Cardiologia, o coração continua só a bomba de todos.
- **Testado:** `routes.test` 7/7 (cardio → coração, ordem do array não muda destinos, desconhecido → destino livre, M1 → pé, coração é órgão da Cardiologia e de ninguém sem ela); `npm test` 107/107; `acervos` 71/71 com uma Cardiologia fictícia (rótulo "Coração", apontar realça o caminho até o coração, mergulho abre o módulo com o coração 3D; capturas `tools/reports/refino/cardio-destaque.png` e `cardio-modulo.png`).
- **Não testado:** brilho do coração medido no WebGL (só por captura, com SwiftShader); GPU real.

## 2026-10-03 — Claude (nuvem) — Rodada A · N4 · Colagem endurecida e publicação determinística — ramo `nuvem/f1-conteudo`, não publicado

- **Parser (`src/domain/import.js`):**
  - Drive só com host **exato** (`drive.google.com`/`docs.google.com`): subdomínio ou domínio parecido não é tratado como Drive;
  - link com usuário/senha embutidos é recusado, e na prévia aparece mascarado (`•••@`);
  - caminho resolvido segmento a segmento, sempre **dentro do pai** ("Micro e Imuno" em M2 › BBIO 2 não é achado sob M1);
  - nomes iguais no mesmo nível abrem um ramo cada: se sobram vários destinos, a linha pede **escolha explícita**, e cada candidato traz os avisos do próprio ramo; um único destino possível resolve sozinho; nenhum vira "caminho desconhecido";
  - depois de uma unidade sem matérias, segmento desconhecido não vira "assunto".
- **Publicar (`src/core/import-store.js`):**
  - o id do material é o do rascunho (ou o já reservado nele): dois clientes chegam ao **mesmo** material;
  - o id é guardado antes; o material é criado só se não existe (nunca sobrescreve ao retomar);
  - o estado é conferido no banco depois da criação; rascunho ignorado por outro cliente é recusado;
  - "publicado" só depois de todas as ligações.
- **Tela (`src/views/import.js`):**
  - erro, aviso e duplicata diferenciados por ícone **e** palavra ("Erro:", "Aviso:", "Duplicata:");
  - seletor de destino no caso ambíguo, com o destino completo e um diferenciador tirado dos dados (posição, nº de materiais, assuntos), também no "Onde fica" do rascunho quando há nomes repetidos;
  - o foco fica no seletor depois da escolha;
  - direitos com rótulos claros e a mesma explicação nas duas telas ("Público" é o padrão para material do dono e **não certifica direitos de terceiros**).
- **Revisão de design (`aorta-design-reviewer`):**
  - 2 bloqueantes, corrigidos: o foco se perdia ao escolher o destino, e os candidatos ambíguos tinham textos idênticos;
  - 4 importantes, corrigidos: aviso sem seletor, avisos do ramo escolhido sumiam, texto de direitos contraditório, "escolha na prévia" soava obrigatório;
  - sugestões aplicadas: rótulo do seletor com o título, largura do seletor, aviso repetido, senha mascarada, nome de variável;
  - **ficam:** borda `--line-strong` abaixo de 3:1 (decisão de identidade) e ícones de erro e de aviso em cores próximas (a diferença está na forma e na palavra, como pedido). Layout sem referência externa.
- **Testado:**
  - unidade: parser 20/20 (host falso, credenciais, `@` permitido fora do usuário, limitado ao pai, ambíguo com e sem saída, avisos por candidato, id determinístico);
  - gravação 12/12 (falha **antes e depois** de cada escrita — rascunho, material, ligação — e repetir não duplica; "publicado" só depois das ligações; não sobrescreve; ignorado não publica);
  - e2e `import` 59/59: fluxo principal a 1440 e 390 px; cenário com caminho limitado ao pai, ambíguo com escolha e foco, credenciais, host falso, clique duplo, **dois clientes** no mesmo rascunho e falha depois de gravar o material.
- **Bateria G depois do N4 (cópia isolada de `1a4ada4`):** `npm test` 106/106; `check` 0/0; `flows` 364/364; `acervos` 67/67; `topics` 57/57; `topic-edit` 52/52; `import` 59/59. Lighthouse: celular 91 (IDOMED) e 92 (geral), computador 100/99, acessibilidade 100, boas práticas 96. LCP no celular 2,7 s contra 2,4–2,5 s no preflight; o JS inicial cresceu só 2 KB comprimido. Com as fontes sem carregar, os números não são comparáveis; reconfiro na bateria final.
- **Não testado:** Supabase real; a tabela `material_drafts` sem tempo real (a página relê depois de cada gravação própria e, no teste, as abas do mesmo contexto se avisam pelo localStorage).

## 2026-10-03 — Claude (nuvem) — Rodada A · N2 · Formulário com assuntos sobre a gravação nova — ramo `nuvem/f1-conteudo`, não publicado

- **O que mudou:**
  - o formulário (`src/views/form.js`, já com fichas, "Novo assunto" e o aviso do N3 desde `80bc24c`) passou a gravar pelo `setLinksInArea` do N1: só os assuntos da matéria escolhida mudam, as ligações com assuntos de outras matérias ficam, e o texto legado segue a matéria principal;
  - "Novo assunto" usa a criação confirmada no banco do N1;
  - interface sem mudança visual nesta rodada (a revisão de design de `80bc24c` continua valendo).
- **Testado:** e2e novo, editar Anatomia preserva a ligação com um assunto de Práticas Médicas; `topic-edit` 52/52 (1440 escuro e 390 claro, teclado completo, WCAG sem violações, sem rolagem lateral, alvos ≥ 44 px, aberto pela aba de assunto e por Casos clínicos, aviso de nome parecido, XSS, salvar durante a criação, falha ao criar, Esc no aviso); `topics` 57/57; `npm test` 92/92, na cópia isolada do commit `0b4cb09`.
- **Não testado:** leitor de tela real; Safari.

## 2026-10-03 — Claude (nuvem) — Rodada A · N3 · Detector de quase-duplicatas: plural, Unicode e regra de unicidade — ramo `nuvem/f1-conteudo`, não publicado

- **O que mudou (`src/domain/similar.js`):**
  - vocabulário explícito de plural → singular ("membros superiores" → "membro superior", "laterais" → "lateral"…), além das abreviações aprovadas;
  - "MMSS" passa a sugerir "Membro superior", e "Membro sup." sugere também "Membros superiores";
  - os vetos (números/ordinais e direções opostas) continuam valendo antes da distância.
- **Unicidade × semelhança:** a unicidade continua sendo exatamente `topicNorm`, a mesma regra do banco (`private.topic_norm`), sem mudança no SQL. A normalização aproximada só sugere. Teste novo prova as duas coisas, e que `planTopic` normaliza para NFC antes de comparar (texto decomposto vira o mesmo assunto).
- **Testado:** `similar.test` 10/10 (casos obrigatórios, plural, composto × decomposto, unicidade × sugestão), com os novos reprovando antes da mudança; `npm test` 92/92 e `topic-edit` 51/51 na cópia isolada do commit.
- **Decisão a confirmar com o dono:** a lista de plurais e as abreviações extras ("inf.", algarismos romanos) ficam em constantes, para ele aprovar ou cortar.

## 2026-10-03 — Claude (nuvem) — Rodada A · N1 · As duas pontas do banco iguais para assuntos, ligações e rascunhos — ramo `nuvem/f1-conteudo`, não publicado

- **Esquema único (`src/core/schema.js`):** colunas, chaves, unicidade, chaves estrangeiras, cascata/restrict e coluna gerada, copiados da migração `20261003190000_assuntos.sql`. O adaptador do Supabase e o banco fictício usam a mesma fonte; o que não está no esquema não é gravado em nenhum dos dois.
- **Ligações (`material_topics`):**
  - id composto só no adaptador e no mock, com cada parte codificada (`encodeURIComponent`): ":" ou "%" dentro de um id não confundem; id malformado é recusado;
  - o SQL nunca recebe `id`: upsert de `{material_id, topic_id}` com conflito na dupla, delete filtrando as duas colunas;
  - update é **recusado** explicitamente.
- **Adaptador:**
  - `get` lê pela chave;
  - `create` só insere se não existe (nunca sobrescreve);
  - `list` lê a tabela uma vez;
  - `normalized_name` nunca é enviado.
- **Banco fictício (`tools/harness.mjs`):**
  - unicidade (23505), chaves estrangeiras (23503), cascata ao apagar material e restrict ao apagar assunto ligado;
  - `normalized_name` gerado com as mesmas letras do `topicNorm`; `set` como upsert do Postgres; ids UUID;
  - falha programada **antes** (`__mockFail`) ou **depois** de gravar (`__mockFailAfter`, resposta incerta);
  - persistência entre recargas e entre abas do mesmo contexto do navegador (o localStorage é a fonte única; outro contexto começa limpo).
- **Rede bloqueada:** toda página de teste recusa e registra rede para `*.supabase.co` (`window.__supabaseBlocked` + erro de console, que reprova as suítes).
- **Ações:**
  - `setMaterialTopics(material, matéria, assuntos)` mexe só nos assuntos daquela matéria e preserva os de outras (ex.: Ortopedia);
  - `createTopic` confirma no banco antes de responder: dois clientes com o mesmo nome chegam ao mesmo assunto, e nomes diferentes com o mesmo slug ganham `-2`;
  - texto legado `subject` = primeiro assunto da matéria principal, por ordem e depois id; material que nunca teve assunto conserva o texto livre;
  - o Desfazer da remoção só confirma quando material **e** ligações voltaram; se parar no meio, oferece "Tentar de novo".
- **Atomicidade:** não foi preciso RPC. As escritas são repetíveis (upsert, create sem sobrescrever) e conferidas no banco, então nenhum SQL novo é proposto aqui.
- **Testado:**
  - `npm test` 89/89: adaptador com cliente espião (payload, filtros, sem `id`, update recusado, `get`/`create`/`list`), mock (unicidade, FK, cascata, restrict, coluna gerada e filtrada, persistência por contexto, falha antes e depois), criação concorrente e texto legado; guarda do Supabase (fetch, XHR e WebSocket recusados e registrados);
  - `check` 0/0; `flows` 364/364; `topics` 57/57; `import` 44/44;
  - `topic-edit` 51/51: banco persistente — criar assunto, ligar, desligar, recarregar mantém; remover e desfazer com falha no meio, "Tentar de novo", tudo de volta depois de recarregar.
  - Antes da correção, o e2e reprova esperando "Tentar de novo"; os testes de unidade novos reprovaram antes da implementação.
- **Não testado:** Supabase real (nenhum acesso).

## 2026-10-03 — Claude (nuvem) — Rodada A · N6 · "botão fica pressionado" e trocas rápidas sem exceção — ramo `nuvem/f1-conteudo`, não publicado

- **Retomada:** o ramo já existia (sessão anterior). Validei que descende do `prototipo-v4` e trouxe o `prototipo-v4` atual (`4b6f838`) por merge (`7303e51`), sem force. SHA base desta rodada: `4b6f838`.
- **Trocas rápidas** (corrigido no produto em `57f77e6`: o título é cancelado pela referência do tween). Reprodução fiel e mínima, no código atual: **0 falhas em 10** (antes: 1/30, 2/40 e ≥ 1/11).
- **"Botão fica pressionado até soltar"** (a exceção que sobrava no `acervos`). Reprodução da mesma sequência com CPU 6× mais lenta, registrando o que a página viu:
  - nas falhas, **0 ou 1 quadro** foi desenhado entre o "pressionar" e a medida: ligar o movimento faz o 3D começar e ocupa a thread;
  - em **10 de 10**, a página viu o movimento ligado e o botão afundou assim que houve quadro.
  O produto estava certo; o teste media 250 ms fixos depois de pressionar. Agora ele espera a CONDIÇÃO (afundou com o mouse ainda apertado, até 3 s) e, ao soltar, espera voltar. A verificação continua a mesma; não foi afrouxada.
- **Resultados:** com a regra antiga, a reprodução sob carga falhou 2/10; com a nova, 10/10. `acervos.mjs` completo **67/67 em 3 de 3** rodadas.
- **Não testado:** aparelho físico e GPU real (o 3D roda por software aqui).

## 2026-10-03 — Claude (nuvem) — N7 (extra) · Desempenho da primeira tela: tentado, medido e revertido — ramo `nuvem/f1-conteudo`

- **Tentativa (`368fce2`, revertida em seguida):** `layout()` em `src/views/map.js` passou a ler todas as medidas dos rótulos antes de escrever posições e lados. Antes, cada leitura vinha depois do `data-side` do rótulo anterior, que muda o alinhamento pelo CSS. As caixas calculadas eram reaproveitadas pelas linhas-guia, inclusive nos quadros do 3D, sem medir nada.
- **Medições (cópias isoladas, nada em paralelo, CPU 4×, 3D por software):**
  - `medir-v5 --fase=n7-antes-k / n7-depois-k`, 6 pares alternados:
    - **IDOMED**, maior tarefa da entrada: medianas ~673 ms antes e ~931 ms depois (faixas 167–1.660 e 282–1.404); p95 de quadro ~550 → ~383 ms.
    - **Geral**, maior tarefa da entrada: ~223 → ~209 ms; p95 de quadro igual (~175 ms).
  - Contagem e tempo de layout na entrada (`Performance.getMetrics`, mediana de 5): **layouts −70%** (161 → 41, 89 → 31, 152 → 39, 93 → 33). Tempo total de layout quase igual: 132 → 125 e 158 → 133 ms a 390 px; empate a 1440 px. O diagnóstico de partida (~190 ms de layout em `layout()`) não se reproduziu aqui: os layouts eliminados eram baratos.
  - Lighthouse (mediana de 3): igual antes e depois. Celular 94/94, computador 100/100; geral no celular 94 (meta ≥ 88).
- **Decisão:** a meta ("maior tarefa da entrada claramente menor") não foi atingida, e a IDOMED até piorou na mediana, com variação enorme, dominada pelo carregamento do coração 3D. Pela regra do pacote, **revertido** (`128067b`). O código fica no histórico para ser retomado junto com o carregamento do 3D, que é o que pesa de verdade na maior tarefa.

## 2026-10-03 — Claude (nuvem) — N6 · Instabilidade "trocas rápidas preservam último acervo e título" — ramo `nuvem/f1-conteudo`, não publicado

- **Causa raiz (defeito do produto, não do teste), achada com registro de cada escrita no título e de cada split:**
  - `revealHeadline` (`src/ui/motion.js`) cancelava a entrada do título com `gsap.killTweensOf(split.lines)`. Em trocas rápidas de acervo, com a thread ocupada pelo 3D, esse cancelamento às vezes **não matava** o tween. No registro: split 2 cancelado aos 1.945 ms, mas o tween dele terminou aos 2.601 ms.
  - O `onComplete` desse tween apagava do mapa `splits` a entrada do elemento **sem conferir de quem era**, e apagava a do split atual (o 5).
  - O split 5 ficou órfão, com o HTML do título da IDOMED guardado. Na troca seguinte, `cancelHeadline` não o achou, e o construtor do novo `SplitText` restaurou aquele HTML antigo (`overwrite`): o corpo aparecia com "O que você vai estudar hoje?".
- **Correção:** o tween fica guardado com o split e é cancelado pela referência (`tween.kill()`); o `onComplete` só apaga a entrada se ela ainda for do próprio split. Nenhuma espera foi aumentada.
- **Antes e depois:**
  - Antes, roteiro focado (só a sequência do teste, 1440 px, 3D por software): 1 falha em 30, 2 em 40 e pelo menos 1 em 11 (rodada interrompida quando a causa apareceu).
  - Antes, `acervos.mjs` inteiro: o teste-alvo falhou 1 vez em 10 rodadas limpas.
  - Depois, roteiro focado: **0 falhas em 60**.
  - Depois, `acervos.mjs` 10 vezes seguidas: o teste-alvo passou **10 de 10**.
- **Duas outras corridas do `acervos.mjs`, vistas na medição:**
  - "rótulos sobrepostos" (3 de 20 rodadas antes, inclusive a 320 px): corrida do teste. Os rótulos nascem no canto e são posicionados no quadro seguinte, e o teste media depois de 180 ms fixos. Agora espera a condição: todos os rótulos com lado definido. Depois: 0 em 10.
  - "botão fica pressionado até soltar" (3 de 20 antes): o código soltava a pressão em **qualquer** mudança de "reduzir movimento", inclusive quando o movimento era ligado (o aviso chega atrasado). Agora só solta quando o movimento reduzido é ativado. **Não resolveu tudo:** depois, ainda 1 falha em 10. Sigo investigando (ver a próxima entrada).
- **Bateria completa no commit do N6:** `npm test` 80/80; `check` 0/0; `flows` 364/364; `acervos` 67/67; `topics` 57/57; `topic-edit` 46/46; `import` 38/38. Lighthouse: celular 94/94, computador 100/100, acessibilidade 100, boas práticas 96 (só o certificado das fontes no proxy da nuvem).
- **Baterias dos commits anteriores, cada uma em cópia isolada:**
  - N4: tudo verde (`acervos` 67/67, `import` 38/38); Lighthouse 94/94 e 100/100, boas práticas 96 pelo mesmo motivo.
  - N5: `npm test` 80/80 e `check` 0/0; `acervos` caiu na corrida dos rótulos, corrigida aqui no N6.

## 2026-10-03 — Claude (nuvem) — N4 · Correções da revisão de design da colagem — ramo `nuvem/f1-conteudo`, não publicado

- **Bloqueante corrigido (honestidade):** antes, a duplicata de um material do catálogo vinha marcada como "ligar". Ao "Salvar rascunhos", o material **já publicado** ganhava assuntos na hora, e o aviso dizia "Nada foi publicado ainda". Agora:
  - a duplicata vem como "Ignorar"; "Ligar agora ao material já publicado" é escolha explícita na linha;
  - escolhida essa opção, a linha avisa: "Ao salvar, 'X' passa a aparecer também em …, já publicado";
  - o resumo e o botão dizem o que vai acontecer ("Salvar 3 rascunhos e ligar 1 material");
  - o aviso final separa o que virou rascunho do que mudou no catálogo;
  - a introdução diz que só uma linha repetida, e só por escolha, muda o catálogo.
- **Importantes corrigidos:**
  - a caixa "Falta para publicar" saiu da região viva (não fala a cada tecla); a recusa de "Publicar" é anunciada uma vez e o foco vai ao motivo;
  - salvar o rascunho não refaz o cartão, e o foco fica; a lista troca só os cartões que mudaram e devolve o foco por id;
  - a prévia só é redesenhada quando muda;
  - botões ocupados usam `aria-disabled` (o foco não cai na página) e, em falha, o foco volta ao botão;
  - publicar ou ignorar leva o foco ao rascunho seguinte;
  - cada cartão tem título visível (`h4`) e nome acessível;
  - "Direitos" ganhou a explicação de que serve para conferir, ainda não fica guardado no material e não muda nada no Drive;
  - campos do cartão em `--paper`, contra o `--surface` do cartão.
- **Sugestões aplicadas:**
  - duplicata em cor de texto com o rótulo "Duplicata" (antes parecia erro);
  - cabeçalho da planilha em `code`, com "copie direto da planilha";
  - os avisos de livro no Drive e de já no catálogo dizem que o caminho é "Ignorar";
  - "Ignorar" tem "Desfazer" e trava o clique duplo;
  - rótulo do seletor com o título da linha;
  - resumo "2 ignoradas (1 por erro)";
  - campo e botão de "Novo assunto" empilham abaixo de 420 px;
  - com a tabela de rascunhos indisponível, o formulário de colagem fica desativado;
  - linha duplicada não mostra pendências de rascunho.
- **Ficaram:** a borda `--line-strong` com 1,9 a 2,3:1, que é de todos os campos do site e decisão de identidade; o rótulo "Ano" vira "Período" no material; animação de prévia e cartão (opcional). Layout sem referência externa: derivado dos painéis do Organizar.
- **Testado:** `npm test` 80/80; `check` 0/0; `tools/import.mjs` 44/44 (inclui: "ligar" não vem escolhido, aviso e botão ao escolher, foco depois de publicar, recusa anunciada com foco no motivo, Ignorar com Desfazer); `tools/topic-edit.mjs` 46/46. Bateria completa no fim do N7.

## 2026-10-03 — Claude (nuvem) — N5 · Cardiologia aponta para o coração no corpo 3D — ramo `nuvem/f1-conteudo`, não publicado

- **Antes:** `src/body/routes.js` mandava `/cardio/` para "pulmao", e `ORDER` não tinha "coracao".
- **Verificação no modelo:** o `public/modelos/corpo.glb` tem o nó `heart` (malha `VH_M_cardiac_chamber` do HuBMAP, 4.532 vértices, caixa de [-0,043; 0,424; -0,015] a [0,081; 0,528; 0,090] m). É a mesma malha que o corpo já desenha como bomba central. A página do módulo a acende pelo `organ.js`, que aceita qualquer nó do GLB.
- **O que mudou:**
  - destino novo "coracao": rótulo "Coração", artéria "a. coronária esquerda · descendente anterior", acende a malha `heart`; o traçado sai da raiz da aorta e desce pela face anterior até perto do ápice, terminando dentro da caixa do coração (estilizado, não anatomia para estudo);
  - `cardio` → coração, e esse padrão vem antes dos outros ("Semiologia cardiovascular" também vai para o coração);
  - `destinationsFor` passa a dar a cada disciplina o mesmo destino em qualquer ordem do array: primeiro os nomes reconhecidos, depois os outros pela ordem do curso (índice). Antes, um nome desconhecido que vinha antes podia tomar o destino de um nome reconhecido;
  - "coracao" entra no fim de `ORDER`: M1 continua indo para o pé.
- **Testado:** `node --test tests/routes.test.mjs` 6/6 (cardio → coração, ponta dentro da caixa do coração, mesma lista em outra ordem → mesmos destinos, nome reconhecido não perde destino, nome desconhecido → destino livre sem repetir, M1 → pé). Quatro reprovaram antes da mudança. Bateria no fim do N6.
- **Não testado:** como os dados fictícios do v4 não têm disciplina "Cardiologia", conferi a tela à parte (captura de tela com uma Cardiologia fictícia, fora dos testes do repositório).

## 2026-10-03 — Claude (nuvem) — N4 · Importação por colagem (Organizar › Colar links) — ramo `nuvem/f1-conteudo`, não publicado

- **O que mudou:**
  - Lógica pura em `src/domain/import.js`. Uma linha por arquivo, só a URL ou TSV com cabeçalho `url · caminho · tipo · titulo · fonte · ano · direitos` (inteiro ou só as primeiras colunas), até 100 linhas; acima disso, o lote inteiro é recusado.
  - ID do arquivo do Drive extraído de `/file/d/`, `/document/d/` etc., `open?id=` e `uc?id=`; a `resourcekey` fica na URL guardada.
  - Recusados com explicação: link de pasta do Drive ("cole os links dos arquivos"), não-https e linha com colunas sem cabeçalho.
  - Duplicata (mesmo arquivo do Drive ou mesma URL normalizada, no catálogo, nos rascunhos ou no próprio lote) é marcada e nunca criada de novo. Se o caminho dá assunto, sugere "ligar ao material que já existe".
  - Campo vazio vira pendência, nunca valor inventado. Tipo, ano e direitos fora da lista também viram pendência.
  - O caminho (`Aorta/IDOMED/M1/CIS 1/Anatomia/Membro superior/`) é ligado a matéria e assunto pelos nomes da árvore. Caminho desconhecido fica "a escolher" e não cria nada.
  - Direitos: padrão "Público" (decisão do dono), com troca no lote e em cada rascunho.
  - Livro com link do Drive é avisado e não pode ser publicado.
- **Tela (`src/views/import.js`, painel no Organizar):**
  - colar → prévia linha a linha (erros, duplicatas, pendências e, em cada linha, criar, ignorar ou ligar) → salvar em `material_drafts`;
  - lista de rascunhos com título, link, onde fica, assuntos (mesmo componente do N2, com aviso de nome parecido do N3), tipo, direitos, fonte e ano, o que falta para publicar, e "Publicar", "Salvar rascunho" e "Ignorar".
  - Nada lê o conteúdo do Drive nem muda permissões; a tela diz isso.
- **Publicar (`src/core/import-store.js`):** o id do material é gravado no rascunho **antes** de criar o material. Repetir depois de um erro no meio reaproveita o mesmo material e só completa o que faltou. Os assuntos são ligados e o texto antigo `subject` = primeiro assunto.
- **Testado (dados fictícios):**
  - `node --test` 18/18 no parser e na gravação (URL, TSV, cabeçalho parcial, pasta, 101 linhas, duplicatas, `resourcekey`, XSS no título, caminho, pendências, livro, publicar idempotente, erro no meio);
  - `tools/import.mjs` 38/38 a 1440 escuro e 390 claro: colar 5 linhas mistas → prévia correta → salvar → recarregar mantém → publicar 2, um deles com erro no meio e nova tentativa → aparecem nas abas certas → nada duplicado → colar de novo marca tudo como duplicata; WCAG sem violações, alvos ≥ 44 px, sem rolagem lateral.
  - O e2e pegou dois defeitos meus antes do commit, já corrigidos: repetir a publicação via o rascunho velho e bloqueava como "já no catálogo"; caminho desconhecido mostrava "Vai para: M1".
  - Os testes de unidade do parser foram escritos antes da implementação, mas não os rodei antes para vê-los reprovar.
- **Não testado:** Supabase real; a tabela `material_drafts` não tem tempo real (a página relê depois de cada gravação própria).
- **Limite conhecido:** a tabela `materials` não tem coluna de direitos. Os direitos do rascunho só decidem se pode publicar; não ficam guardados no material. Guardar exigiria uma migração, que só o dono pode autorizar.

## 2026-10-03 — Claude (nuvem) — N2 · Formulário de material com assuntos — ramo `nuvem/f1-conteudo`, não publicado

- **O que mudou:**
  - Fichas de assunto: depois de escolher a matéria em "Onde fica", os assuntos dela aparecem como fichas de múltipla escolha. Cada ficha é um checkbox real; marcada, fica preenchida e com ✓, então não depende só da cor.
  - "Novo assunto" cria o assunto na hora e já o marca. Nome igual a um existente só marca o existente. Nome parecido (N3) pergunta antes: "Já existe 'Membro superior'. Usar esse?", com "Usar" ou "Criar … mesmo assim"; Esc fecha só o aviso.
  - Formulário aberto numa aba de assunto já vem com a matéria e o assunto marcados. Aberto em "Casos clínicos", vem com o tipo "Caso clínico".
  - Editar: os assuntos ligados vêm marcados. Salvar grava só a diferença (N1) e mantém o texto antigo `subject` = primeiro assunto ligado. Material sem ligação e sem assunto marcado conserva o texto antigo.
  - Área acima de matéria: as fichas somem, um aviso explica, e o campo de texto "Assunto" volta. Sem as tabelas de assunto no banco, o formulário é o de antes.
  - Componente reutilizável `src/views/topic-picker.js`, usado também pelos rascunhos do N4. CSS em `src/styles/dialogs.css`, só com tokens e sem transição com movimento reduzido. Layout sem referência externa, derivado das fichas e das abas que já existem.
- **Revisão (`aorta-design-reviewer`):** nenhum achado bloqueante. Corrigidos:
  - salvar durante "Novo assunto" agora espera o assunto ser criado (antes, o material ficava sem ele);
  - o foco não se perde enquanto o assunto é criado (campo só leitura em vez de desativado);
  - falha ao criar aparece no próprio campo, não só no aviso atrás do diálogo;
  - o ✓ não entra no nome acessível;
  - erro de nome vazio é anunciado;
  - fonte de 14 px nas fichas;
  - placeholder curto e dica de que um assunto novo fica na matéria mesmo se o formulário for cancelado;
  - Esc no aviso fecha só o aviso;
  - regras `[hidden]` repetidas removidas.
  **Ficou:** a borda da ficha desmarcada (`--line-strong`) tem contraste 2,1:1 a 2,3:1, abaixo de 3:1. É o mesmo token de todos os botões e campos, então mudar é decisão de identidade.
- **Banco fictício (`tools/harness.mjs`):** ganchos de teste `window.__mockDelay` e `window.__mockFail`, rascunhos e persistência opcional entre recarregamentos.
- **Testado (dados fictícios):** `tools/topic-edit.mjs` 46/46 (a 1440 escuro e a 390 claro, só teclado, WCAG sem violações, alvos ≥ 44 px, sem rolagem lateral, XSS, salvar durante a criação, falha ao criar e Esc). O e2e reprovou antes de o formulário ser ligado.
- **Bateria completa no commit do N2 (cópia isolada):**
  - `npm test` 56/56; `check` 0 erros e 0 avisos; `flows` 364/364; `topics` 57/57; `topic-edit` 46/46.
  - `acervos` **reprovou** na 3ª verificação, "320 dark idomed sem rolagem e rótulos sobrepostos". O mesmo teste já falhava antes do N2 (3 de 20 rodadas da medição do N6, no código do N3). É uma corrida do teste, corrigida no N6.
  - Lighthouse: desempenho no celular 95 (IDOMED) e 93 (geral); no computador 100/100; acessibilidade 100. Boas práticas **96**: o único erro de console é o certificado das fontes do Google, que o proxy da nuvem intercepta (`ERR_CERT_AUTHORITY_INVALID`). Não desliguei a verificação TLS para contornar. No CI do GitHub, esse erro não existe.
- **Não testado:** Supabase real; leitor de tela real; Safari.

## 2026-10-03 — Claude (nuvem) — N3 · Detector de quase-duplicatas de assunto — ramo `nuvem/f1-conteudo`, não publicado

- **O que mudou:** `src/domain/similar.js` (lógica pura) diz se dois nomes de assunto da mesma matéria são quase iguais. Só sugere; nunca une sozinho.
  - Normalização: NFC, espaços, minúsculas, sem acento e sem pontuação, "ª/º" como letra; abreviações aprovadas viram palavra inteira ("sup." → superior, "inf." → inferior, "mmss" → membros superiores, "mmii" → membros inferiores). A lista fica numa constante, para o dono acrescentar.
  - Parecido quando a distância de edição é ≤ max(1, 12% do maior nome) ou o Jaccard das palavras (sem conectivos como "e" e "de") é ≥ 0,8.
  - Veto: direções opostas (superior/inferior, medial/lateral, direito/esquerdo, anterior/posterior, proximal/distal, cranial/caudal, com plural e gênero) e números ou algarismos romanos diferentes ("1ª semana" × "2ª semana", "Fisiologia I" × "II").
- **Testado:** `node --test` 7/7, incluindo os 4 casos obrigatórios ("Membro sup." ~ "Membro superior"; "Membro superior" ≁ "Membro inferior"; "Gametogênese" ~ "Gametogenese"; "1ª semana" ≁ "2ª semana"). Os testes reprovaram antes de o arquivo existir. `npm test` completo: 56/56. As etapas de tela da bateria do N1 (`check`, `flows`, `acervos`, `topics`, `topic-edit`) rodaram com `similar.js` já presente; nada o importa ainda, então o site não muda.
- **Não testado:** uso na tela (vem no N2).
- **Decisão a confirmar com o dono:** "inf." como inferior e o veto de algarismos romanos foram acrescentados por simetria e por segurança; não estavam na lista dada.

## 2026-10-03 — Claude (nuvem) — N1 · Gravar assuntos e ligações — ramo `nuvem/f1-conteudo`, não publicado

- **O que mudou:** a interface de banco grava `topics`, `material_topics` e `material_drafts` nas duas pontas.
  - Supabase (`src/core/db.js`): a ligação não tem coluna `id`. `doc("<material>:<assunto>")` vira upsert da dupla (`onConflict` nas duas colunas, duplicata ignorada) e o delete filtra pelas duas colunas; ao ler, cada ligação ganha o id composto. Assunto nunca envia `normalized_name`.
  - Banco fictício (`tools/harness.mjs`): imita o banco. Apagar material apaga as ligações (cascata), e assunto com ligação não pode ser apagado (restrict).
  - Lógica pura em `src/domain/topic-edit.js`: diferença de ligações, slug livre (`-2`, `-3`… contra slugs atuais, antigos e os reservados `casos`/`todos`/`tipos`), ordem = máximo + 1, nome igual devolve o assunto existente e texto antigo `subject` = primeiro assunto ligado.
  - Escritas em `src/core/topic-store.js`; ações com aviso em `src/core/topic-actions.js` (`createTopic`, `setMaterialTopics`).
  - Remover material guarda as ligações, e o "Desfazer" devolve o material **e** as ligações.
- **Teste corrigido:** `tools/topics.mjs` passa a ignorar falha de rede das fontes do Google, como `check` e `flows` já faziam (na nuvem, o proxy recusa o certificado).
- **Testado (dados fictícios):** `npm test` 49/49 (diferença de ligações, slug com colisão, chave composta e Supabase com cliente falso: upsert da dupla, delete pelas duas colunas, sem `normalized_name`, colunas dos rascunhos; banco fictício: cascata, restrict, restaurar ligações); `check` 0 erros e 0 avisos; `flows` 364/364; `acervos` 67/67; `topics` 57/57; `topic-edit` 5/5 (remover material com dois assuntos e desfazer). Sem a correção, o e2e reprova no Desfazer.
- **Não testado:** Supabase real (nenhum acesso nesta sessão); criar e ligar assuntos pela interface (vem com o formulário, no N2).

## 2026-10-03 — Claude — F1: abas de assunto dentro da matéria — ramo `prototipo-v4`, não publicado

- **O que o aluno vê:** com uma matéria escolhida (ex.: CIS 1 › Anatomia), surge a faixa **Todos · Membro superior · Coluna vertebral · Membro inferior · Casos clínicos**:
  - contagem em cada aba; assunto sem material aparece como "—", em produção;
  - um caso clínico aparece na aba do seu assunto e em "Casos clínicos";
  - cada aba tem endereço próprio (`#a-cis1-anat/membro-superior`), bom para mandar no grupo da turma.
- **Banco (a pedido do dono):** migrações em `supabase/migrations/`, cada uma com o SQL para desfazer:
  - assuntos e ligações material ↔ assunto (muitos-para-muitos);
  - matérias Embriologia e Histologia no CIS 1, com os materiais que estavam em Práticas Médicas;
  - tempo real nas tabelas novas.
  Só acrescentam; a regra de acesso é a mesma de antes.
- **Código:**
  - `src/domain/topics.js` (lógica pura: normalização igual à do banco, contexto com índice material → assuntos, abas, rota);
  - `src/domain/pagination.js` (leitura em páginas de 1000, que só publica o resultado completo; o Supabase cortava em 1000 linhas sem avisar);
  - `src/views/topic-tabs.js` (faixa rolável com a pílula das abas de acervo).
  Sem as tabelas no banco, a tela é a de antes.
- **Revisão independente (code-reviewer):** 1 alto e 4 médios, todos corrigidos e testados:
  - leitura limitada a 1000 linhas;
  - corrida entre assuntos e ligações;
  - aba velha ao clicar no órgão 3D;
  - custo O(n·m) das contagens;
  - foco do teclado perdido ao redesenhar.
- **Testado:**
  - `npm test` 34/34 (paginação com 0/1/999/1000/1001/2500 linhas e falha no meio; desempenho com 1000 materiais × 15 abas < 100 ms);
  - `node topics.mjs` 57/57 (1440/390/320 px, claro e escuro, endereço direto, slug antigo, aba inexistente, busca + aba, teclado, WCAG, muitas abas, banco sem assuntos);
  - `npm run check` 0/0; `node flows.mjs` 364/364.
- **Instabilidade antiga, sem relação com esta mudança:** em `node acervos.mjs`, "trocas rápidas preservam último acervo e título" falha de vez em quando. Medido: 2 de 4 execuções na versão anterior às abas e 1 de 3 na atual. Fica para um pacote próprio.

## 2026-10-03 — Claude — F0 · P0.1 a P0.4: backup, chão limpo e gates de medição — ramo `prototipo-v4`, não publicado

- **P0.4 · Revisão independente (`code-reviewer`, só leitura):** nenhum achado crítico ou alto. A revisão confirmou por script que as 112 trocas de CSS são exatamente equivalentes. Corrigidos:
  - detector de codificação não pegava maiúsculas corrompidas pelo cp1252 do Windows ("AÇÃO" corrompido); agora pega, com teste. Limites conhecidos documentados no arquivo: ternário sem espaços é acusado, e "?" no fim da palavra escapa;
  - Lighthouse: `--no-sandbox` só no CI e espera ativa pela porta do Chrome (até 20 s) no lugar da pausa fixa;
  - orçamento: o gate "3D no grafo estático" passa a reconhecer também os chunks `glb-` e `dist-`;
  - `medir-v5`: fps 0 em vez de `NaN` quando não há quadros.
  **Pendente, de propósito (publicação é decisão do dono):** o `pages.yml` (push na `main`) ainda roda só o `check`. Os novos gates entram lá, ou a `main` passa a exigir PR, na próxima atualização da `main`. O comentário do `check.yml` foi corrigido para não dizer o contrário.
- **Testado:** `npm test` 16/16; `npm run check` 0 erros e 0 avisos; Lighthouse com `CI=1` aprovado (IDOMED 94/98).

- **Contexto:** plano em 4 rodadas Claude ↔ Astra (`_fora-do-site/rodadas/`, fonte: `r4-claude-especificacao-final.md`). O Astra parou no limite antes de começar a F0; o Claude executou. O Pacote 0 do Codex estava pela metade e sem commit, com acentos corrompidos em texto visível.
- **P0.1 · Backup** em `OneDrive\Aorta-backups\20261003-1403\`: `git bundle --all`, patch da árvore suja, não rastreados, ignorados (`_fora-do-site/`, `.arena/`, `.impeccable/`, `reports/`) e `MANIFEST.sha256`. Restauração testada numa pasta separada: 256 arquivos conferidos, 255 idênticos byte a byte e 1 (`tokens.css`) igual salvo fim de linha.
- **P0.2 · Árvore resolvida, item a item (tabela do r3):**
  - CSS: mantidas só as 112 trocas de medida por token **equivalentes** (o valor do token é exatamente o número substituído, conferido por script); descartados a reserva de altura do `.map-caption`, os slots de carregamento e o alinhamento novo do herói (`home.css`) e os ajustes tipográficos (`base.css`). Ficam para a F4.
  - `index.html`: alterações do Codex descartadas (texto inicial e script de apresentação, com acentos corrompidos).
  - `src/ui/tokens.js`: a leitura antes do CSS carregar travava `NaN` no cache; agora há padrões e só uma leitura completa é guardada. Curva da entrada do título de volta a `power3.out` (como no v4).
  - `DESIGN.md`: seção "Fundamentos v5" reescrita em UTF-8, descrevendo só o que ficou.
  - `.gitignore`: `/reports/`, `/.arena/`, `/.impeccable/mocks/` e `/.impeccable/questions/` (estão no backup).
- **Novo no `check`:** etapa "codificação" (`tools/encoding.mjs`) falha com acento trocado por `?` entre letras, UTF-8 lido como Latin-1 ("Ã" colado a outro símbolo) ou U+FFFD; `?` de URL e de código passa.
- **Testes de unidade (novos, `node --test tools/tests/`):** `tokens` (4) e `encoding` (8), escritos antes da implementação; 12/12.
- **Testado (dados fictícios):** `npm run check` 0 erros e 0 avisos (61 arquivos na etapa de codificação); `node flows.mjs` 364/364; `node acervos.mjs` 67/67.
- **P0.3 · Medições confiáveis e gates no CI:**
  - `tools/gates.mjs` (novo) concentra limites e cálculos: CLS por janela de sessão, p95, mediana, limites do Lighthouse (celular ≥85 e computador ≥90 de desempenho; acessibilidade e boas práticas 100; SEO fora por causa do `noindex`), pasta `tools/reports/v5` fixa e proteção do baseline.
  - `lighthouse.mjs`: roda os dois acervos (`#idomed`, `#geral`) sempre com os dados fictícios do v4, nota pela **mediana de 3 execuções** (`LH_RUNS`) e **sai com erro abaixo do limite**; relatórios `lighthouse-<acervo>-<modo>.json`. Saem `LH_V4` e `LH_QUERY`.
  - `medir-v5.mjs`: relatórios em `tools/reports/v5` de qualquer pasta; `--fase=nome`; p95 do tempo de quadro além da média de fps; o `baseline-v5.json` só nasce com `--antes --gravar-baseline` e nunca é sobrescrito.
  - `orcamento.mjs`: CLS acima de 0,03 vira aviso (meta da F4; reprova só com `ORCAMENTO_ESTRITO=1`); JS inicial, 3D precoce e rolagem lateral continuam reprovando.
  - `bundle-v5.mjs`: segue também `modulepreload` e `import "x"` sem `from`, e aceita a pasta do build como parâmetro.
  - `seed-abundante.mjs`: quantidade parametrizável.
  - `tools/package.json`: `npm test`, `flows`, `acervos` e `orcamento`. `.github/workflows/check.yml` passa a rodar testes de unidade, check, fluxos, acervos e Lighthouse. O `pages.yml` não foi alterado.
  - `baseline-v5.json` versionado como estava (evidência do "antes").
- **Testado:** `npm test` 15/15 (o teste da mediana falhou antes da implementação). Orçamento sem reprovação: JS inicial +295 B sobre o baseline, nenhum 3D precoce, nenhuma rolagem lateral; 20 avisos de CLS entre 0,034 e 0,306 (o pior é o acervo abundante a 320 px no geral). `medir-v5 --fase=f0` na mesma faixa do baseline (IDOMED: entrada com maior tarefa de 591 ms e p95 de quadro de 48,6 ms; geral: CLS 0,0646). `--antes` sem pedido é recusado. Lighthouse aprovado: IDOMED 93/98, geral 86/98 (celular/computador); acessibilidade e boas práticas 100.
- **Risco aberto (F4):** o desempenho do geral no celular oscila muito (execuções 93/86/73 e 82/89/91; LCP de 2,3 a 3,8 s). A mediana passa raspando os 85, e o CI pode reprovar de vez em quando até a F4 resolver o LCP.

## 2026-10-03 — Claude — Integração do relatório do Codex (coração no IDOMED, corpo na Medicina geral) — ramo `prototipo-v4`, não publicado

- **Origem:** o Codex entregou a rodada sem commit e sem validação completa (o próprio relatório dizia: falha em `acervos.mjs`, Lighthouse não rodado). Conferi o relatório contra `git status`/`git diff`: 21 arquivos modificados e 2 novos, exatamente como descrito; nada fora do relatado. `.arena/` e `.impeccable/` ficaram de fora do commit.
- **Falha que o Codex deixou aberta, resolvida:** "Reduzir durante entrada deixa conteúdo visível" (`tools/acervos.mjs`). Causa em duas camadas, ambas reproduzidas rodando:
  1. O cancelamento da entrada usava seletores e não pegava a animação em andamento. Agora a entrada da home é uma linha do tempo guardada e cancelada por referência (`settleEntrance` em `src/views/home.js`).
  2. O navegador entrega o evento de "reduzir movimento" **depois** de a preferência valer (no teste, com o 3D por software ocupando a thread, até centenas de ms), e `transition: all` ainda segurava a opacidade por um quadro. Regra nova no fim de `src/styles/proto.css`: sob `prefers-reduced-motion: reduce` o conteúdo de entrada fica visível e sem transição **no mesmo instante, só com CSS**.
  O teste esperava 60 ms fixos pela remoção do 3D e do cursor (que depende do evento); agora espera a condição por até 3 s.
- **Fragilidade corrigida:** uma execução isolada falhou em "trocas rápidas preservam último acervo e título" (título com o texto do outro acervo) e não repetiu em 6 execuções seguintes (isolado e suíte). Reforço em `renderCopy`: confere o texto real do DOM, não só o cache `copyFor`.
- **Revisão independente (`code-reviewer`, só leitura):** nenhum achado crítico ou alto; sem regressão em rotas, troca de acervo, busca, ficha, favoritos e filtros. Médios corrigidos:
  - o hover interrompia a entrada e deixava rótulos e cartões semitransparentes (`killTweensOf` agora só nas propriedades do hover);
  - o fim da entrada apagava a inclinação do cartão (o transform só é limpo se o cartão não está sob o mouse).
  Baixo corrigido: divisão por zero em `indicator.js`.
  **Ficaram, por escolha:** código morto do conceito folha (`src/leaf/`, `CONCEPTS.folha`, `.proto-switch` no CSS) — os protótipos continuam em `versoes/`; a regra de movimento reduzido remove `transition` de todo o conteúdo de entrada (mais ampla que o necessário, sem efeito funcional visível); os rótulos do corpo alternam de lado por índice e as linhas-guia podem cruzar o desenho (conferir no navegador); o cabeçalho do módulo anima menos que antes.
- **Testado (dados fictícios; nenhum acesso ao Supabase):** `npm run check` 0 erros e 0 avisos; `node flows.mjs` 364/364; `node acervos.mjs` 67/67 (os dois acervos, 320/375/1440 px, claro e escuro, WCAG, rótulos, 3D, interrupções, pressão do botão, movimento reduzido durante a entrada); Lighthouse com os dados dos dois acervos: **IDOMED (coração)** celular 94 e computador 98; **Medicina geral (corpo)** celular 91 e computador 98; acessibilidade e boas práticas 100 em todos (SEO 60 por causa do `noindex` intencional).
- **Não testado:** iPhone/Safari e aparelho físico, bateria, 4G real, INP de uso real, leitor de tela real, Supabase real, qualidade e sensação das animações (capturas e automação não provam fluidez), Firefox.
- **Licenças dos modelos 3D:** CC BY 4.0 confirmado por busca só para o cérebro v1.3; a pele e o United Male v1.7 precisam ser conferidos objeto por objeto antes de qualquer lançamento público.

## 2026-10-02 — Codex — Coração no IDOMED, corpo na Medicina geral e movimento contínuo — ramo `prototipo-v4`, não publicado

- **Pedido do dono:** manter o coração no IDOMED, corpo no acervo geral por disciplinas e refinar o design/animações com ECC porque pareciam robóticas.
- **Mapas:** conceito acompanha o acervo, inclusive links diretos; parâmetro antigo de conceito não sobrepõe a escolha. Removido seletor flutuante. Corpo ganhou mais largura, disciplinas com nomes completos em duas colunas equilibradas, busca/introdução mais compactas e título “A medicina ganha corpo”. As associações com órgãos são visuais e não limitam o conteúdo das disciplinas.
- **Movimento:** mola amortecida preserva velocidade ao mudar o ponteiro e deixa de pedir frames no repouso. Botões mantêm pressão até soltar/cancelar. Entradas não sobrescrevem transforms de layout dos rótulos; hover não reinicia batida ao atravessar filhos do link. Órgãos entram por opacidade, preservando volume. Mergulho de 650 ms aceita novo destino e cancelamento por Esc/outra navegação; nenhuma promessa antiga pode abrir uma página abandonada.
- **Cérebro e recursos:** corrigido token da disciplina que estava dentro de um comentário, luz de borda limitada para manter cor no tema claro, drag cancelável, carregamentos obsoletos descartados e recursos/tweens liberados ao sair. Ativar movimento reduzido durante entradas, câmera ou seleção encerra os efeitos: o CSS garante o conteúdo visível no mesmo instante e o JavaScript cancela o 3D, o cursor e as animações em seguida (ver a entrada de integração abaixo).
- **Correção de layout:** textos acessíveis de botões das matérias ficam contidos no botão, eliminando rolagem lateral na tela Todos em 375 px.
- **Skills/revisão:** ECC `make-interfaces-feel-better` + `motion-patterns` e `aorta-design`; sem biblioteca nova. Revisor `aorta_design_review` aprovou a revisão estática após corrigir limpeza ao ativar movimento reduzido, tween residual e espera de captura. Não houve revisão humana da sensação do movimento. Referência de layout: evolução do V4 existente, sem referência externa nova.
- **Verificação:** `npm run check`: 24 telas, zero erros/avisos; `node flows.mjs`: 364/364. Matriz adicional `node acervos.mjs` com seed-v4 verifica os dois acervos, 320/375/1440 px, claro/escuro, WCAG, rótulos, 3D, interrupções, press e mudança dinâmica de movimento reduzido. Relatórios/capturas em `tools/reports/refino/`. Lighthouse medido na integração (ver entrada abaixo).
- **Prévia:** `http://127.0.0.1:4177/#idomed` e `/#geral`, com dados fictícios de seed-v4. `tools/demo.mjs` aceita `AORTA_PREVIEW_PORT` para abrir uma instância independente. Nenhuma alteração em catálogo real, RLS, esquema ou publicação.
- **Não verificado:** iPhone/Safari e aparelho físico, bateria, conexão 4G real e INP de uso real, dados/autenticação Supabase, publicação. Lighthouse é medição de laboratório; capturas não demonstram a sensação das animações.

## 2026-10-02 — Claude — Migração para Vite e Aorta v3 no site (coração-mapa, módulo, ficha, tema claro) — não publicado

- **Pedido do dono:** "faça a próxima rodada" depois da rodada de protótipos do Codex. Ele escolheu "Vite + implementar v3", deixou a escolha da base comigo ("oq você achar melhor") e pediu para salvar os protótipos antigos para poder voltar.
- **Backup (commit `81916b6`):** site anterior em `versoes/claude-2026-10-02-antes-vite.html`. Todos os protótipos estão em `versoes/prototipos-2026-10-02/`: coração-mapa, home v2, v3 do Codex, MedLeaf, A, B e B2, além do modelo 3D, do quadro de referências, do plano e do prompt.
- **Arquitetura:**
  - Projeto Vite 8.3.2, com `index.html` completo, `src/` (core, views, heart, styles, ui) e `public/modelos/`.
  - Dependências pelo npm com versão exata: three 0.186.1, gsap 3.15.0 e @supabase/supabase-js 2.117.2. Acabaram os scripts por CDN.
  - O Three e o Supabase só carregam quando usados.
  - Publicação: `pages.yml` passou a rodar `npm run check` antes de montar e publicar o `dist/`. `check.yml` fica para pull requests.
  - Removido `tools/build-pages.mjs`.
- **Telas (a partir da v3, com as correções que eu tinha apontado):**
  - Início com o coração-mapa: rótulos tipográficos nas duas colunas, linhas-guia até a ponta de cada artéria e mapa em linhas (SVG) como base sempre presente.
  - Índice "Módulos do curso", "Sua mesa de estudo" e "Acabou de chegar".
  - Página do módulo: numeral, artéria, resumo real em lugar de slogan, unidades em abas, matérias e folhas.
  - Ficha em folha (celular, com alça de arrastar) e em painel (computador).
  - Busca Ctrl/⌘+K com teclado e sugestões reais quando não há resultado.
  - Tema claro desenhado.
  - Corrigidos dois problemas que eu tinha visto nas capturas da v3: o "vaiestudar" sem espaço e a ficha sem fundo escurecido.
  - Organizar, formulário, login por link, estados de falha e Desfazer foram mantidos.
- **Rotas:** `#a-<id>` de unidade ou matéria abre o módulo com ela já escolhida. As rotas antigas continuam valendo.
- **Desempenho:**
  - O coração só começa depois do `load`, com o navegador ocioso, e as etapas pesadas devolvem a vez ao navegador.
  - O traçado das artérias é pré-calculado (`tools/arterias.mjs` gera `src/heart/arteries.json`). Isso tirou cerca de 1,5 s de bloqueio no celular.
  - "Continuar" fica abaixo do coração no celular, para não haver salto de layout.
  - Lighthouse móvel subiu de 61 para 95.
- **Revisões independentes antes do commit:**
  - **Design (`aorta-design-reviewer`):** "aprovado com ressalvas". Corrigidos:
    - o achado alto: chips de filtro com 36 px, agora 44;
    - a terceira família tipográfica: rótulos voltaram a Schibsted, como manda a skill;
    - os rótulos do celular que recortavam o coração;
    - a queda para o mapa em linhas quando o WebGL é perdido;
    - os filtros recolhidos em "Filtros" no celular;
    - grão estático, esqueleto sem loop, ordem das linhas-guia pela ponta projetada e fonte mínima de 11 px.
  - **Código e segurança:** sem achado crítico ou alto, e sem regressão em gravações, Desfazer, formulário, Organizar, login, estados, rotas e filtros. Corrigidos:
    - endereço malformado que travava a página;
    - excluir módulo em Organizar que levava ao início;
    - foco perdido ao favoritar pelo cartão (agora `renderAll` devolve o foco ao equivalente);
    - deploy que não dependia da verificação;
    - ponta de testes que aceitava qualquer `window.claude` (agora exige `aortaTest`);
    - limpeza do canvas quando o 3D falha;
    - porcentagem do download acima de 100%;
    - busca digitada sobrescrita;
    - código morto.
  - **Ficou de fora:** os ciclos de import (`app`↔`actions`, `module`↔`home`↔`map`). Hoje funcionam e estão anotados para uma rodada de limpeza.
- **Testado (dados fictícios, sem acesso ao Supabase):**
  - `npm run check`: 0 erros e 0 avisos (build, regras, stylelint, html-validate, 24 telas sem rolagem lateral nem erro de console, axe sem violações).
  - `node flows.mjs`: 364/364. Cobre:
    - início, mapa por teclado, módulo, unidade em produção, matérias, filtros (com chips de 44 px), busca;
    - ficha (foco, favorito, situação, Escape, remover e Desfazer), voltar com foco no rótulo, Ctrl+K;
    - sem histórico, carregando, banco fora do ar;
    - 8 módulos com 6 em produção (sem sobreposição e dentro do mapa);
    - tema (persistência, primeira pintura, armazenamento bloqueado);
    - movimento reduzido;
    - 3D por WebGL de software (carga, linhas-guia, pausar), troca rápida de módulo, abrir e fechar a ficha 8 vezes, modelo indisponível;
    - formulário (validação e salvar), Organizar, endereço malformado e foco ao favoritar pelo cartão.
  - `npm run lighthouse`:
    - celular: desempenho 95, acessibilidade 100, boas práticas 100 (LCP 2,1 s, CLS 0,04, TBT 110 ms);
    - computador: desempenho 98, acessibilidade 100, boas práticas 100;
    - SEO 60 por causa do `noindex` intencional.
- **Não testado:**
  - aparelho físico (Safari/iPhone com GPU de verdade, toque na alça da ficha);
  - Firefox;
  - leitor de tela real;
  - o caminho do Supabase (login, `denied`, gravações reais, `rowIn`/`rowOut`);
  - o próprio fluxo do GitHub Actions, que não tem remote;
  - qualidade das animações (capturas mostram estados, não movimento).
- **Acesso aberto continua separado:** favoritos e situação ainda são do catálogo, e o RLS segue só com o dono. Nada disso mudou nesta rodada.

## 2026-10-02 — Claude — Estante visual: capas, lombadas, prateleiras e microinterações — não publicado

- **Pedido do dono:** o site estava "básico"; dos três caminhos propostos escolheu a **estante visual (capas)** e pediu melhorar cores/identidade, tipografia/hierarquia, movimento e estrutura das telas.
- **Capas:** cada material ganha uma capa na cor da matéria, com lombada, ícone e rótulo do tipo, textura por tipo e o período (`cover()`, só CSS e SVG inline; tokens `--shade`, `--gloss`, `--cover-*`). Tipo "Prova" mostra o período em destaque, o que prepara as provas por período.
- **Estrutura:** catálogo em grade de capas (padrão) ou lista com capa, botão Lista/Estante no catálogo com escolha guardada neste aparelho; retomada com capa ao lado do título; seleção em trilho horizontal de capas; "Por onde começar" com capas por tipo e uma prateleira de lombadas de módulo (as em produção, tracejadas); ficha com a capa no topo.
- **Movimento:** capa sobe e inclina no hover (ponteiro fino) e afunda ao pressionar; lombada "sai da estante" no hover/toque; estrela salta ao favoritar (260 ms, continua se o item for redesenhado). Tudo respeita `prefers-reduced-motion`.
- **Acessibilidade e revisão:** capas `aria-hidden`; o tipo e "onde fica" continuam no texto para leitor de tela (visualmente ocultos); alvos de 44 px; revisão de código independente sem achados críticos ou altos, cinco médios corrigidos (leitor de tela, texto da lombada, botão Lista/Estante só no catálogo, foco cortado nos trilhos, estrela que recomeçava) e cache dos ícones por tipo.
- **Testado (dados fictícios; nenhum acesso ao Supabase):** `npm.cmd run check` — 0 erros/avisos; `node flows.mjs` — 321/321, incluindo capas em todos os materiais, grade/lista, escolha lembrada após recarregar, nos dois temas, trilho, capa na ficha e na retomada, estrela, lombadas sem sobreposição e o cenário M1–M8; `npm.cmd run lighthouse` — mobile 99/100/100 (LCP 1,5 s, CLS 0,018, TBT 110 ms) e desktop 99/100/100 (LCP 0,9 s, CLS 0,018), SEO 54 (`noindex` intencional medido no servidor local); antes desta rodada o mobile era 100. Capturas em `tools/reports/flows/` (`estante@`, `lista@`, `em-producao-inicio@`).
- **Não testado:** aparelho físico (rolagem horizontal das lombadas e do trilho no toque), Safari/Firefox, leitor de tela real, teclado virtual, milhares de materiais (cache de ícones feito, desempenho de pintura das capas não medido), Supabase real.
- **Ponto de retorno:** `79d581f`.

## 2026-10-01 — Claude — Entrada do recém-chegado, módulos "Em produção" e edição separada da leitura — não publicado

- **Pedido:** completar a rodada pós-arena com o que o dono decidiu depois que o Codex começou (acervo aberto a estudantes de medicina, módulos M1 a M8 criados desde já, módulos vazios sinalizados). O Codex já tinha entregue tema, "dono", marcador editorial, toque e cabeçalho dos testes (commits `9fd1992` e `3bc266d`); aqui entra só o restante.
- **Entrada do recém-chegado:** sem histórico, o início mostra "Por onde começar": portas por tipo (Provas antigas, Monitoria, Resumos, Casos clínicos) e por módulo com material, tudo calculado dos dados; porta sem material fica tracejada e diz "Em produção". Com histórico, só a retomada, como antes. O disclosure "Em estudo, favoritos e recentes" agora fica sempre fechado.
- **Tipo "Monitoria":** acrescentado a `TYPES` (o tipo é texto livre no banco; sem mudança de esquema). "Prova", "Resumo" e "Caso clínico" já existiam.
- **"Em produção":** `areasWithContent()` deduz dos dados (sem coluna nova nem lista de módulos no código). Marca no livro, no Explorar, nas portas e na cabeça corrente; módulos com conteúdo vêm primeiro; módulo vazio sem unidades mostra um aviso curto com atalho para o primeiro módulo com conteúdo; unidade vazia diz "Em produção". Some sozinho no primeiro material. Sem barra de progresso, porcentagem ou data. Matéria vazia dentro de uma unidade não aparece no livro nem no Explorar (só em Organizar), como antes.
- **Leitura × edição:** `data-edit` marca "Adicionar link" e "Organizar" (cabeçalho e barra do celular), "Editar" e "Remover do catálogo" na ficha, e os botões "Adicionar material" dos estados vazios (`index.html` linhas 645, 741–742, 1027, 1202, 1642, 1644 nesta data). "Adicionar link" deixou de ser o botão primário. Nada é escondido nem condicionado a login; a regra de ocultação está só descrita em comentário no CSS.
- **Testado (dados fictícios; nenhum acesso ao Supabase):** `npm.cmd run check` — 0 erros/avisos; `node flows.mjs` — 286/286, incluindo o cenário M1 a M8 (só M1 e M2 com material) em 375 e 1440 px, claro e escuro: portas, marcas, ordem, aviso, cabeça corrente, Explorar, alvos de 44 px, axe, sem rolagem lateral, marca que some ao entrar o primeiro material e marcadores `data-edit`; `npm.cmd run lighthouse` — mobile 100/100/100 e desktop 99/100/100 (a medição anterior, no mesmo código, deu 100 no desktop: oscilação de medição, LCP 0,8 s), SEO 54 em ambos (`noindex` intencional medido no servidor local). Revisão de código independente (sem achados críticos ou altos); dois pontos médios corrigidos: cabeça corrente de módulo em produção no fim do livro (com teste do M8) e a dedução de "Em produção" por mapa de áreas, para não pesar com milhares de materiais. Capturas em `tools/reports/flows/em-producao-*`.
- **Não testado:** aparelho físico, Safari/Firefox, leitor de tela real, teclado virtual, login e gravações no Supabase real, publicação, módulos reais sem material (o cenário M1–M8 é só na memória do teste).
- **Preparação para as próximas rodadas:**
  - *Estado de cada pessoa hoje (vive no catálogo, em `materials`: `favorite`, `status`, `statusAt`, `lastOpenedAt`):* gravado por `toggleFav` (1500), `setStatus` (1501) e `markOpened` (1502) via `updateMaterial` (1489) e pelo formulário (`#m-fav`, 827/1659/1680); lido em `renderHome` (retomada e abas, 1092–1096), `entry` (estrela, 1019), filtros (`S.f.fav`, 973/1134/1312/1758), ficha (1613, 1618, 1624) e mapeamento de colunas (1786).
  - *Ações de edição:* as marcadas acima. Esconder de quem não edita é uma regra (`body:not([data-can-edit]) [data-edit]{display:none}`) mais definir o atributo para editores.
  - *Dados que faltam:* "Prova" já existe e "Monitoria" foi acrescentada; provas por período usam o campo `period` (texto livre); ligar gabarito à prova, "reportar link quebrado" e fila de sugestões exigem campos/tabelas novos.
  - *A decidir na próxima rodada:* leitura pública e regras de acesso; login opcional (link por e-mail, já existente); tabela por pessoa para favoritos/abertos; lista de editores no banco no lugar de e-mails fixos; sugestão de material com login e curadoria; texto da meta description ("Biblioteca pessoal…") e do login, que deixam de ser verdadeiros quando o acesso abrir.
- **Skills:** nenhuma aberta nesta etapa; decisões a partir do código e das capturas. Ponto de retorno: `3bc266d`.

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
