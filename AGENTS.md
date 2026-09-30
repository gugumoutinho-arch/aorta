# Biblioteca de Medicina — instruções para agentes (Codex e Claude)

Este projeto é **um único arquivo**: `index.html`. É uma biblioteca pessoal de materiais de medicina (links do Google Drive organizados em M1 › unidade › matéria), em português do Brasil, para uso individual.

## O arquivo certo (leia antes de editar qualquer coisa)

- **Editar somente:** `C:\claude e codexx\index.html`. É a única fonte do site. Não existe outro.
- **Editar no lugar.** Não crie cópias do site em outras pastas (nada de `outputs/`, `work/`, Área de Trabalho, `Documents\Codex\...`) e não gere `index2.html`, `index-novo.html` ou similares.
- **Ignorar:** `versoes/` (cópias antigas, só leitura) e `_fora-do-site/` (materiais de estudo e ferramentas do Claude, não fazem parte do site). Nenhum `.html` dentro dessas pastas é o site.
- **Backups:** antes de uma mudança grande, copie o `index.html` para `versoes/` (ex.: `versoes/codex-AAAA-MM-DD-HHMM.html`). É a única cópia permitida.
- **Confira o caminho:** se a sua pasta de trabalho não for `C:\claude e codexx`, pare e avise o usuário em vez de editar outro arquivo.

## Quem faz o quê

- **Codex e Claude podem editar `index.html`** (aparência, textos, comportamento da página).
- **Só o Claude publica.** O site é um Artifact privado do claude.ai (`https://claude.ai/artifact/USKSVw9fxkbnsSqWkePCYs`). O Codex não consegue publicar nele e não deve tentar.
- **Só o Claude lê e grava o catálogo** (banco de dados do Artifact: materiais, áreas, coleções). O Codex não tem acesso a esses dados e não deve inventar registros.
- **Nunca edite ao mesmo tempo.** Um agente por vez. Quem terminar registra a mudança em `CHANGES.md`, e o usuário avisa o Claude ("publique") para conferir e republicar.

## Formato do arquivo (obrigatório)

`index.html` é o **conteúdo** de uma página que o claude.ai envolve num esqueleto ao publicar. Por isso:

- O arquivo **começa com** `<title>Biblioteca de Medicina</title>`.
- **Não** coloque `<!doctype>`, `<html>`, `<head>` nem `<body>`. Se o arquivo tiver essas tags, o Claude precisa removê-las antes de publicar.
- Ordem: `<title>`, `<link>` de fontes, `<style>`, HTML da página, `<script>`.
- O arquivo tem de continuar **autossuficiente**: CSS e JS dentro dele.

## O que NÃO pode mudar sem pedir ao usuário

- **Acesso ao banco:** `await window.claude.use("db")` e as três coleções `materials`, `areas` e `collections`, com os campos atuais:
  - `materials`: `title`, `url`, `areaId`, `subject`, `period`, `type`, `tags[]`, `collectionIds[]`, `source`, `notes`, `status` (`nao-iniciado` | `em-estudo` | `revisado`), `favorite`, `createdAt`, `lastOpenedAt`
  - `areas`: `name`, `parentId` (vazio = módulo), `order`, `stain`, `short`
  - `collections`: `name`
- Trocar nomes de campos ou coleções **quebra os 26 materiais já cadastrados**.
- **Honestidade da interface:** a página guarda **links**, não arquivos, e não sincroniza com o Drive. Não crie botões que aparentem importar, sincronizar, enviar arquivos ou buscar dentro dos documentos.
- **Remover do catálogo nunca apaga o arquivo original** do Drive. Manter o aviso e o "Desfazer".
- **Nada de dados pessoais no código:** não copie materiais, links do Drive nem conteúdo do banco para dentro do `index.html`. Sem chaves, senhas ou tokens.

## Regras técnicas do ambiente de publicação

- Scripts externos só de `cdnjs.cloudflare.com` (versão fixada); estilos externos só do Google Fonts. Nada de `fetch` para outros sites, `alert()`, `confirm()`, `prompt()`, `window.print()`, downloads por `<a download>` nem iframes de outros sites.
- **Cores só por tokens** em `:root`, com versões clara e escura (`prefers-color-scheme` + `[data-theme]`). Nenhuma cor literal que só funcione num tema.
- **Celular primeiro:** deve funcionar em 375 px, sem rolagem horizontal, com gutter lateral de 16 px e áreas de toque de pelo menos 44 px.
- **Acessibilidade:** foco visível, navegação por teclado, contraste mínimo de 4,5:1 no texto, `aria-*` nos controles, respeito a `prefers-reduced-motion`.
- Movimento só onde ajuda a entender uma ação; nada decorativo que se repita.

## Verificações automáticas (`tools/`)

Depois de editar `index.html`, rode, dentro de `tools/`:

```bash
npm run check        # formato, sintaxe, CSS, HTML, 24 telas (375/768/1440 px × claro/escuro), console e acessibilidade
npm run lighthouse   # notas de desempenho, acessibilidade e boas práticas
```

- Na primeira vez: `npm install --ignore-scripts` dentro de `tools/`. Instruções completas em `tools/LEIA-ME.md`.
- `check` usa **dados fictícios** (`tools/seed.json`). Ele **não** verifica o banco real nem a gravação de dados; diga no `CHANGES.md` o que foi testado e o que não foi.
- `tools/` é só leitura, exceto para rodar esses comandos. A única fonte do site continua sendo `index.html`.
- Não publique com `check` em erro (código de saída 1).
- O repositório Git da pasta guarda o histórico: prefira `git diff` e `git log` a copiar arquivos para `versoes/`. Faça commit das suas mudanças com uma mensagem curta em português. `.gitignore` já exclui `_fora-do-site/` e `node_modules/`.

## Como registrar uma mudança

1. Antes de uma mudança grande, copie o `index.html` atual para `versoes/` com data e autor (ex.: `versoes/codex-2026-09-30-1400.html`).
2. Edite `index.html`.
3. Acrescente no topo de `CHANGES.md`: data, quem fez, o que mudou, por quê, e se algo foi testado ou só revisado.
4. Diga ao usuário: "pode pedir para o Claude publicar".

## O que o Claude faz ao publicar

Lê `CHANGES.md` e compara com a versão publicada, ajusta o formato do arquivo, testa a página (computador e celular, temas claro e escuro), confere os dados no banco e republica no mesmo link. O Claude não descarta a mudança do Codex sem avisar o usuário.

## Versões guardadas em `versoes/`

- `publicado-v2-claude.html`: a versão que estava no ar antes das mudanças do Codex.
- `base-antes-do-codex.html`: o ponto de partida usado pelo Codex.
- `codex-ajustes-ui-0033.html`: o resultado dos ajustes de interface do Codex, às 00:33 de 30/09/2026.
