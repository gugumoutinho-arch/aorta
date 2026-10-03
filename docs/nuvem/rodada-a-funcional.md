Você é o Claude (Opus) rodando na nuvem no projeto **Aorta**: um acervo aberto de links de estudo de medicina, feito por um estudante de medicina (o dono, homem; trate-o como "o dono"). É um site estático em Vite + JS puro (GSAP, Three.js, Supabase), publicado no GitHub Pages.

Esta é a **RODADA A** (funcional). Trabalhe sozinho, pacote por pacote, até acabar ou até o orçamento apertar. Escreva tudo em português do Brasil.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
0) ONDE VOCÊ ESTÁ
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- **Caminho da pasta:** nesta sessão, o checkout Linux do repositório substitui exclusivamente o caminho Windows citado no AGENTS.md (`C:\claude e codexx`). Não pare por causa dele.
- **Antes de tudo, confira e registre:**
  - `git rev-parse --show-toplevel`;
  - o remote;
  - o ramo;
  - o status limpo.
- **Ramo:**
  - parta do SHA de `origin/prototipo-v4` conferido depois do `git fetch` (esperado: `afef4f6` ou posterior) e crie `nuvem/f1-conteudo`;
  - se esse ramo já existir no remoto, valide que ele descende de `prototipo-v4` e RETOME por `docs/nuvem-progresso.md` (sem recriar e sem force);
  - registre o SHA base no progresso.
- **Regras do projeto:** leia AGENTS.md, DESIGN.md (Telas › Módulo › Abas de assunto) e o topo de CHANGES.md (as 4 entradas mais recentes). Use `rg`; não releia o repositório inteiro.
- **Modelo de dados (Supabase; você NÃO tem acesso ao banco):**
  - `areas` (árvore acervo/módulo › unidade › matéria: id, name, parent_id, sort_order, stain, short);
  - `materials` (id, title, url, area_id, subject [texto antigo, mantido], type, tags[], collection_ids[], source, notes, status, favorite…);
  - `collections`;
  - `topics` (id, area_id = matéria, name, normalized_name [GERADO pelo banco, NUNCA envie], slug [^[a-z0-9]+(-[a-z0-9]+)*$; proibidos casos/todos/tipos], slug_aliases[], sort_order, body_region, created_at; únicos por (area_id, normalized_name) e (area_id, slug));
  - `material_topics` (material_id, topic_id; chave = a dupla; SEM coluna id; apagar material apaga as ligações em cascata);
  - `material_drafts` (id, url [https], path, type, title, source, year [''|AAAA], rights [proprio|autorizado|licenca-aberta|publico|pendente], area_id, topic_ids[], drive_file_id, status [rascunho|ignorado|publicado], material_id, problems[], created_at, updated_at; único drive_file_id enquanto não ignorado).
  - O SQL aplicado está em `supabase/migrations/`; as reversões, em `supabase/rollback/`.
- **Duas pontas de banco com a mesma interface** (`src/core/db.js`): o Supabase (site real) e `window.claude.use("db")` (banco fictício dos testes; `mockDbScript` em `tools/harness.mjs`). Hoje elas NÃO são equivalentes para ligações e rascunhos:
  - `db.js` lê e grava `id` de forma genérica;
  - `material_drafts` não está em COLS;
  - o mock não carrega rascunhos, não simula cascata nem unicidade e recria o armazenamento a cada recarga.
  O N1 resolve isso.
- **Lógica pura** fica em `src/domain/`, com testes `node:test` em `tools/tests/`. Siga o padrão.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1) REGRAS INEGOCIÁVEIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- **Banco:**
  - nenhum acesso ao Supabase real: sem CLI link/push/reset, sem chave nova, sem mexer em RLS;
  - os testes BLOQUEIAM e registram qualquer tentativa de rede para `*.supabase.co`;
  - pode escrever PROPOSTA de SQL aditivo em `supabase/migrations/`, sem aplicar, com a reversão em `supabase/rollback/`; a reversão preserva dados criados depois ou exige exportação verificável antes;
  - nunca edite migrações já existentes;
  - um pacote que dependa de SQL não aprovado termina como "preparado, não integrado ao banco".
- **Publicação:**
  - não toque na `main`, não faça merge e não mexa em `.github/workflows/pages.yml`;
  - push só do SEU ramo;
  - o repositório é PÚBLICO: nada de segredo, e-mail, dado real de aluno, URL real do Drive do dono ou PDF;
  - não use cookies, login nem dados reais.
- **Dependências:** nenhuma nova. Use `node:test`, `playwright-core` e axe, que já existem.
- **Conteúdo:**
  - o site guarda LINKS;
  - "Livro" aponta para editora, biblioteca ou edição aberta, nunca para PDF;
  - nada de "oficial da IDOMED";
  - nenhum número de eficácia sem fonte.
- **"Publicar rascunho"** significa adicionar ao catálogo, NUNCA publicar o site.
- **Identidade:**
  - preserve tokens, fontes (Literata e Schibsted Grotesk; rótulos pelo token `--label`) e as duas metáforas (coração no IDOMED, corpo na Medicina geral);
  - nenhum hexadecimal fora de `tokens.css`;
  - movimento interrompível e com alternativa reduzida.
- **Código:**
  - arquivos < 400 linhas quando der; funções pequenas;
  - sem console.log; erros tratados;
  - dados imutáveis; comentários em português no tom dos existentes;
  - UTF-8 (o `check` reprova acento corrompido).
- **Testes:** nunca afrouxe uma verificação para passar.
- **Evidência:** todo "passou" leva a saída do comando. Distinga corrigido, medido, não verificado e pendente.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2) AMBIENTE E PREFLIGHT (Linux)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
git fetch origin && git checkout -b nuvem/f1-conteudo origin/prototipo-v4    # ou retome o existente
npm ci --ignore-scripts --no-audit --no-fund
cd tools && npm ci --ignore-scripts --no-audit --no-fund
npx --no-install playwright-core install --with-deps chromium
export CHROME_PATH="$(node -e 'process.stdout.write(require("playwright-core").chromium.executablePath())')"
test -x "$CHROME_PATH" && export CI=1
npm test && npm run check

- **Se a instalação falhar:** diagnostique rede, permissão e bibliotecas antes de tentar sem `--with-deps`. Remover `--with-deps` não instala bibliotecas que faltam.
- **Limite de tentativas:** no máximo DUAS por erro de ambiente; depois registre o bloqueio específico. Não "compense" ambiente mudando o produto.
- **Preflight, registrado no progresso:**
  - versão do Node;
  - Chromium abre;
  - WebGL/SwiftShader funciona (`npm run acervos` sobe o 3D);
  - captura PNG funciona;
  - fontes carregam (`document.fonts.check`; se o Google Fonts não carregar, marque capturas e Lighthouse como não comparáveis, sem trocar tipografia nem reduzir gates);
  - uma auditoria Lighthouse.
- **`CI=1`** já liga `--no-sandbox` só no Lighthouse; não espalhe esse argumento pelo produto.

**Custo:** o Lighthouse faz 3 execuções × 2 acervos × 2 modos = 12 auditorias. NÃO rode a bateria completa a cada pacote.
- **Por pacote:** `npm test` mais os e2e afetados (flows/topics/import).
- **Bateria completa G** (`npm test`, `check`, `flows`, `acervos`, `topics`, `import`, `lighthouse`): só no preflight, depois do N4 e na entrega.
- **Problema sem avanço mensurável em 2 iterações:** registre como pendência e siga.
- **Reserve o último bloco da sessão** para bateria, relatório e push. Antes de compactar o contexto, registre um checkpoint no progresso.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3) CONTRATO DE EXECUÇÃO (todo pacote)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Testes ANTES: unidade para lógica pura e e2e para tela. Veja falhar.
2. Implemente, refine e rode os testes do pacote.
3. Revisão crítica do próprio diff (bugs, corridas, gravação parcial, acessibilidade, 320/390 px, movimento reduzido, XSS: texto do banco só via `h()`/textContent).
4. Commit próprio (`feat:`/`fix:`/`test:`), em português, mais uma entrada curta no topo do CHANGES.md (o que mudou, testado com números, não testado).
5. Atualize `docs/nuvem-progresso.md` (SHA base, pacote, commit, comandos e resultados, pendências) e commite.
6. `git push -u origin nuvem/f1-conteudo` ao fim de CADA pacote.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
4) PACOTES — ORDEM: preflight → N6 → N1 → N3 → N2 → N4 → N5
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**N6 · Teste instável "trocas rápidas preservam último acervo e título"** (`tools/acervos.mjs`)
- **Diagnóstico:**
  - extraia uma reprodução fiel e mínima desse cenário (o mesmo gesto, o mesmo resultado esperado) e rode 10 vezes ANTES para medir a taxa;
  - ache a causa raiz: bug do produto (troca rápida deixa o título do outro acervo; ver `renderCopy` em `src/views/home.js`) ou corrida do teste. Não basta aumentar esperas.
- **Correção:** se for o produto, corrija o produto; se for o teste, espere a CONDIÇÃO certa.
- **Aceite:**
  - 10/10 DEPOIS na reprodução, mais `npm run acervos` completo verde;
  - nenhuma exceção permanece na entrega.

**N1 · Gravar assuntos, ligações e rascunhos nas duas pontas** (base de tudo)
- **Ligações e rascunhos no adaptador:**
  - `material_topics` usa um ID composto que existe SÓ no adaptador e no mock: codifique cada parte sem ambiguidade (teste IDs contendo o separador);
  - o snapshot devolve esse ID composto; o SQL nunca recebe `id` para ligações;
  - escrita = upsert de `{material_id, topic_id}` com conflito na dupla; remoção = delete filtrando as DUAS colunas; update é suportado ou explicitamente rejeitado;
  - acrescente `material_drafts` em COLS, com mapeamento, carga, assinatura e erros;
  - `normalized_name` nunca é escrito.
- **Testes do adaptador Supabase:** use um cliente espião, sem rede, conferindo payload e filtros.
- **Mock:**
  - simula unicidade, cascata, falha em cada etapa e persistência entre recargas, isolada por contexto do navegador;
  - não pode mascarar divergência de esquema.
- **Ações** (`src/core/topic-actions.js` se `actions.js` crescer):
  - `setMaterialTopics(materialId, areaId, topicIds)` altera SÓ os vínculos daquela matéria e preserva os de outras (ex.: Ortopedia);
  - `createTopic(areaId, name)` tem slug = `topicSlug(name)` com sufixo `-2`, `-3`… se vazio, proibido ou colidido; `sort_order` = máximo + 1; aliases preservados; criação concorrente testada; a unicidade é CONFIRMADA no retorno, nunca presumida pela tela.
- **Texto legado:** `materials.subject` = nome do primeiro assunto da matéria principal (`area_id`), ordenado por sort_order e depois id; vazio se não houver.
- **Remoção de material:** guarde o material e os vínculos. O Desfazer só confirma sucesso quando os DOIS voltam.
- **Se algo exigir atomicidade real** (RPC/transação): entregue o SQL proposto (regra do item 1) e marque como dependência; não declare transação feita pelo cliente.
- **Aceite:** unidade (diferença de vínculos por matéria, slug e colisão, ID composto) e e2e no mock (criar assunto, ligar, desligar, remover e desfazer com as ligações de volta, recarregar e manter).

**N3 · Detector de quase-duplicatas** (`src/domain/similar.js`; antes do N2)
- **Comparação:** só dentro da mesma matéria.
- **Unicidade e semelhança:** a unicidade usa a MESMA normalização de `topicNorm`; a normalização aproximada serve só para SUGERIR. Não mude a regra SQL em silêncio.
- **Vetos, aplicados antes da distância:**
  - números e ordinais diferentes ("1ª semana" × "2ª semana");
  - direções anatômicas opostas (superior/inferior, medial/lateral, direito/esquerdo, anterior/posterior, proximal/distal, cranial/caudal).
- **Vocabulário explícito** para plural e abreviações ("membro sup." → "membro superior", "mmss", "mmii").
- **Parecido quando:** Levenshtein ≤ max(1, 12% do maior) OU Jaccard de palavras ≥ 0,8. Nunca une sozinho.
- **Testes:**
  - "Membro sup." ~ "Membro superior";
  - "Membro superior" ≁ "Membro inferior";
  - "Gametogênese" ~ "Gametogenese";
  - "1ª semana" ≁ "2ª semana";
  - Unicode composto e decomposto.

**N2 · Formulário de material com assuntos**
- **No formulário** (`src/views/form.js`), depois da matéria: assuntos dela em fichas de múltipla escolha, mais "Novo assunto", que cria e já marca, com o aviso do N3 ("Já existe 'Membro superior'. Usar esse?").
- **Na abertura:** a partir de uma aba de assunto, o formulário já vem com a matéria e o assunto.
- **Aceite:** e2e a 1440 e 390 px, teclado completo, WCAG sem violações, sem rolagem lateral.

**N4 · Importação por colagem** (Organizar › "Colar links")
- **Lógica pura** `src/domain/import.js`. Uma linha por item, em dois formatos:
  - (a) só a URL `https://…`;
  - (b) TSV com cabeçalho `url<TAB>caminho<TAB>tipo<TAB>titulo<TAB>fonte<TAB>ano<TAB>direitos`.
- **Regras do lote:**
  - máximo de 100 linhas;
  - extrai o ID do Drive só com host EXATO (`drive.google.com`/`docs.google.com`, formas `/file/d/<id>/`, `open?id=`, `uc?id=`);
  - rejeita credenciais na URL e não-https;
  - preserva `resourcekey`;
  - pasta do Drive é rejeitada ("cole os links dos arquivos");
  - duplicata (mesmo ID do Drive em material ou rascunho, ou a mesma URL normalizada) é marcada, nunca criada;
  - campo vazio vira pendência, nunca valor inventado.
- **Caminho:**
  - resolve acervo → módulo → unidade → matéria → assunto segmento a segmento, sempre LIMITADO AO PAI (nomes iguais em módulos diferentes não são o mesmo destino);
  - zero ou várias correspondências exigem escolha explícita, mostrando o destino completo;
  - nada é criado sozinho.
  - Exemplo: "Micro e Imuno" fica em M2 › BBIO 2.
- **Direitos:** padrão "publico" para material do dono (decisão dele), com opção de mudar. Isso NÃO certifica direitos de terceiros: a revisão continua obrigatória.
- **Livro:** "Livro" com link do Drive gera aviso e não pode ser publicado.
- **Interface** `src/views/import.js`: colar → prévia linha a linha com erro e aviso diferenciados por ícone e texto → escolher por linha criar, ignorar ou ligar a existente → salvar em `material_drafts` → lista de rascunhos editável (título, tipo, matéria, assuntos; reusa N2/N3) → "Publicar".
- **Publicar (idempotente):**
  - o material_id é determinístico a partir do rascunho, ou reservado de forma atômica; dois clientes chegam ao MESMO material_id;
  - persista antes de criar e reutilize no retry;
  - confira o estado depois de resposta incerta; não sobrescreva material existente ao retomar;
  - marque `publicado` só depois de TODAS as ligações.
- **Aceite:**
  - testes do parser (URL, TSV, pasta, 101 linhas, duplicata, resourcekey, host falso, credenciais, XSS no título);
  - e2e `tools/import.mjs`: colar 5 linhas mistas → prévia → salvar → recarregar mantém → publicar 2 → aparecem nas abas certas → falha simulada depois de cada escrita, clique duplo, dois clientes e retry → nada duplicado;
  - registre `npm run import` no package.json e no check.yml.

**N5 · Cardiologia aponta para o coração no corpo**
- **Hoje:** `src/body/routes.js` manda `/cardio/` para "pulmao". O `corpo.glb` tem a chave `heart`, mas `src/body/body.js` desenha o coração separado dos órgãos.
- **Correção:** crie o destino "coracao" ligando NÃO só a string, mas também o destaque, o rótulo e o mergulho até o coração.
- **Aceite:** unidade de `destinationsFor` (cardio → coracao; mesma lista em outra ordem → mesmos destinos; desconhecido → destino livre) e `npm run acervos` verde, com captura do destaque.

(O antigo N7, desempenho do `map.js`, passou para a rodada B, U3.)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
5) QUANDO PARAR E REGISTRAR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Registre e siga para o próximo pacote independente quando algo exigir:
- aplicar SQL ou mudar regras de acesso;
- dependência nova;
- publicação;
- decisão de conteúdo real;
- quando houver contradição entre estas instruções e o código.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
6) ENTREGA FINAL (obrigatória, mesmo se parar no meio)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- O ramo `nuvem/f1-conteudo` enviado, com o SHA FINAL registrado em `docs/nuvem-progresso.md` e a linha "RODADA A ENCERRADA em <data>, SHA <sha>". A rodada B só começa desse SHA.
- Na última mensagem, um relatório em português simples para o dono (estudante de medicina, não programador):
  - o que ficou pronto e como ver (`cd tools && node demo.mjs --abas` ou o que você acrescentar);
  - as saídas da bateria G;
  - o que não foi feito e por quê;
  - riscos;
  - SQL proposto que precise da autorização dele.
- Na mesma mensagem, a lista técnica dos commits (`git log --oneline <SHA base>..HEAD`).
