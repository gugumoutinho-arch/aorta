---
name: Biblioteca de Medicina
description: Atlas digital — leitura ampla, retomada em verde profundo e explorador contextual do curso.
---

# Atlas digital — sistema visual

Atualizado em 01/10/2026 por Codex. Evolução da navegação “Índice de dedo”, com foco em recuperar largura no celular e tornar a leitura menos semelhante a um sumário impresso.

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

- Celular: gutter de 16 px nos dois lados. O índice não ocupa mais os 52 px permanentes.
- “Explorar” na barra inferior abre `#dlg-toc`: árvore com nomes completos à esquerda e índice de matérias à direita. A cabeça corrente também abre o explorador.
- Computador: sumário contextual de 280 px, conteúdo flexível, índice na borda. A área de retomada tem título largo e ações embaixo.
- Materiais usam superfícies discretas e bordas suaves; foram removidos os pontilhados decorativos.
- “Recém-incluídos” continua sendo a alternativa quando não há histórico, itens em estudo ou favoritos.

## Componentes e interação

- `.feature`: retomada em verde profundo; origem acima do título, data e ações abaixo. Arcos discretos de CSS são decorativos e não contêm informação científica.
- `.entry`: material legível, abertura do detalhe pelo título e link original separado; largura e altura acompanham o conteúdo.
- `#thumbs`: um único elemento é movido para `#explore-index` no celular e para `.spread` no computador. Evita duplicação de IDs e de estado.
- Toque na matéria fecha o explorador e navega. Arrastar percorre assuntos, mostra o balão e, ao soltar, fecha o explorador e foca um material do destino.
- “Explorar” informa `aria-expanded`; Escape e o botão Fechar devolvem o foco.
- Ao atravessar o breakpoint de 1000 px, o explorador fecha e o índice muda de posição.
- Detalhe: marcador da matéria no cabeçalho, favorito/fechar alinhados no topo, abertura do original em destaque, metadados em grade de duas colunas.
- Movimento curto, com alternativa para `prefers-reduced-motion`. Alvos de toque de 44 px.

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
