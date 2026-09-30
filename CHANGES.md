# Registro de mudanças — Biblioteca de Medicina

Mais recente primeiro. Regras completas em `AGENTS.md`.

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
