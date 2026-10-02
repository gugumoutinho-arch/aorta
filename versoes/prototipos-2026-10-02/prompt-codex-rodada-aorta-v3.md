# Rodada Aorta v3 — protótipos de home, módulo e material (para o Codex)

## 1. Objetivo desta rodada

Levar a interface do Aorta a um nível de site premiado, usável por estudante de medicina no celular em poucos segundos. São três telas encadeadas, como protótipos fora do site:

**home (coração-mapa) → página do módulo → ficha do material**

As três precisam ter:
- tema escuro e claro, cada um desenhado;
- versão sem WebGL completa;
- movimento reduzido;
- estados de falha.

O dono quer **ver como fica** antes de decidir. Por isso esta rodada é de protótipo:

- **Não altere `index.html`, `AGENTS.md`, `PRODUCT.md`, `DESIGN.md`, a skill nem o revisor.** Se achar que uma regra deve mudar, escreva a proposta no relatório.
- **A migração para Vite não faz parte desta rodada.**
- **Sem publicação, sem push, sem Supabase real, sem mexer em RLS ou chaves.** Não há remote configurado; não configure um.
- Um agente edita por vez. O Claude não vai mexer no projeto durante a rodada.
- Protótipo aprovado não é implementação concluída. No relatório, não diga que algo "está no site".

## 2. Leia antes de começar (nesta ordem)

1. `AGENTS.md`, em especial a seção "Direção Aorta". Ela prevalece sobre o resto.
2. `.claude/skills/aorta-design/SKILL.md`, o sistema visual. Contém:
   - conceito, paleta e tipografia;
   - componentes e especificações de movimento e batimento;
   - regras de WebGL;
   - bibliotecas com hashes SRI;
   - a lista do que nunca quebrar.
3. `.claude/agents/aorta-design-reviewer.md`, o critério que vai julgar a rodada.
4. `PRODUCT.md` e `CHANGES.md` (as últimas entradas).
5. `DESIGN.md`. **Atenção:** ele ainda descreve o sistema anterior ("Atlas digital"). Onde conflitar com a skill do Aorta, vale a skill.
6. `_fora-do-site/plano-amanha.md`, o plano combinado com o dono.
7. **`_fora-do-site/propostas-home/aorta-home.html`.** É a **home v2, a base desta rodada** e o protótipo mais recente.
   - Inclui: paleta Ctrl/⌘+K, carregamento com progresso real em bytes, artérias projetadas na superfície por raycast, batimento "lub-dub" com fluxo só nos módulos irrigados, rótulos HTML empilhados, painel do módulo, botão "Pausar batimento", atmosfera e versão sem WebGL.
   - Capturas dela: `ah-*.png` na mesma pasta.
   - O `coracao-mapa.html` é a versão anterior. As propostas A, B, B2 e as "medleaf-*" são histórico. Delas, só aproveite padrões de interação, como o maço do Swiper em `medleaf-folhas.html`.
8. `_fora-do-site/referencias/quadro.html` e as capturas da mesma pasta (computador e celular de cada referência).
9. Opcional, como mapa rápido do projeto: `graphify-out/GRAPH_REPORT.md`, um grafo de conhecimento dos documentos e do código.
   - Para consultas: `graphify query "<pergunta>"`.
   - O executável está em `C:\Users\Usuario\AppData\Roaming\Python\Python312\Scripts`.

## 3. Como abrir os protótipos

O modelo 3D não carrega por `file://`. Sirva a pasta assim:

```powershell
cd "C:\claude e codexx\_fora-do-site\propostas-home"; python -m http.server 4175
```

O modelo está em `propostas-home/modelos/heart-hra-v1.3.glb`.
- Crédito CC BY 4.0 visível em toda tela que o mostrar.
- Texto do crédito: "3D Reference Organ for Heart, Male, v1.3 — HuBMAP / Human Reference Atlas, Visible Human Male (NLM), CC BY 4.0", com o aviso de que as artérias são traçado estilizado.

## 4. Ferramentas (use estas; não carregue o resto)

Leia o `SKILL.md` de cada uma antes de aplicar. Skills são ferramentas suas, não dependências do site.

| Papel | Skill | Onde |
|---|---|---|
| Base de identidade (obrigatória) | aorta-design | `C:\claude e codexx\.claude\skills\aorta-design\SKILL.md` |
| Acabamento visual principal | impeccable | `C:\Users\Usuario\.agents\skills\impeccable\SKILL.md` |
| Detalhe de interação e movimento | emil-design-eng | `C:\Users\Usuario\.agents\skills\emil-design-eng\SKILL.md` |
| Movimento interrompível | motion-foundations | `C:\Users\Usuario\.codex\plugins\cache\ecc\ecc\2.2.3\skills\motion-foundations\SKILL.md` |
| Acessibilidade | frontend-a11y | `...\ecc\2.2.3\skills\frontend-a11y\SKILL.md` |
| Verificação no navegador | playwright-skill (ou browser-qa) | `C:\Users\Usuario\.agents\skills\playwright-skill\SKILL.md` |
| Fechamento (obrigatório) | aorta-design-reviewer | `C:\claude e codexx\.claude\agents\aorta-design-reviewer.md` |

- **Apoio opcional para o celular**: mobile-native (`~\.agents\skills\mobile-native`), para folha inferior, `100dvh`, área segura e alvos de toque.
- **Apple-design**: só como referência de física de mola e material. Não troque a identidade Aorta pela estética da Apple.
- **Não use** geração de imagem, Figma, Canva ou Higgsfield nesta rodada. O visual tem de sair do código, com a tipografia, a paleta e o modelo 3D do projeto.

## 5. Referências (pegue padrões, nunca código, textos, imagens ou marcas)

Visite os sites, se puder, e anote o que pegou de cada um. A lista inclui todas as referências do quadro e todas as indicadas pelo dono no Awwwards.

**Já estudadas (capturas em `_fora-do-site/referencias/`):**

| Site | O que pegar | O que não copiar |
|---|---|---|
| **Igloo Inc** (igloo.inc), Site do Ano 2024 Awwwards | Cena 3D com névoa, luz e linhas de profundidade: o coração "num lugar" | Abertura longa; navegação escondida |
| **Lando Norris** (landonorris.com), Site do Ano 2025 | Serifa itálica colorida + grotesca; linhas topográficas; uma única cor de ação forte; cartão de canto | Texto gigante empurrando a busca no celular |
| **Messenger** (messenger.abeto.co), Dev Site do Ano 2025 | Um objeto central com muito ar | Virar jogo |
| **Lusion** (lusion.co) | Contador de carregamento como identidade | Bloquear o uso até a animação acabar |
| **Linear** (linear.app) | Título em dois tons; legendas mono "FIG 0.1"; grade fina; mostrar a interface real como prova | Cinza demais (nosso escuro é ameixa e quente) |
| **Raycast** (raycast.com) | Paleta de comandos; feixes de luz com grão | Feixes cobrindo conteúdo no celular |
| **Stripe** (stripe.com) | Número vivo vindo dos dados; duas ações claras | Número inventado |
| **Vercel** (vercel.com) | Navegação mínima; hierarquia de ações | Faixa de logos |
| **Apple AirPods Pro** (apple.com/airpods-pro) | Cartões de mídia; progresso; botão de pausar; títulos curtos | Vídeos pesados em sequência |

**Indicadas pelo dono no Awwwards, a estudar nesta rodada:**
- **awwwards.com** e **awwwards.com/websites/**: os vencedores recentes (Site do Dia, do Mês e do Ano). Escolha 3 a 5 que tenham a ver com acervo, leitura, ciência ou 3D com propósito.
- **awwwards.com/websites/winner_category_typography/**: hierarquia tipográfica premiada. Use para a página do módulo e a ficha, que são telas de leitura.
- **awwwards.com/blog/mobile-excellence/**: o que o júri valoriza no celular. A home do celular tem de ser redesenhada, não encolhida.
- **awwwards.com/sites/mosbys-files**: arquivo e catálogo editorial; como organizar muitos itens com personalidade.
- **awwwards.com/sites/poor-charlies-almanack**: livro na web; ritmo de leitura, índice, passagem entre capítulos. Serve para módulo, unidade, matéria e material.
- **awwwards.com/sites/dictionary-of-free-speech**: dicionário e índice navegável; busca e lista densa que continua bonita. Serve para o acervo cheio e para a busca.

No relatório, cada decisão de design cita a referência que a inspirou.

## 6. O que fazer, tela a tela

### 6.1 Princípios que valem para as três telas

1. **Bonito antes do 3D.** Marca, busca e módulos formam uma composição completa sem o coração. O coração entra como enriquecimento:
   - não reorganiza a tela nem empurra conteúdo;
   - não bloqueia a navegação;
   - o contador de carregamento fica dentro da área do mapa, nunca na tela toda.
2. **A assinatura é a transição coração → módulo → material.**
   - Ao escolher uma artéria, a cor e a posição dela orientam a abertura do módulo. Por exemplo, a câmera segue a artéria e o rótulo vira o título da página, com Flip.
   - Ao voltar: mesmo foco, mesma posição de rolagem e o coração no mesmo estado.
3. **A busca é mais rápida que a exploração.**
   - Ctrl/⌘+K e o campo de busca de qualquer tela levam direto ao material.
   - Títulos completos, com módulo › unidade › matéria visíveis.
   - Busca vazia sugere caminhos reais (módulos e matérias que existem), não frases genéricas.
4. **Movimento interrompível.** Cliques rápidos, abrir e fechar repetidamente, trocar de módulo no meio da transição, aba escondida e movimento reduzido: nada trava, duplica ou fica em estado intermediário. Use GSAP com `overwrite`/`kill` e nunca empilhe tweens.
5. **Sem WebGL também é Aorta**, com:
   - a mesma tipografia, as mesmas cores de módulo e a mesma hierarquia;
   - um desenho 2D das artérias (SVG), em vez de uma lista crua.
   É um produto completo, não um plano B.
6. **Pouco e muito conteúdo.** Prove as telas com dois cenários de dados fictícios:
   - o atual: 2 módulos irrigados, 7 materiais;
   - um abundante: os 8 módulos, ~120 materiais, títulos longos, matérias com 1 e com 30 materiais.

   Nos dois:
   - "Em produção" é calculado dos dados, nunca fixo;
   - M1–M8 não ficam fixos no código: os módulos vêm da lista de dados.
7. **Estados de falha desenhados:**
   - carregando;
   - busca vazia;
   - falha de rede;
   - modelo 3D indisponível (cai na versão SVG com aviso discreto);
   - remover material com aviso "o arquivo original no Drive não é apagado", com Desfazer.
8. **Honestidade.** O site guarda links, não arquivos.
   - Nada de interface de upload, sincronização com o Drive ou busca dentro dos arquivos.
   - Nenhum número, atividade ou recomendação inventados.
   - Favoritos e situação são de quem está logado. Não os desenhe como estado compartilhado.

### 6.2 Home v3 (a partir de `aorta-home.html`)

Pontos fracos da v2 que esta rodada deve resolver. Comece criticando com evidência das capturas `ah-*.png` e acrescente o que mais encontrar.

- **Rótulos dos módulos em caixas soltas** competem com o coração. Teste linhas-guia finas (Linear e atlas anatômico):
  - partem da ponta da artéria até um rótulo alinhado numa coluna;
  - rótulo tipográfico (mono "ART. 01", numeral serifado e contagem), sem caixa pesada.
- **Celular.** Hoje o coração fica abaixo da dobra, depois de busca e "continuar".
  - Redesenhe a primeira tela do celular: título curto, busca e uma faixa do coração com os módulos tocáveis.
  - Teste também os módulos como trilho horizontal de artérias, sem rolagem lateral da página.
- **Seção "Como o Aorta funciona"** é genérica. Troque por algo útil com dados reais: índice dos módulos (unidades e matérias com contagem) ou "chegou agora" com os materiais mais recentes. Os três diagramas podem ficar como legenda pequena do mapa.
- **Hierarquia do título.** Teste a escala de tamanhos e o tamanho óptico da Literata. Em 375 px, a sub-linha `.dim` está pequena demais e longa demais.
- **Microinterações com função:**
  - apontar ou focar um rótulo realça a artéria e dispara o fluxo nela;
  - setas do teclado andam entre as artérias;
  - o "Continuar" mostra em que parte do módulo a pessoa estava.
- **Profundidade sem custo:**
  - névoa e luz somente onde ajudam a ler o coração;
  - grão leve;
  - nada em loop além do batimento de repouso, que pausa fora da tela, com a aba escondida ou com o botão de pausa.

### 6.3 Página do módulo (nova)

- **Chegada pela transição da artéria**, como no item 2 dos princípios (seção 6.1). Com movimento reduzido: troca direta com foco no título.
- **Cabeçalho:**
  - numeral grande do módulo ("M1") na serifa;
  - linha mono "ART. 01 · DESCENDENTE ANTERIOR";
  - mini desenho da artéria na cor do módulo;
  - contagem real.
- **Unidades como abas ou segmentos.** Unidade sem material mostra "Em produção" com o traço tracejado do coração.
- **Matérias em grade fina** com contagem. Inspire-se em Linear e Dictionary of Free Speech.
- **Materiais como folhas.** Título completo, nunca cortado no meio. Cada folha mostra:
  - tipo (Slides, Resumo, Caso clínico, Livro, Monitoria, Prova…);
  - assunto;
  - situação (Não iniciado, Em estudo ou Revisado);
  - estrela de favorito;
  - "Abrir original ↗".

  Teste também o maço com Swiper para destaques. Use só se ajudar.
- **Filtros simples:** tipo, situação, favoritos. Busca local com o mesmo atalho.
- **Navegação:** voltar ao coração e ir ao módulo vizinho, com as setas.

### 6.4 Ficha do material (nova)

- Folha inferior no celular, com arrastar para fechar. Diálogo lateral no computador.
- Conteúdo:
  - título completo;
  - onde fica (módulo › unidade › matéria › assunto);
  - controle segmentado de situação;
  - estrela com o "pop" já existente no site;
  - "Abrir original ↗" como ação principal em carmim;
  - aviso discreto de que o site guarda o link e o arquivo continua no Drive.
- Remover, só para quem edita: aviso de que o original não é apagado e Desfazer no aviso temporário.
- Foco preso no diálogo; Esc fecha; o foco volta à folha de origem.

### 6.5 Tema claro (as três telas)

- Direção própria, não inversão:
  - papel creme (`--cream #f6eee8` como base);
  - tinta ameixa nos textos;
  - artérias vinho e carmim;
  - coração translúcido carmim/violeta sobre papel;
  - grão de papel leve.
- Troca Sistema / Claro / Escuro, guardada em `localStorage`, com o padrão do sistema respeitado.
- Contraste ≥ 4,5:1 nos dois temas. Meça e liste os pares no relatório.

## 7. Limites técnicos

- **Bibliotecas:** só as aprovadas na skill, com versão fixa e SRI pelo jsDelivr: GSAP 3.15.0 (+ SplitText, Flip, ScrollTrigger), Swiper 14.3.0 e Three.js 0.186.1, com o import map já usado na v2.
  - Escolha só o necessário.
  - Lenis está aprovado mas ainda sem versão fixada. Se usar, fixe a versão, calcule o SRI e registre. Na dúvida, não use.
- **Acessibilidade:**
  - teclado e foco visível;
  - leitor de tela (canvas com `aria-hidden` e alternativa HTML);
  - alvos ≥ 44 px;
  - `prefers-reduced-motion`;
  - nada só por cor.
- **Layout:**
  - 375 px sem rolagem lateral (`overflow-x: clip`);
  - área segura do iPhone;
  - `100dvh`.
- **Desempenho:**
  - primeira tela útil sem WebGL;
  - modelo carregado depois;
  - render sob demanda;
  - nada de vídeo.

## 8. Entregáveis

Tudo em `_fora-do-site/propostas-home/aorta-v3/` (pasta nova). A pasta `_fora-do-site/` está no `.gitignore`, então não há commit nesta rodada.

1. `home.html`, `modulo.html` (com a ficha do material como diálogo), ou um arquivo único navegável se a transição exigir. Todos com a chave de tema e um seletor de cenário de dados ("atual" / "abundante").
2. `dados.js`: os dois cenários fictícios. Os títulos começam com "Exemplo —".
3. `comparar.html`: página que mostra v2 e v3 lado a lado, com as capturas, para o dono decidir.
4. `capturas/`: capturas Playwright das três telas e dos estados de falha.
   - Tamanhos 375 × 812 e 1440 × 900.
   - Temas escuro e claro.
   - Com movimento normal e reduzido.
   - Também com WebGL desligado.
5. `RELATORIO.md`, com:
   - a crítica da v2;
   - as decisões, cada uma com a referência que a inspirou;
   - tokens e componentes novos;
   - especificação de movimento (durações, curvas, interrupção);
   - pares de contraste;
   - o que propõe mudar em AGENTS.md, DESIGN.md e na skill (só como proposta);
   - riscos e próximos passos para a implementação em Vite.

## 9. Critérios de aceitação e evidências

Rode e anexe a saída no relatório:

- [ ] Script Playwright próprio sobre os protótipos (servidor da seção 3), com `--use-angle=swiftshader`. Ele deve verificar:
  - zero erros de console;
  - `scrollWidth === innerWidth` em 375 px;
  - foco visível percorrendo com Tab;
  - Esc fecha diálogo e paleta;
  - o foco volta ao lugar de origem;
  - teste de interrupção (10 cliques rápidos em artérias diferentes, abrir e fechar a ficha 10 vezes, trocar de módulo durante a transição) sem estado preso.
- [ ] axe-core sem violações sérias ou críticas nas três telas, nos dois temas.
- [ ] Busca: "placenta", "imuno" e uma busca sem resultado se comportam como descrito.
- [ ] Sem WebGL (forçar falha do contexto) e com o modelo indisponível (renomear a URL): a tela continua completa.
- [ ] Para provar que o site não foi tocado: na pasta `tools/`, rode `npm run check` e `node flows.mjs`, e cheque se `git status` mostra `index.html` sem mudanças. O `npm run lighthouse` mede o site e não os protótipos; rode só se sobrar tempo, e diga isso.
- [ ] Revisão final com o `aorta-design-reviewer`: siga o arquivo como revisor independente e cole o veredito e a tabela de severidade. Corrija tudo que for crítico ou alto antes de entregar.

**Diga com honestidade:**
- os testes usam dados fictícios, não o Supabase real;
- celular emulado não é aparelho físico (Safari e WebGL no iPhone ficam pendentes);
- capturas não provam a qualidade das animações. Descreva o que viu rodando.

## 10. Ao terminar

- Não implemente nada no `index.html`. **Pare e espere a escolha do dono.**
- Na resposta final, em português e curta, informe:
  - onde abrir (comando do servidor e URLs);
  - as 5 mudanças mais visíveis em relação à v2;
  - o veredito do revisor;
  - o que não conseguiu verificar;
  - 2 a 3 perguntas de decisão para o dono, por exemplo rótulos com linhas-guia ou trilho no celular, e se o maço do Swiper fica.
