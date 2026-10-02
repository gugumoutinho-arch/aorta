---
name: Biblioteca de Medicina
description: Atlas digital — leitura ampla, retomada em verde profundo e explorador contextual do curso.
---

# Atlas digital — sistema visual

Atualizado em 01/10/2026 por Codex. Evolução da navegação “Índice de dedo”, com foco em recuperar largura no celular, tornar a busca uma faixa de trabalho e dar ao catálogo uma leitura editorial por margem.

## Direção

A biblioteca mantém módulo → unidade → matéria → assunto. A serifa identifica capítulos; materiais e controles usam sans. A cor da matéria orienta a seleção e o acesso ao original. O destaque de retomada tem composição e contraste próprios, sem exigir histórico para o restante do início funcionar.

## Tokens

Todos os valores ficam em `:root`, com `prefers-color-scheme` e `[data-theme]`.

| Token | Claro | Escuro |
|---|---|---|
| desk | #edf1ed | #0e1719 |
| page | #f7f8f6 | #131d20 |
| page-2 | #eaf0eb | #263536 |
| surface | #ffffff | #1c292c |
| ink | #203731 | #edf4ef |
| ink-2 | #425b53 | #c4d5ce |
| ink-3 | #53665f | #afc2bc |
| rule | #dce5de | #324447 |
| rule-2 | #c0cec4 | #4b6264 |
| edge | #75877c | #849b96 |
| feature | #173e36 | #203f36 |
| feature-ink | #f2f8f1 | #f2f8f1 |
| feature-muted | #c8dbd1 | #c8dbd1 |
| feature-action | #e1eddc | #e1eddc |

Tintas das matérias continuam nos tokens `t-*`, derivadas de `areas.stain`. Estado inativo do índice usa superfície neutra e borda colorida; estado atual recebe a tinta como fundo e `t-on` no texto.

## Tipografia

- Literata: capítulos, marca, títulos curtos de seção.
- Schibsted Grotesk: materiais, detalhe e interface.
- Material: 17 px no celular / 18 px no computador; altura de linha 1,4; títulos completos.
- Retomada: 22 px / 28 px, peso 500, altura de linha 1,3.
- Detalhe: 25 px, peso 500; título com toda a largura do painel.
- Fontes carregadas com `display=swap`; o comportamento de carregamento existente foi preservado.

## Composição

- Celular: gutter de 16 px nos dois lados. O índice não ocupa mais os 52 px permanentes. A primeira visita apresenta busca, abas “Retomar/Catálogo”, marcador de leitura aberto quando existe e o primeiro capítulo do curso. “Em estudo, favoritos e recentes” fica em disclosure nativo, sempre fechado; sem histórico, “Por onde começar” ocupa o início.
- Computador: a busca ocupa uma faixa própria acima do conteúdo; a retomada e a seleção ocupam duas colunas antes do catálogo.
- O catálogo usa módulo em linha, unidade em Literata grande sem caixa e matérias como abas preenchidas pela tinta da área; assuntos continuam em margem de 132 px no computador e materiais são linhas abertas com título e “Abrir original” alinhados.
- “Explorar” na barra inferior abre `#dlg-toc`: árvore com nomes completos à esquerda e índice de matérias à direita. A cabeça corrente também abre o explorador.
- Computador: sumário contextual de 280 px, conteúdo flexível, índice na borda. A área de retomada tem título largo e ações embaixo.
- Materiais usam superfícies discretas e bordas suaves; foram removidos os pontilhados decorativos.
- “Recém-incluídos” continua sendo a alternativa quando não há histórico, itens em estudo ou favoritos.

## Componentes e interação

- `.resume`/`.feature`: retomada em verde profundo com cabeçalho de data, origem acima do título e ações abaixo. Não há arcos decorativos.
- `.entry`: material legível, abertura do detalhe pelo título e link original separado; largura e altura acompanham o conteúdo.
- `#thumbs`: um único elemento é movido para `#explore-index` no celular e para `.spread` no computador. Evita duplicação de IDs e de estado.
- Toque na matéria fecha o explorador e navega. Arrastar percorre assuntos, mostra o balão e, ao soltar, fecha o explorador e foca um material do destino.
- “Explorar” informa `aria-expanded`; Escape e o botão Fechar devolvem o foco.
- Ao atravessar o breakpoint de 1000 px, o explorador fecha e o índice muda de posição.
- Detalhe: marcador da matéria no cabeçalho, favorito/fechar alinhados no topo, abertura do original em destaque, metadados em grade de duas colunas.
- Movimento curto, com alternativa para `prefers-reduced-motion`: pressão em 100 ms com `--ease`, painéis em 220 ms/160 ms com `--ease-drawer`; modo reduzido mantém apenas cor, borda e foco. Alvos de toque de 44 px ou mais.
- `.start` ("Por onde começar"): aparece só sem histórico. Duas fileiras de portas (`.door`, 2 colunas no celular, 4 no computador): tipos (Provas antigas, Monitoria, Resumos, Casos clínicos) e módulos com material; porta sem material é tracejada e diz "Em produção". Módulos sem material ficam numa linha única "Em produção: M3 M4 …" (`.start-prod`, links de 44 px). Os módulos vêm dos dados; nada fixo em M1–M8.
- "Em produção" (`IN_PRODUCTION`, `areasWithContent()`): módulo, unidade ou matéria sem material nela nem abaixo. Marca no livro (`.part.is-production`, aviso `.part-note` com atalho para o primeiro módulo com conteúdo), no Explorar (`.t-flag`) e na cabeça corrente. Módulos com conteúdo vêm primeiro; sem barra de progresso, porcentagem ou data.
- **Estante visual** (decisão do dono em 02/10/2026): o catálogo é uma estante. `cover()` desenha uma capa por material só com CSS e SVG inline: cor da matéria, lombada à esquerda, rótulo e ícone do tipo (`COVER_ICONS`), textura por tipo (linhas, pontos ou lisa) e o período, quando existe. Sem imagem externa. Cores de sombra e brilho das capas vêm dos tokens `--shade`, `--gloss`, `--cover-*`.
  - Catálogo: grade de capas (2 colunas no celular, `auto-fill` a partir de 700 px) ou lista com capa ao lado; botão Lista/Estante em `.route-tabs` (só no catálogo), escolha em `localStorage` (`bm-layout`), padrão estante. O tipo continua no texto (visualmente oculto) para leitor de tela.
  - Retomada: capa de 84 px ao lado do título. Seleção (Em estudo, Favoritos, Recentes): trilho horizontal de capas (`.rail`).
  - "Por onde começar": capas por tipo (`.type-shelf`) e lombadas de módulo (`.spines`) numa prateleira, na ordem do curso, cores das tintas em rodízio; lombada sem material é tracejada e diz "Em produção". Puxar a lombada (hover/toque) sobe 6 px.
  - Ficha: capa de 60 px ao lado de onde o material fica.
  - Movimento: capa sobe e inclina 1,2° no hover (só com ponteiro fino), afunda a .95 ao pressionar; estrela salta em 260 ms ao favoritar e continua a animação se o item for redesenhado; tudo some com `prefers-reduced-motion`.
- `[data-edit]`: toda ação de edição (Adicionar link, Organizar, Editar, Remover, Adicionar material) o leva e fica em segundo plano (Adicionar link deixou de ser primário). A rodada de acesso o esconde de quem não edita com uma regra, ainda não ativada.
- Aparência: o botão no cabeçalho abre radios nativos para Sistema, Claro e Escuro. A preferência é aplicada antes da primeira pintura, guardada em `bm-theme` quando possível, reage ao sistema e atualiza `theme-color`; falha de armazenamento volta a Sistema.

## Figma e Higgsfield

Proposta editável: https://www.figma.com/design/uK8IhxlrNvcPCEm4mki3Ar

O arquivo contém três frames: Início 375 claro, Início 375 escuro e catálogo 1440 claro. São propostas com textos fictícios, não cópias do catálogo real. A implementação foi refinada para os títulos extensos e estados existentes.

Higgsfield não estava conectado nesta sessão; a CLI também não estava disponível. Nenhum crédito foi gasto e nenhuma imagem externa foi adicionada. O visual utiliza CSS, fontes existentes e os ícones SVG do projeto.

## Para Codex e Claude

- Preserve `window.claude.use("db")`, `supaDb()`, campos, RLS, login e rotas.
- O catálogo continua guardando links. Remover mantém o original; Desfazer permanece.
- Favoritos e status continuam sendo campos do catálogo; não representam progresso individual de múltiplos alunos.
- Os testes de índice no celular precisam abrir “Explorar” antes de procurar as abas. A invisibilidade das abas no estado fechado é esperada.
- `tools/flows.mjs` cobre abertura/fechamento do explorador, navegação, arraste, filtros, detalhe, favorito, status e remover/Desfazer.
- Relatórios e capturas são de dados fictícios. Resultados e limites desta entrega estão em `CHANGES.md`.
