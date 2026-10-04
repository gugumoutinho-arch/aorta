Você é o Claude (Opus) rodando na nuvem no projeto **Aorta**: um acervo aberto de links de estudo de medicina, feito por um estudante de medicina (o dono, homem; trate-o como "o dono"). É um site estático em Vite + JS puro com GSAP 3.15 (SplitText, Flip, ScrollTrigger), Three.js e Supabase.

Esta é a **RODADA B**, SÓ de interface e movimento: **redesenhar o site na DIREÇÃO D aprovada pelo dono** (item 1b) e lapidar cada tela até ficar impecável, no nível de Linear, Vercel, Stripe e Apple, sem perder a identidade. Não é retoque: a página inicial e a do módulo mudam de layout. Trabalhe sozinho, pacote por pacote. Escreva tudo em português do Brasil.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
0) PONTO DE PARTIDA (sem alternativa)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- **Caminho da pasta:** o checkout Linux substitui exclusivamente o caminho Windows citado no AGENTS.md (`C:\claude e codexx`). Não pare por causa dele.
- **Antes de tudo, confira e registre:**
  - `git rev-parse --show-toplevel`;
  - o remote;
  - o ramo;
  - o status limpo.
- **Rodada A:**
  - comece EXCLUSIVAMENTE do TOPO de `origin/nuvem/f1-conteudo`. O arquivo `docs/nuvem-progresso.md` desse ramo precisa ter a linha "RODADA A ENCERRADA … SHA <sha>" (a última dessas linhas vale), e esse SHA precisa ser ANCESTRAL do topo (`git merge-base --is-ancestor <sha> origin/nuvem/f1-conteudo`). Os commits depois dele só podem ser de documentação (confira com `git diff --stat <sha>..origin/nuvem/f1-conteudo`);
  - se a linha não existir, o SHA não for ancestral ou houver código depois dele, PARE e avise o dono. Não há alternativa de partir de outro ramo.
- **Ramo da rodada B:**
  - crie `nuvem/ui-lapidacao` a partir do topo de `origin/nuvem/f1-conteudo`;
  - se ele já existir, valide que descende do SHA da A e RETOME por `docs/ui-progresso.md` (sem recriar, sem force);
  - registre o SHA base.
- **Leia:** AGENTS.md, DESIGN.md (a fonte do sistema visual), `src/styles/tokens.css`, `src/ui/{motion,spring,indicator,tokens}.js`, o topo do CHANGES.md e `docs/nuvem-progresso.md`. Use `rg`; não releia o repositório inteiro.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1) IDENTIDADE (preservar, nunca trocar)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- **Cores:** escuro arroxeado de fundo, violeta como luz, carmim como ação e fluxo, creme no texto; tema claro desenhado. Todas as cores são tokens em `tokens.css`; nenhum hexadecimal novo fora dele (o `check` hoje só AVISA; trate o aviso como erro).
- **Tipografia:** Literata (títulos, numerais) e Schibsted Grotesk (interface e, pelo token `--label`, os rótulos técnicos em caixa alta, como "ART. 01"). Não há terceira fonte.
- **Metáforas:** coração-mapa no IDOMED; corpo com órgãos na Medicina geral. O batimento é o ÚNICO loop permitido.
- **Abas:** abas de acervo com pílula, abas de assunto, unidades com sublinhado.
- **Revisão de design:** antes de commitar interface, use a skill `.claude/skills/aorta-design` e a revisão só de leitura previstas no AGENTS.md.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1b) DIREÇÃO D — APROVADA PELO DONO (o alvo do redesenho)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
**Referência visual exata:** `docs/nuvem/direcao-d/D-Inicio.dc.html`, `D-Modulo.dc.html` e `D-Celular.dc.html`, no ramo `prototipo-v4` (leia com `git show origin/prototipo-v4:docs/nuvem/direcao-d/D-Inicio.dc.html`).

São maquetes estáticas (HTML com estilos inline, dados do catálogo real do dono como exemplo):
- reproduza a COMPOSIÇÃO, a hierarquia, as proporções e os componentes;
- use os tokens de `tokens.css` (as maquetes têm os hexadecimais do tema escuro; nunca copie hexadecimal, mapeie para o token), também no tema claro;
- não copie os dados: o site lê o catálogo;
- o desenho do coração na maquete é um esboço: o site usa o coração 3D real que já existe.

**A ideia, em uma frase:** alma da direção A (editorial), motor da B (ferramenta) e brilho da C (palco), em doses certas. Impressiona nos primeiros 3 segundos e depois sai do caminho.

- **Início — palco:**
  - a primeira dobra é um palco: brilho radial roxo atrás do coração 3D (gradiente de tokens), título grande em Literata à esquerda ("O curso inteiro, *irrigado* por bons materiais." como direção de tom; a microcópia pode ser ajustada), uma linha "feito por estudantes · sem vínculo oficial com a IDOMED" e a BUSCA grande e clara (placa creme, ⌘K) logo abaixo;
  - em volta do coração, os rótulos dos módulos e o "Continuar" flutuam como painéis translúcidos ("vidro").
- **Início — ao rolar, vira editorial:**
  - ÍNDICE numerado das matérias (01 Embriologia · resumo dos assuntos · contagem), em linhas finas, Literata grande, com números (materiais, assuntos, casos) à esquerda;
  - depois, uma PRATELEIRA horizontal "Casos clínicos" com cartões grandes. É o ÚNICO lugar de cartões grandes; o resto é lista.
- **Módulo:**
  - cabeçalho com o numeral gigante ("M1"), artéria e matéria em Literata, resumo, e à direita a PARTE DO CORPO/ÓRGÃO ACESA do assunto ativo (reaproveite a vista de órgão existente; sem geometria correspondente, não invente destaque);
  - faixa de abas de assunto com pílula (já existe; refine);
  - materiais em LISTA EDITORIAL (tipo em rótulo, título em Literata, estrela), sem grade de cartões;
  - no computador (≥ 1200 px), a FICHA abre como painel FIXO à direita da lista, sem cobrir a lista e sem trocar de tela; abaixo disso, continua a folha/painel atual.
- **Celular:**
  - palco compacto (título, busca, coração menor com 1 rótulo, "Continuar");
  - índice em linhas;
  - BARRA INFERIOR de navegação (Início, Mapa, Favoritos, Buscar), com alvos ≥ 44 px, `env(safe-area-inset-bottom)` e item ativo indicado por forma além da cor.
- **Vidro com parcimônia:**
  - `backdrop-filter` só em até 3 elementos sobre o palco, só em telas largas e dentro de `@supports`;
  - no celular e sem suporte, o mesmo painel translúcido sem desfoque (custo zero);
  - nunca vidro em listas ou textos longos.
- **O que NÃO entra da direção C:** palco em todas as telas, cartões grandes para tudo e desfoque generalizado. Prioridade: achar e abrir um material rápido.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2) A RÉGUA DO MOVIMENTO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- **Propósito:** toda animação responde "por quê?" (orientar, dar continuidade espacial, confirmar ação). Sem propósito, sai. É um site de consulta rápida: nada atrasa a tarefa.
- **Tempos** (`--motion-*`):
  - resposta a gesto: 100–240 ms;
  - troca: ~320 ms;
  - entrada: ≤ 720 ms;
  - saída: ~180 ms, sempre mais rápida que a entrada.
- **Curvas:**
  - entrada com desaceleração;
  - nunca ease-in em interface;
  - molas (`src/ui/spring.js`) para o que segue o ponteiro.
- **Interrupção:**
  - todo gesto interrompe IMEDIATAMENTE a animação em curso, que retoma do estado atual sem pulo;
  - limpeza por referência (sem kill global);
  - mudar o movimento reduzido no meio, esconder a aba ou trocar de tela encerra o trabalho pendente.
- **Propriedades:** só transform e opacity (e filter com parcimônia); nada de layout shift por animação. O transform de posicionamento (âncoras do mapa) não é alvo de entrada.
- **Origem:**
  - ficha e popover nascem de onde foram chamados;
  - escala de entrada a partir de ~0,96;
  - cascatas de 30–50 ms, com no máximo ~8 itens.
- **Toque e teclado:**
  - hover só em `@media (hover: hover)`;
  - pressão com escala ~0,97 enquanto o dedo está;
  - teclado nunca espera animação;
  - o foco volta ao acionador ou, se ele sumiu, a uma alternativa lógica.
- **Movimento reduzido:** tudo funciona igual, sem deslocamento nem 3D animado. Mantenha a garantia por CSS no fim de `proto.css`.
- **Medida:**
  - medição do ambiente na nuvem (SwiftShader), que NÃO comprova 60 fps em celular real;
  - registre seed, SHA, navegador, viewport, CPU e rede;
  - 5 sequências equivalentes por medição;
  - p95 do quadro só durante movimento ATIVO (exclua o repouso);
  - registre a pior tarefa e a mediana.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3) REGRAS INEGOCIÁVEIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- **Banco e publicação:**
  - nenhum acesso ao Supabase; os testes bloqueiam e registram rede para `*.supabase.co`;
  - não toque em SQL, `main`, `pages.yml` nem publicação;
  - push só do SEU ramo; não use cookies, login nem dados reais.
- **Escopo:**
  - nenhuma dependência, fonte ou imagem externa nova;
  - texto só como microcópia de interface, em PT-BR claro;
  - nada de "oficial da IDOMED" nem números de eficácia.
- **Testes:**
  - mantenha o que os testes cobrem: rotas, acessibilidade, reduzido, interrupções;
  - nunca afrouxe uma verificação;
  - se uma verificação antiga contrariar a melhoria, troque pela nova verdade, MAIS exigente, e explique.
- **Código:**
  - arquivos < 400 linhas quando der; CSS por componente;
  - sem `!important` novo (exceto a garantia de reduzido);
  - UTF-8.
- **Evidência:** todo "melhorou" vem com captura antes e depois ou com número medido. O relatório distingue corrigido, medido, não verificado e pendente local.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
4) AMBIENTE E PREFLIGHT (Linux)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
git fetch origin && git checkout -b nuvem/ui-lapidacao <SHA final da rodada A>   # ou retome o existente
npm ci --ignore-scripts --no-audit --no-fund
cd tools && npm ci --ignore-scripts --no-audit --no-fund
npx --no-install playwright-core install --with-deps chromium
export CHROME_PATH="$(node -e 'process.stdout.write(require("playwright-core").chromium.executablePath())')"
test -x "$CHROME_PATH" && export CI=1
npm test && npm run check

- **Preflight, registrado em `docs/ui-progresso.md`:**
  - versão do Node;
  - Chromium e WebGL/SwiftShader;
  - captura PNG;
  - vídeo FINALIZADO depois de fechar o contexto (`recordVideo`);
  - fontes carregadas (`document.fonts.check` e requests de fonte);
  - uma auditoria Lighthouse.
- **Sem fontes:** capturas e Lighthouse ficam marcados como não comparáveis (não troque tipografia nem reduza gates).
- **Sem WebGL, fontes ou vídeo comprovados:** faça só o que não depende disso e registre o resto como bloqueado, sem gastar a sessão compensando o ambiente.
- **Limite de tentativas:** no máximo duas por erro de ambiente.
- **Custo:**
  - o Lighthouse faz 12 auditorias por execução: rode na base, depois de mudanças de carregamento ou layout e na entrega;
  - a bateria completa G (`npm test`, `check`, `flows`, `acervos`, `topics`, `import`, `orcamento`, `lighthouse`) roda na base, depois do U3 e na entrega; por pacote, só testes e telas afetados;
  - o `lighthouse.mjs` só guarda o ÚLTIMO JSON de cada combinação: salve cada execução com nome próprio para comparar;
  - duas iterações sem avanço mensurável: registre como pendência e siga;
  - reserve o fim da sessão para bateria, relatório e push; antes de compactar, faça um checkpoint no progresso.
- **Ver o site:** `node demo.mjs --abas` → http://127.0.0.1:4176 (dados fictícios).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
5) MÉTODO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. **U0 produz uma MATRIZ ÚNICA de capturas:** telas × 320/390/768/1440 px × claro/escuro × estados, só com fixtures identificadas (dados fictícios). Cada pacote recaptura SÓ as células afetadas. OLHE as imagens (você lê PNG) e critique contra a régua, mais:
   - hierarquia;
   - ritmo de `--space-*`;
   - grade;
   - medida ≤ 70 caracteres;
   - contraste AA;
   - alvos ≥ 44 px;
   - consistência;
   - estados faltando.
2. Implemente com mudanças pequenas e reversíveis.
3. **Depois:** recaptura e vídeo das interações. Se não ficou claramente melhor, refaça (até 2 voltas) ou reverta. Captura estática não prova movimento: para movimento, use o vídeo e a medida.
4. **Registro, a cada pacote:**
   - commit próprio (`style:`/`feat:`/`fix:`);
   - entrada no CHANGES.md;
   - `docs/ui-progresso.md`;
   - `git push -u origin nuvem/ui-lapidacao`.
5. **Galeria pública** em `docs/ui/`:
   - no máximo 40 PNG e 10 MB no total, pares antes|depois a 390 e 1440 px, mais `docs/ui/index.html` lado a lado;
   - REVISE cada imagem antes do commit: sem e-mail, URL real do Drive, token ou dado de aluno.
6. **Vídeos e logs:**
   - não vão para o git; gere um artefato transferível (zip com índice e checksum) e confira que dá para recuperá-lo antes de encerrar;
   - se não houver como transferir, declare "evidência de movimento não entregue".

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
6) PACOTES, NESTA ORDEM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**U0 · Auditoria completa (sem mudar código)**
- **Telas e estados a cobrir:**
  - início (IDOMED e geral), mapa (coração e corpo), mergulho;
  - módulo, unidades, matérias, abas de assunto, filtros e chips, grupos, cartões;
  - ficha (painel e folha);
  - busca Ctrl/⌘+K;
  - organizar, formulário, colagem;
  - login e banner;
  - vazio ("Em produção"), carregando, erro com nova tentativa, sem WebGL, movimento reduzido;
  - avisos com Desfazer;
  - nomes longos, 12 assuntos, zoom 200%.
- **Entrega:** `docs/ui-auditoria.md`, com problemas P0 a P3, cada um com captura e correção proposta.
- **Pontos conhecidos para confirmar e MEDIR separadamente** (entrada, troca e mergulho são medidas distintas; a jornada inteira não é a entrada):
  - microanimações fracas e sem padrão;
  - rótulos do corpo cruzando linhas-guia;
  - contraste do órgão no tema claro;
  - CLS da jornada do geral (~0,065);
  - maior tarefa na entrada do IDOMED (~550–590 ms com CPU 4×);
  - Lighthouse do celular no geral oscilando de 73 a 93.

**U1 · Sistema de movimento**
- **Coreografia:** em DESIGN.md › Movimento, por categoria (gesto, troca, entrada, saída, mergulho, lista), com tempo, curva, distância e interrupção.
- **Utilitários** em `src/ui/` (`enter`, `exit`, `swap`, `press`, `reveal`), sobre os tokens. Catalogue os usos por função e MIGRE aos poucos; não reescreva tudo só para zerar literais.
- **Verificação no `check`:**
  - cobre arquivos e chamadas definidos (`gsap.to/from/fromTo/timeline` em `src/`), com fixtures positivas e negativas e exceções justificadas;
  - constantes físicas de mola e câmera não são duração nem curva.
- **Aceite:** vídeos antes e depois das trocas (abas, pílula, sublinhado, estrela, ficha, avisos, busca); p95 ativo ≤ 20 ms como observação do ambiente; movimento reduzido intacto.

**U2 · Início na direção D (palco + editorial)**
- **Redesenho:** a página inicial no layout da D (item 1b): palco com coração, título, busca e painéis translúcidos; índice editorial numerado; prateleira de Casos clínicos (reaproveitando os dados de casos já existentes; sem casos, a prateleira não aparece). No celular, a versão compacta e a barra inferior.
- **Primeira visita:** sem rolar, mostra o que é o Aorta, para quem, de onde vêm os materiais (links para os originais) e a busca à mão. A compreensão real em 5 s fica para o piloto com alunos; não declare "resolvido".
- **Estabilidade:** reserve espaço para contagens, "Continuar" e mapa.
- **Aceite:**
  - `ORCAMENTO_ESTRITO=1 npm run orcamento` passa (CLS ≤ 0,03, os dois acervos, 320–1440 px);
  - Lighthouse com 3 execuções: celular ≥ 90 nos dois acervos; acessibilidade e boas práticas 100.

**U3 · Mapa (coração e corpo) e tarefa longa**
- **Rótulos:**
  - nunca cruzam linhas-guia nem se sobrepõem: ordene pela altura projetada da ponta de cada lado e resolva colisões;
  - teste a 320, 768 e 1440 px.
- **Contraste:** destaque do órgão com contraste suficiente nos dois temas, ajustando tokens.
- **Ligação rótulo ↔ parte:** apontar ou focar acende a parte; estado ativo não depende só de cor nem só do canvas.
- **Mergulho:** com continuidade e cancelável (Esc, outro destino, navegação).
- **Celular:** girar sem roubar a rolagem; alvos ≥ 44 px; alternativa sem 3D bonita.
- **Tarefa longa:** em `src/views/map.js` (~linhas 49–84), agrupe leituras e depois escritas, reaproveite medidas e divida entre quadros.
- **Aceite:** redução ≥ 20% na MEDIANA da maior tarefa da entrada (5 sequências, antes e depois com `medir-v5 --fase=`), sem regressão funcional; se não atingir, registre como pendente.

**U4 · Página do módulo na direção D**
- **Redesenho:** cabeçalho com numeral gigante + órgão/parte acesa do assunto ativo; lista editorial no lugar dos cartões; a ficha como painel fixo à direita a partir de 1200 px (item 1b).
- **Cabeçalho:** hierarquia (numeral, artéria, resumo).
- **Unidades:** sublinhado.
- **Matérias:** lateral no computador, fichas no celular.
- **Abas de assunto:** pílula, contagem, foco e rolagem; avalie fixar a faixa ao rolar.
- **Filtros:** barra compacta no celular, com chips removíveis.
- **Grupos e cartões:**
  - título com até 2 linhas, mas o título COMPLETO acessível por toque e teclado, sem depender de hover; no zoom 200% nada se perde (tire o limite de linhas se precisar);
  - "Abrir original" bem destacado;
  - estrela com resposta física.
- **"Em produção":** com cara de design.
- **Aceite:** WCAG sem violações; sem rolagem lateral a 320 px; zoom 200%.

**U5 · Ficha do material**
- **Computador (≥ 1200 px):** painel fixo à direita da lista (direção D). Trocar de material troca o conteúdo do painel com uma transição curta, sem fechar e reabrir; a lista continua navegável por teclado; Esc devolve o foco à linha.
- **Entre o celular e 1200 px:** o painel nasce da linha clicada.
- **Celular:**
  - arraste para fechar só a partir da ALÇA ou área autorizada; o conteúdo continua rolável e selecionável;
  - o botão Fechar está sempre disponível;
  - foco preso dentro; Esc fecha; o foco volta ao cartão ou a uma alternativa se ele sumiu.
- **Testes:** pointercancel, Esc, reabrir durante o fechamento e movimento reduzido trocado no meio do gesto.

**U6 · Busca rápida**
- Abre a partir de onde foi chamada.
- Grifo nos resultados; setas, Enter e Esc.
- Estado vazio útil.
- Sem tremor ao digitar (não refaz a lista se não mudou).

**U7 · Organizar, formulário e colagem**
- Grade clara e rótulos visíveis.
- Erros junto ao campo, em PT-BR.
- Ações consistentes.
- Prévia da colagem com erro e aviso diferenciados por ícone e texto.

**U8 · Estados e avisos**
- **Esqueleto:** acompanha a geometria de cada componente, com no máximo 3 passadas de brilho.
- **Erro:** com nova tentativa.
- **Avisos:** o "Desfazer" PAUSA o tempo enquanto tem foco ou cursor em cima, e a confirmação é acessível.

**U9 · Acabamento**
- **Contraste AA:** de todos os tokens, incluindo `--m1…--m8` sobre `--paper` e `--surface`, nos dois temas.
- **Foco e alvos:** foco visível e bonito; alvos ≥ 44 px.
- **Temas:** paridade entre claro e escuro.
- **Larguras:** 320 px sem cortes.
- **Consistência:** só tokens.
- **Galeria final.**

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
7) QUANDO PARAR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Registre e siga para o próximo pacote quando algo exigir:
- banco;
- dependência nova;
- mudar a identidade (cores-base, fontes, metáforas);
- decisão de conteúdo.
Nesses casos, proponha a opção com captura para o dono decidir.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
8) ENTREGA FINAL (obrigatória, mesmo se parar no meio)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- O ramo `nuvem/ui-lapidacao` enviado, com o SHA final registrado em `docs/ui-progresso.md` ("RODADA B ENCERRADA em <data>, SHA <sha>"), mais `docs/ui-auditoria.md`, `docs/ui/` e o artefato de vídeos conferido (ou a declaração de que não foi entregue).
- Na última mensagem, um relatório em português simples para o dono (estudante de medicina, não programador):
  - o que mudou em cada tela, em 1–2 frases;
  - como ver (`cd tools && node demo.mjs --abas` e `docs/ui/index.html`);
  - números antes → depois (CLS, mediana e pior tarefa da entrada, p95 ativo, Lighthouse), com a ressalva de que são do ambiente da nuvem;
  - pendências;
  - o que SÓ ele pode validar: celular Android e iPhone reais, Safari e leitor de tela.
- Na mesma mensagem, a lista técnica dos commits (`git log --oneline <SHA base>..HEAD`).
