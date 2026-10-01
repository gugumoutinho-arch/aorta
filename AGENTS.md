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

## O arquivo certo (leia antes de editar qualquer coisa)

- **Editar somente:** `C:\claude e codexx\index.html`. É a única fonte do site.
- **Editar no lugar.** Não crie cópias do site em outras pastas nem arquivos como `index2.html`. `_site/` é gerado por `tools/build-pages.mjs` e não é editado à mão.
- **Ignorar:** `versoes/` (cópias antigas, só leitura) e `_fora-do-site/` (materiais de estudo e ferramentas, fora do site).
- **Histórico:** use `git diff` e `git log`; faça commit com mensagem curta em português. Antes de uma mudança grande, um backup em `versoes/` continua permitido.
- **Confira o caminho:** se a sua pasta de trabalho não for `C:\claude e codexx`, pare e avise o usuário.
- **Nunca editem ao mesmo tempo.** Um agente por vez. Quem terminar registra em `CHANGES.md` e faz commit.

## Formato do arquivo (obrigatório)

`index.html` continua sendo um **fragmento**: começa com `<title>Biblioteca de Medicina</title>` e **não** tem `<!doctype>`, `<html>`, `<head>` nem `<body>`. O claude.ai e o `tools/build-pages.mjs` envolvem o fragmento num documento completo.

- Ordem: `<title>`, `<link>` de fontes, `<style>`, HTML da página, `<script>`.
- CSS e JS dentro do arquivo. Scripts externos só com versão fixada (hoje: `@supabase/supabase-js@2.117.2` no jsDelivr, carregado apenas fora do claude.ai); estilos externos só do Google Fonts.

## Banco de dados

O script tem **duas pontas com a mesma interface** (`collection`, `doc`, `onSnapshot`, `set`, `update`, `delete`):

- Dentro do claude.ai: `await window.claude.use("db")` (usado também pelos testes em `tools/`, com dados fictícios).
- No site próprio: Supabase, pela função `supaDb()`, que traduz os campos do site (camelCase) para as colunas do banco (snake_case).

Tabelas no Supabase (não renomeie sem pedir ao usuário):

- `materials`: `id`, `title`, `url`, `area_id`, `subject`, `period`, `type`, `tags[]`, `collection_ids[]`, `source`, `notes`, `status` (`nao-iniciado` | `em-estudo` | `revisado`), `favorite`, `created_at`, `last_opened_at`, `status_at`
- `areas`: `id`, `name`, `parent_id` (vazio = módulo), `sort_order`, `stain`, `short`, `created_at`
- `collections`: `id`, `name`, `created_at`

Regras:

- **Acesso:** as regras do banco (RLS) só deixam ler e gravar os e-mails da dona, conferidos na função `private.is_librarian()`. Não afrouxe essas regras e não copie os e-mails para o código do site.
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
- Movimento só onde ajuda a entender uma ação.
- Identidade visual atual: "Índice de dedo" (ver `DESIGN.md`; produto em `PRODUCT.md`): a biblioteca é um livro de referência do curso, com abas impressas na borda (uma por matéria, altura proporcional, arrastar para folhear), entradas de sumário com linha pontilhada até "Abrir original", sumário em duas páginas no computador. Literata + Schibsted Grotesk; tintas por coloração da matéria. Mudanças de identidade só com pedido do usuário.

## Verificações automáticas (`tools/`)

Depois de editar `index.html`, rode dentro de `tools/`:

```bash
npm run check        # formato, sintaxe, CSS, HTML, 24 telas, console e acessibilidade
npm run lighthouse   # desempenho, acessibilidade e boas práticas
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
