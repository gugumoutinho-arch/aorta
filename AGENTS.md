# Aorta — instruções para agentes (Codex e Claude)

O Aorta é um acervo de **links** de materiais de medicina (Google Drive) organizado como o curso: módulo › unidade › matéria › assunto, em português do Brasil. Desde 02/10/2026 é um **projeto Vite** com vários arquivos (antes era um fragmento único `index.html`; essa versão está em `versoes/claude-2026-10-02-antes-vite.html`).

## Onde as coisas moram

| O quê | Onde | Quem mexe |
|---|---|---|
| Código do site | `C:\claude e codexx`: `index.html` (documento completo), `src/` (JS e CSS), `public/` (modelo 3D), no repositório Git desta pasta | Codex e Claude |
| Site no ar | GitHub Pages: a cada envio para `main`, `.github/workflows/pages.yml` roda `npm ci` + `npm run build` e publica `dist/` | ninguém à mão: o envio publica |
| Catálogo (materiais, áreas, coleções) | Supabase, projeto `biblioteca-medicina` (id `rmqfduksayyplucshqea`, região São Paulo) | Codex e Claude, pelo conector/CLI do Supabase |
| Versão antiga | Artifact do claude.ai `https://claude.ai/artifact/USKSVw9fxkbnsSqWkePCYs`, com o banco do Artifact | congelada; não é mais a fonte do catálogo |

Os agentes **não** têm acesso ao conteúdo dos arquivos do Drive; o catálogo guarda só os links e os metadados.

## Direção Aorta (decidida pelo dono em 02/10/2026; vale acima das regras antigas de identidade, movimento e dependências)

- **Refino v4, decisão posterior do dono (02/10/2026):** IDOMED usa o coração e a estrutura de módulos; Medicina geral usa o corpo e disciplinas, sem impor M1–M8. O mapa acompanha o acervo automaticamente, inclusive em links diretos. O antigo parâmetro `?conceito=` não substitui essa decisão. Corpo/órgãos são associações visuais para navegar, não uma classificação anatômica das disciplinas. Trabalho no ramo `prototipo-v4`, prévia com `node tools/demo.mjs --v4` (executar de `tools/`: `node demo.mjs --v4`), sem publicação.
- **Movimento v4:** o gesto prevalece sobre animações pendentes. Ponteiro com mola amortecida e repouso sem frames; press acompanha pressionar/soltar; mergulho cancelável por Esc ou outra navegação. Transforms de posicionamento dos rótulos não são alvos de entradas. Trocar a preferência para movimento reduzido durante uma animação também deve encerrá-la.

O site passa a se chamar **Aorta** (domínio pretendido: `useaorta.com`): um acervo aberto e visualmente ambicioso para estudantes de medicina (ver `PRODUCT.md`). A artéria de onde o sangue sai para o corpo inteiro é o acervo de onde o material sai para cada módulo. As prioridades mudaram de "discreto e leve" para **"lindo, marcante e ainda rápido de usar"**. (Nomes anteriores descartados: MedLeaf, Purkinje.)

- **Identidade:** noite arroxeada como fundo, roxo e magenta como luz, carmim como ação e fluxo, creme no texto. Conceito **coração-mapa**: um coração anatômico translúcido (modelo HuBMAP, CC BY 4.0, com crédito visível) em que cada artéria é um módulo; o fluxo de luz bombeado só chega aos módulos com material; módulos sem material ficam "ainda não irrigados" ("Em produção"). Nada de coração de emoji, sangue realista ou ECG decorativo; as artérias desenhadas são traçado estilizado, não anatomia para estudo, e isso fica dito na página. Tema escuro é o padrão; o claro continua obrigatório e precisa ser desenhado. Literata + Schibsted Grotesk continuam.
- **Movimento é protagonista, sempre com função:** cada animação explica navegação, estado ou resposta ao toque (entrar, abrir, confirmar, mostrar o fluxo). Nada de loop decorativo infinito, **com uma exceção**: o batimento de repouso do coração, lento e discreto, que pausa fora da tela e com a aba escondida. Com `prefers-reduced-motion`, tudo funciona sem animação (troca instantânea ou esmaecimento curto).
- **Dependências aprovadas** (versão fixa; no navegador por CDN com SRI, ou pelo `npm` depois da migração para Vite): GSAP (com SplitText, Flip, ScrollTrigger), Swiper, Three.js e Lenis. Qualquer outra biblioteca precisa de pedido explícito do dono e deve ser registrada aqui e em `CHANGES.md`.
- **Desempenho ("rico, mas rápido para chegar"):** a primeira tela útil (marca, título, busca e as folhas dos módulos) precisa aparecer em menos de 2,5 s num celular médio em 4G (LCP < 2,5 s, CLS < 0,1, INP < 200 ms). WebGL, shaders e efeitos pesados carregam **depois** da primeira tela, por cima dela, e têm versão mais simples para aparelho fraco, falta de WebGL ou movimento reduzido. O Lighthouse deixa de exigir 100; desempenho mínimo de 85 no celular, acessibilidade e boas práticas continuam 100.
- **O que não muda:** acessibilidade (teclado, foco visível, contraste 4,5:1, leitor de tela, alvos de 44 px, 375 px sem rolagem lateral), honestidade da interface (links, não arquivos), regras do banco e das chaves, um agente editando por vez, registro em `CHANGES.md`.
- **Arquitetura:** projeto **Vite** (migração feita em 02/10/2026). Ver "O projeto" abaixo.
- **Revisão de design:** antes de cada commit de interface, rode o agente `aorta-design-reviewer` (`.claude/agents/aorta-design-reviewer.md`) e siga a skill `aorta-design` (`.claude/skills/aorta-design/SKILL.md`). O Codex lê as mesmas regras nesses arquivos.
- **Protótipos:** propostas visuais ficam em `_fora-do-site/propostas-home/` e não são o site. Cópias versionadas de todos os protótipos (coração-mapa, home v2, v3 do Codex, MedLeaf) estão em `versoes/prototipos-2026-10-02/` para consulta ou volta atrás.

## O projeto (leia antes de editar qualquer coisa)

| Caminho | O que é |
|---|---|
| `index.html` | Documento completo: `<head>` (meta `noindex`, fontes, bootstrap síncrono do tema) e a marcação de todas as telas |
| `src/main.js` | Entrada: liga as telas, abre o banco, assina as coleções |
| `src/app.js` | Rotas (`#inicio`, `#todos`, `#a-<área>`, `#organizar`) e `renderAll()` |
| `src/core/` | Estado (`state.js`), DOM (`dom.js`), texto e busca (`text.js`), estrutura do curso (`areas.js`), artérias (`arteries.js`), banco (`db.js`), gravações (`actions.js`) |
| `src/views/` | Telas: início (`home.js`), coração-mapa (`map.js`), página do módulo (`module.js`), folhas (`cards.js`), ficha (`detail.js`), busca Ctrl/⌘+K (`palette.js`), formulário (`form.js`), Organizar (`organize.js`), estados do banco (`banner.js`) |
| `src/heart/` | Coração 3D (Three.js): `heart.js`, leitor de GLB (`glb.js`), geometria (`geometry.js`) e traçado pré-calculado (`arteries.json`, gerado por `node tools/arterias.mjs`) |
| `src/styles/` | CSS: `tokens.css` (todas as cores, temas escuro e claro), `base.css`, `home.css`, `module.css`, `dialogs.css`, `organize.css` |
| `public/modelos/` | Modelo HuBMAP (`heart-hra-v1.3.glb`, CC BY 4.0) |

- **Comandos** (na pasta do projeto): `npm install` na primeira vez; `npm run dev` (prévia em http://localhost:4173 com recarga automática); `npm run build` (gera `dist/`); `npm run preview` (serve o `dist/` em http://localhost:4174).
- **Gerados, não editar à mão:** `dist/`, `node_modules/`, `tools/reports/`, `src/heart/arteries.json` (só pelo script).
- **Ignorar:** `versoes/` (cópias antigas, só leitura) e `_fora-do-site/` (materiais de estudo e ferramentas, fora do site).
- **Dependências** só pelo `npm`, com versão exata no `package.json` (sem `^`): `three`, `gsap`, `@supabase/supabase-js`; `vite` como ferramenta. Nada de script externo por CDN; estilos externos só do Google Fonts.
- **Histórico:** use `git diff` e `git log`; faça commit com mensagem curta em português. Antes de uma mudança grande, um backup em `versoes/` continua permitido.
- **Confira o caminho:** se a sua pasta de trabalho não for `C:\claude e codexx`, pare e avise o usuário.
- **Nunca editem ao mesmo tempo.** Um agente por vez. Quem terminar registra em `CHANGES.md` e faz commit.

## Banco de dados

`src/core/db.js` tem **duas pontas com a mesma interface** (`collection`, `doc`, `onSnapshot`, `set`, `update`, `delete`):

- `window.claude.use("db")`: usada pelos testes em `tools/`, que injetam um banco fictício (o Artifact antigo do claude.ai está congelado).
- No site: Supabase, pela função `supaDb()`, que traduz os campos do site (camelCase) para as colunas do banco (snake_case). A biblioteca do Supabase só é baixada quando essa ponta é usada.

Tabelas no Supabase (não renomeie sem pedir ao usuário):

- `materials`: `id`, `title`, `url`, `area_id`, `subject`, `period`, `type`, `tags[]`, `collection_ids[]`, `source`, `notes`, `status` (`nao-iniciado` | `em-estudo` | `revisado`), `favorite`, `created_at`, `last_opened_at`, `status_at`
- `areas`: `id`, `name`, `parent_id` (vazio = módulo), `sort_order`, `stain`, `short`, `created_at`
- `collections`: `id`, `name`, `created_at`

Regras:

- **Acesso:** as regras do banco (RLS) só deixam ler e gravar os e-mails do dono, conferidos na função `private.is_librarian()`. Não afrouxe essas regras e não copie os e-mails para o código do site.
- **Chaves:** o código do site só pode conter a chave **pública** (`sb_publishable_…`, em `src/core/db.js`). Nunca coloque a chave secreta do servidor, senhas ou tokens no repositório (o `check` procura por elas).
- **Mudanças de estrutura** (colunas, tabelas, regras) só com pedido do usuário, por migração no Supabase, e registradas em `CHANGES.md`.
- **Não invente registros.** Alterar o catálogo (criar, editar, apagar materiais) só quando o usuário pedir.
- **Honestidade da interface:** a página guarda **links**, não arquivos, e não sincroniza com o Drive. Nada de botões que aparentem importar, sincronizar, enviar arquivos ou buscar dentro dos documentos.
- **Remover do catálogo nunca apaga o arquivo original.** Manter o aviso e o "Desfazer".

## Regras técnicas

- Nada de `alert()`, `confirm()`, `prompt()`, `window.print()`, downloads por `<a download>` nem iframes de outros sites.
- **Cores só por tokens** em `:root`, com versões clara e escura (`prefers-color-scheme` + `[data-theme]`).
- **Celular primeiro:** 375 px sem rolagem horizontal, gutter lateral de 16 px, áreas de toque de pelo menos 44 px.
- **Acessibilidade:** foco visível, teclado, contraste mínimo de 4,5:1, `aria-*` nos controles, respeito a `prefers-reduced-motion`.
- Movimento: ver "Direção Aorta" (protagonista, sempre com função, com versão sem animação). GSAP para transições; nada de tween empilhado (`overwrite`/`killTweensOf`).
- Identidade visual **implementada** (desde 02/10/2026): Aorta / coração-mapa, a partir da v3 do Codex (ver `DESIGN.md` e a skill `aorta-design`). Mudanças de identidade só com pedido do usuário.
- **Desempenho do coração:** o 3D só começa depois do `load` e com o navegador ocioso; as etapas pesadas devolvem a vez ao navegador; o traçado das artérias vem pré-calculado. Sem WebGL, com movimento reduzido ou em aparelho econômico, fica o mapa em linhas (SVG), que é a base sempre presente.

## Verificações automáticas (`tools/`)

Depois de editar o site, rode dentro de `tools/` (cada comando monta o `dist/` com o Vite antes):

```bash
npm run check        # build, regras do projeto, CSS, HTML, 24 telas (sem WebGL), console e acessibilidade
npm run lighthouse   # desempenho (mínimo 85 no celular), acessibilidade e boas práticas (100)
node flows.mjs       # fluxos: coração-mapa, módulo, ficha, favorito, situação, remover/Desfazer, busca, tema, estados de falha, 3D (WebGL por software), interrupções, alvos de 44 px
```

- Na primeira vez: `npm install` na pasta do projeto e `npm install --ignore-scripts` dentro de `tools/`.
- Os testes usam **dados fictícios** (`tools/seed.json`) pela ponta `window.claude`; não tocam no Supabase. Diga no `CHANGES.md` o que foi testado e o que não foi (celular emulado não é aparelho; capturas não provam a qualidade das animações).
- Não envie para `main` com `check` em erro: o envio publica o site.

## Como registrar uma mudança

1. Edite o código em `index.html`, `src/` ou `public/` (ou, com pedido do usuário, a estrutura do banco).
2. Rode as verificações.
3. Acrescente no topo de `CHANGES.md`: data, quem fez, o que mudou, por quê, o que foi testado.
4. Faça commit. O envio para `main` publica o site.
