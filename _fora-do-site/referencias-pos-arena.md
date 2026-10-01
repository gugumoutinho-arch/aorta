# Pós-arena — evidência e referências

01/10/2026 — Codex. Fonte anterior à edição: `13812c7`, preservada em `versoes/codex-2026-10-01-antes-pos-arena.html`. Inspeção com banco fictício, sem acessar Supabase ou Drive. Avaliações A (visual) e B (interação/detector) independentes, somente leitura; apenas o agente principal editou o site. A avaliação visual foi considerada antes de sintetizar o detector.

## H1: composição atual, não o parecer antigo

| Evidência antes da edição | Conclusão | Decisão |
|---|---|---|
| `index.html:220–235` em 13812c7; `tools/reports/pos-arena-antes/inicio@375-light.png` e variante dark | Caixa de retomada de 343 × 339 px, entre duas faixas de abas. O capítulo começa em y848 e o primeiro título do catálogo em y997 na medição do avaliador A. | Transformar a retomada em marcador de margem, título aberto, verde reservado à margem e ao botão. Seleção secundária recolhida quando há histórico; aberta sem histórico. |
| `index.html:182–195` em 13812c7; captura `catalogo@375-light.png` | Unidade numa faixa preenchida pouco expressiva; várias camadas com pesos próximos. | Capítulo em Literata 44 px no celular / 64 px no computador, sem caixa; matéria como aba de tinta ligada à régua do explorador. |
| `index.html:961–980` em 13812c7 | A seleção repete navegação e título, mesmo antes do curso. | Disclosure nativo “Em estudo, favoritos e recentes”; mantém as abas e seu teclado dentro. Custo: um toque adicional para essa seleção quando há histórico. |
| Catálogo, sumário, fontes e paleta existentes | H1 não sustenta redesenhar tudo: linhas abertas, assunto em margem e índice já têm identidade. | Preservar fontes, paleta, árvore, títulos integrais e ações diretas. |

## H2: respostas já existentes e lacunas reais

| Ação | Evidência antes | Decisão |
|---|---|---|
| Explorar | Abre, contém foco, informa expansão; captura `explorar@375-light.png` | Preservar. |
| Arrastar índice | Destino aparece no balão; soltar navega, fecha e foca material | Preservar gesto sem inércia. Corrigir `.thumb` que ainda deslocava −4 px com movimento reduzido (`index.html:376,491–492,516–518` em 13812c7). |
| Tocar material | Pressão muda fundo; ficha mostra título integral e ação original | Preservar. |
| Favoritar / status | Atualização fictícia de 800 ms: estado local, `aria-busy`, mensagem e proteção de repetição; uma gravação observada | Problema antigo descartado. Acrescentar contorno de pressão ao status, sem mudar gravações. |
| Remover / Desfazer | Aviso cita original; restauração funcionou; prazo existente de 10 s | Preservar. |
| Busca / filtros | Vazio, limpar e chips funcionam; resultados sem animação | Preservar. |
| Abrir / fechar ficha | Escape retorna foco; reabertura programática durante saída terminou aberta e focada | Preservar. Reabertura programática não equivale a gesto real. |
| Botão Editar e comandos cuja única pressão era escala | Estilos computados idênticos antes/durante pressão sob reduced motion, em 375 touch | Contorno interno imediato, além da escala existente quando permitida. |
| Abas secundárias | Indicador por transform continuava mudando de posição com transição removida | Em reduced motion, trocar por borda fixa apenas no botão selecionado. |

Detector Impeccable executado uma vez: 9 registros, todos com linha 0. Seis alertas de contraste assumiam preto sobre fundo escuro e foram descartados por estilos computados reais; dois de padding ignoravam os insets dos filhos do dialog. Borda de 1 px com sombra de 56 px existe, mas não demonstrou falha de uso: não alterada para satisfazer detector. Sem overlay; inspeção por capturas, DOM e estilos computados.

## Pesquisa e referências em 375 px

Consultadas: [Awwwards Websites](https://www.awwwards.com/websites/), [Typography](https://www.awwwards.com/websites/typography/) e [Mobile Excellence](https://www.awwwards.com/websites/mobile-excellence/). As URLs fornecidas [winner_category_typography](https://www.awwwards.com/websites/winner_category_typography/) e [blog/mobile-excellence](https://www.awwwards.com/blog/mobile-excellence/) retornaram erro no navegador de pesquisa: **não aberto** por essa via. Não se presume que a versão atual de um site seja igual à versão premiada.

Quatro referências da seleção Awwwards e dois complementos, abertos em Playwright 375 × 850:

1. **[Mosby’s Files](https://www.mosbyfiles.com/)** — [ficha indicada no pedido](https://www.awwwards.com/sites/mosbys-files). Site real visto: título condensado, introdução e pastas coloridas sobrepostas, com nomes nas abas; sem overflow. Ideia aplicada: a categoria é parte da navegação, agora matéria e régua compartilham tinta e aparência de aba. Rejeitados hero alto, espera de entrada e simulação física. A ficha falhou na reabertura pelo navegador de pesquisa; não atribuímos data/nota de prêmio não verificadas.
2. **[Poor Charlie’s Almanack](https://www.stripe.press/poor-charlies-almanack/cover)** — [SOTD de 04/01/2024](https://www.awwwards.com/sites/poor-charlies-almanack). Em 375: números tipográficos grandes identificam capítulos/palestras, título serifado e barra de audiolivro; sem cartões e sem overflow. Ideia aplicada: capítulo como composição editorial, com nome real da unidade em vez de numeral decorativo. Rejeitados contraste baixo e fades de entrada observados. Também orienta o marcador de leitura aberto.
3. **[Dictionary of Free Speech](https://freespeech.gubrica.com/)** — [ficha SOTD](https://www.awwwards.com/sites/dictionary-of-free-speech). Em retrato, a experiência principal pede girar a tela/usar tela grande: **experiência principal não aberta em 375 retrato**. A [versão acessível](https://freespeech.gubrica.com/accessible/) abre com apresentação, árvore textual e links; primeiro capítulo perto de y750. Aproveitado apenas como validação da árvore explícita já existente. Rejeitados bloqueio de orientação e espaçamento cerimonial; nenhuma navegação experimental copiada.
4. **[The Brand Identity](https://the-brandidentity.com/)** — [Honorable Mention de 26/11/2021](https://www.awwwards.com/sites/the-brand-identity). Em 375, hero fotográfico integral, “Branding” serifado, “THE BARRIO” sans, CTA no rodapé e fluxo editorial com tipos de publicação; sem overflow. Ideia: função editorial define a hierarquia tipográfica; reforçada na unidade Literata versus matérias/materiais Schibsted. Rejeitado hero de tela inteira. O prêmio histórico foi confirmado, não a equivalência do desenho atual à versão de 2021.
5. Complemento **[Stripe Press](https://press.stripe.com/)**. Em 375: lombadas tridimensionais, cabeçalho pequeno, cookie banner cobrindo parte inferior e espera inicial quase vazia. Identificação por cor é pertinente, mas não entrou implementação derivada daqui: 3D e custo visual inadequados. [Ficha tentada](https://www.awwwards.com/sites/stripe-press): **não aberto**; não contar como prêmio confirmado.
6. Complemento **[Are.na](https://www.are.na/)**. Landing em 375 com texto legível, lista alfabética, controles largos e navegação inferior; sem overflow. Princípio usado na simplificação da seleção secundária: revelar controles conforme a tarefa. Não é inspeção do catálogo autenticado, nem referência com prêmio confirmado.

Nenhuma conta, download de assets, código copiado, biblioteca nova ou crédito. Capturas das referências observadas em memória; capturas locais persistidas correspondem somente ao Atlas.

## Movimento e tema

| Resposta | Antes → depois | Duração / curva / escala |
|---|---|---|
| Botões, Abrir original, Editar | Só escala em alguns → escala + contorno interno no pointer-down | Contorno 0 ms; escala existente 100 ms, `--ease` = cubic-bezier(.23,1,.32,1), .98 |
| Abas de estudo, rota e disclosure | Sem regra de pressão dedicada → fundo imediato | 0 ms, sem escala |
| Status | Seleção só após mudança → contorno também durante pressão | Pressão 0 ms, sem escala; seleção existente preservada |
| Régua em reduced motion | Deslocamento sem transição → só cor/borda | 0 ms, transform none; sem inércia |
| Abas em reduced motion | Indicador espacial → borda fixa no selecionado | 0 ms, sem deslocamento |
| Ficha e explorador | Preservados | Entrada 220 ms, saída 160 ms; `--ease-drawer` = cubic-bezier(.32,.72,0,1); teclado/reduced motion imediatos |
| Tema | Não havia escolha → Sistema/Claro/Escuro | 0 ms, sem reveal; transições desativadas durante aplicação |

Tema no lugar da lupa redundante do cabeçalho: não acrescenta uma linha nem retira a busca visível. Radios nativos em diálogo, alvos de 48 px, retorno de foco pelo sistema de dialog existente. `bm-theme` em localStorage com try/catch; falha volta a Sistema e falha ao salvar é comunicada. Bootstrap antes do conteúdo visível aplica tokens e theme-color; modo Sistema acompanha mudanças do dispositivo. Testes e produção usam `pageHtml()` compartilhado; noindex/no-follow intencional, não é defeito de SEO.

## Skills efetivamente abertas

- Impeccable (`.codex/skills/impeccable/SKILL.md`): critique, audit, bolder, distill e craft-floor; revisão independente visual/técnica, detector sem tratá-lo como prova.
- redesign-existing-projects (`.codex/skills/redesign-existing-projects/SKILL.md`): preservar contratos e mudar composição, não só acabamento.
- emil-design-eng, apple-design, mobile-native, find-animation-opportunities, review-animations, animate (`.agents/skills/*/SKILL.md`): finalidade/frequência, pointer-down, teclado, redução de movimento; consultado também animate/RECIPES.md e seções de tema/aparelho real em mobile-native.
- ECC frontend-design-direction, frontend-a11y, motion-foundations, browser-qa, verification-loop (`.codex/plugins/cache/ecc/ecc/2.2.2/skills/*/SKILL.md`): direção existente, controles semânticos, tokens de movimento, comparação visual e verificação final. Nenhuma dependência React/spring foi introduzida.
- design-taste-frontend não instalada e não utilizada.

## Limites

Testes em Chromium com seed fictício. Não verificados: aparelho físico, Safari/Firefox, leitor de tela real, teclado virtual, login/Supabase real ou publicação. Gravações de teste não persistem fora do mock. Prova de primeira pintura cobre frames/eventos no Chromium com CPU desacelerada, não todos os navegadores/dispositivos.
