# Biblioteca de Medicina — instruções para agentes (Codex e Claude)

Este projeto é **um único arquivo de site**: `index.html`. É uma biblioteca pessoal de materiais de medicina (links do Google Drive organizados em M1 › unidade › matéria), em português do Brasil, para uso individual.

## Onde as coisas moram (desde 30/09/2026)

| O quê | Onde | Quem mexe |
|---|---|---|
| Código do site | `C:\claude e codexx\index.html`, no repositório Git desta pasta (e no GitHub, quando o usuário fizer `gh auth login`) | Codex e Claude |
| Site no ar | GitHub Pages, publicado automaticamente a cada envio para `main` (`.github/workflows/pages.yml`) | ninguém à mão: o envio publica |
| Catálogo (materiais, áreas, coleções) | Supabase, projeto `biblioteca-medicina` (id `rmqfduksayyplucshqea`, região São Paulo) | Codex e Claude, pelo conector/CLI do Supabase |
| Versão antiga | Artifact do claude.ai `https://claude.ai/artifact/USKSVw9fxkbnsSqWkePCYs`, com o banco do Artifact | congelada; não é mais a fonte do catálogo |

Os agentes **não** têm acesso ao conteúdo dos arquivos do Drive; o catálogo guarda só os links e os metadados.

## Direção MedLeaf (decidida pelo dono em 02/10/2026; vale acima das regras antigas de identidade, movimento e dependências)

O site passa a se chamar **MedLeaf**: um acervo aberto e visualmente ambicioso para estudantes de medicina (ver `PRODUCT.md`). As prioridades mudaram de "discreto e leve" para **"lindo, marcante e ainda rápido de usar"**.

- **Identidade:** noite arroxeada como fundo, roxo vivo como luz e ação, verde-folha como marca, creme no texto e no papel. Conceito **Folhas**: módulos e materiais são folhas que se folheiam; as nervuras da folha representam a hierarquia do curso (módulo › unidade › matéria); a folha de planta aparece na marca, não como decoração solta. Tema escuro é o padrão; o claro continua obrigatório e precisa ser desenhado, não invertido. Literata + Schibsted Grotesk continuam.
- **Movimento é protagonista, sempre com função:** cada animação explica navegação, estado ou resposta ao toque (entrar, abrir, folhear, confirmar). Nada de loop decorativo infinito. Com `prefers-reduced-motion`, tudo funciona sem animação (troca instantânea ou esmaecimento curto).
- **Dependências aprovadas** (versão fixa; no navegador por CDN com SRI, ou pelo `npm` depois da migração para Vite): GSAP (com SplitText, Flip, ScrollTrigger), Swiper, Three.js e Lenis. Qualquer outra biblioteca precisa de pedido explícito do dono e deve ser registrada aqui e em `CHANGES.md`.
- **Desempenho ("rico, mas rápido para chegar"):** a primeira tela útil (marca, título, busca e as folhas dos módulos) precisa aparecer em menos de 2,5 s num celular médio em 4G (LCP < 2,5 s, CLS < 0,1, INP < 200 ms). WebGL, shaders e efeitos pesados carregam **depois** da primeira tela, por cima dela, e têm versão mais simples para aparelho fraco, falta de WebGL ou movimento reduzido. O Lighthouse deixa de exigir 100; desempenho mínimo de 85 no celular, acessibilidade e boas práticas continuam 100.
- **O que não muda:** acessibilidade (teclado, foco visível, contraste 4,5:1, leitor de tela, alvos de 44 px, 375 px sem rolagem lateral), honestidade da interface (links, não arquivos), regras do banco e das chaves, um agente editando por vez, registro em `CHANGES.md`.
- **Arquitetura:** está aprovada a migração do fragmento único para um projeto **Vite** com vários arquivos, publicado pelo GitHub Pages. Até a migração acontecer, as regras de "O arquivo certo" e "Formato do arquivo" abaixo continuam valendo. Quem fizer a migração reescreve essas seções.
- **Revisão de design:** antes de cada commit de interface, rode o agente `medleaf-design-reviewer` (`.claude/agents/medleaf-design-reviewer.md`) e siga a skill `medleaf-design` (`.claude/skills/medleaf-design/SKILL.md`). O Codex lê as mesmas regras nesses arquivos.
- **Protótipos:** propostas visuais ficam em `_fora-do-site/propostas-home/` e não são o site. A referência aprovada até agora é `medleaf-folhas.html`.

## O arquivo certo (leia antes de editar qualquer coisa)

- **Editar somente:** `C:\claude e codexx\index.html`. É a única fonte do site.
- **Editar no lugar.** Não crie cópias do site em outras pastas nem arquivos como `index2.html`. `_site/` é gerado por `tools/build-pages.mjs` e não é editado à mão.
- **Ignorar:** `versoes/` (cópias antigas, só leitura) e `_fora-do-site/` (materiais de estudo e ferramentas, fora do site).
- **Histórico:** use `git diff` e `git log`; faça commit com mensagem curta em português. Antes de uma mudança grande, um backup em `versoes/` continua permitido.
- **Confira o caminho:** se a sua pasta de trabalho não for `C:\claude e codexx`, pare e avise o usuário.
- **Nunca editem ao mesmo tempo.** Um agente por vez. Quem terminar registra em `CHANGES.md` e faz commit.

## Formato do arquivo (obrigatório)

`index.html` continua sendo um **fragmento**: começa com `<title>Biblioteca de Medicina</title>` e **não** tem `<!doctype>`, `<html>`, `<head>` nem `<body>`. O claude.ai e o `tools/build-pages.mjs` envolvem o fragmento num documento completo.

- Ordem: `<title>`, `<link>` de fontes, `<style>`, bootstrap síncrono do tema (antes do conteúdo visível), HTML da página, `<script>` principal. O bootstrap evita piscar o tema salvo na primeira pintura.
- CSS e JS dentro do arquivo. Scripts externos só com versão fixada: `@supabase/supabase-js@2.117.2` no jsDelivr (carregado apenas fora do claude.ai) e as bibliotecas da lista aprovada na seção "Direção MedLeaf", sempre com SRI. Estilos externos só do Google Fonts; CSS de bibliotecas é embutido.

## Banco de dados

O script tem **duas pontas com a mesma interface** (`collection`, `doc`, `onSnapshot`, `set`, `update`, `delete`):

- Dentro do claude.ai: `await window.claude.use("db")` (usado também pelos testes em `tools/`, com dados fictícios).
- No site próprio: Supabase, pela função `supaDb()`, que traduz os campos do site (camelCase) para as colunas do banco (snake_case).

Tabelas no Supabase (não renomeie sem pedir ao usuário):

- `materials`: `id`, `title`, `url`, `area_id`, `subject`, `period`, `type`, `tags[]`, `collection_ids[]`, `source`, `notes`, `status` (`nao-iniciado` | `em-estudo` | `revisado`), `favorite`, `created_at`, `last_opened_at`, `status_at`
- `areas`: `id`, `name`, `parent_id` (vazio = módulo), `sort_order`, `stain`, `short`, `created_at`
- `collections`: `id`, `name`, `created_at`

Regras:

- **Acesso:** as regras do banco (RLS) só deixam ler e gravar os e-mails do dono, conferidos na função `private.is_librarian()`. Não afrouxe essas regras e não copie os e-mails para o código do site.
- **Chaves:** o `index.html` só pode conter a chave **pública** (`sb_publishable_…`). Nunca coloque a chave `service_role`, senhas ou tokens no repositório.
- **Mudanças de estrutura** (colunas, tabelas, regras) só com pedido do usuário, por migração no Supabase, e registradas em `CHANGES.md`.
- **Não invente registros.** Alterar o catálogo (criar, editar, apagar materiais) só quando o usuário pedir.
- **Honestidade da interface:** a página guarda **links**, não arquivos, e não sincroniza com o Drive. Nada de botões que aparentem importar, sincronizar, enviar arquivos ou buscar dentro dos documentos.
- **Remover do catálogo nunca apaga o arquivo original.** Manter o aviso e o "Desfazer".

## Regras técnicas

- Nada de `alert()`, `confirm()`, `prompt()`, `window.print()`, downloads por `<a download>` nem iframes de outros sites.
- **Cores só por tokens** em `:root`, com versões clara e escura (`prefers-color-scheme` + `[data-theme]`).
- **Celular primeiro:** 375 px sem rolagem horizontal, gutter lateral de 16 px, áreas de toque de pelo menos 44 px.
- **Acessibilidade:** foco visível, teclado, contraste mínimo de 4,5:1, `aria-*` nos controles, respeito a `prefers-reduced-motion`.
- Movimento: ver "Direção MedLeaf" (protagonista, sempre com função, com versão sem animação).
- Identidade visual **implementada hoje** (até a rodada MedLeaf entrar no site): "Atlas digital" (ver `DESIGN.md`; produto em `PRODUCT.md`): Literata nos capítulos e Schibsted Grotesk nos materiais, superfícies claras ou carvão esverdeado, retomada em verde profundo e tintas por matéria. No celular, “Explorar” abre o sumário com índice de arraste; o conteúdo usa toda a largura. No computador, sumário contextual à esquerda e abas discretas na borda. Desde 02/10/2026 o catálogo é uma "estante visual": capas por tipo de material (CSS/SVG, sem imagens), lombadas de módulo e prateleiras de capas (ver `DESIGN.md`). Mudanças de identidade só com pedido do usuário.

## Verificações automáticas (`tools/`)

Depois de editar `index.html`, rode dentro de `tools/`:

```bash
npm run check        # formato, sintaxe, CSS, HTML, 24 telas, console e acessibilidade
npm run lighthouse   # desempenho (mínimo 85 no celular), acessibilidade e boas práticas (100)
node flows.mjs       # fluxos (detalhe, favorito, status, remover/Desfazer, filtros, foco, alvos de 44 px) e capturas em tools/reports/flows/
```

- Na primeira vez: `npm install --ignore-scripts` dentro de `tools/`.
- Os testes usam **dados fictícios** (`tools/seed.json`) pela ponta do claude.ai; não tocam no Supabase. Diga no `CHANGES.md` o que foi testado e o que não foi.
- Não envie para `main` com `check` em erro: o envio publica o site.

## Como registrar uma mudança

1. Edite `index.html` (ou, com pedido do usuário, a estrutura do banco).
2. Rode as verificações.
3. Acrescente no topo de `CHANGES.md`: data, quem fez, o que mudou, por quê, o que foi testado.
4. Faça commit. O envio para `main` publica o site.
