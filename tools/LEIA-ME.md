# Verificações do site (tools/)

Ferramentas para conferir o Aorta **sem precisar do banco real**. Cada comando monta o site com o Vite (`../dist/`), serve localmente com um banco fictício (`seed.json`, injetado como `window.claude.use("db")`) e usa o Chrome já instalado no computador.

## Primeira vez
```bash
cd ..   && npm install                     # dependências do site (Vite, Three, GSAP, Supabase)
cd tools && npm install --ignore-scripts   # dependências das verificações
```

## Depois de editar o site
```bash
npm run check        # build, regras do projeto, CSS, HTML, telas em 375/768/1440 px nos temas claro e escuro, console e acessibilidade (axe)
npm run lighthouse   # notas de desempenho, acessibilidade e boas práticas (celular e computador)
node flows.mjs       # fluxos completos, coração 3D por WebGL de software, interrupções e estados de falha
```

Saída: `tools/reports/summary.md`, capturas em `tools/reports/shots/` e `tools/reports/flows/`. `check` e `flows` terminam com erro (código 1) se algo falhar.

`node arterias.mjs` refaz `../src/heart/arteries.json` (traçado das artérias sobre o modelo). Só é preciso quando um caminho mudar em `../src/core/arteries.js`.

## O que NÃO verifica
- O banco real (Supabase): login, regras de acesso e o catálogo de verdade. Os testes nunca tocam nele.
- Se a página publicada abre na conta do dono.
- Aparelho físico: o celular é emulado; Safari/iPhone e GPU de verdade ficam para teste manual.
- A qualidade das animações: capturas mostram estados, não movimento.

## Quem usa
- **Codex e Claude** rodam `npm run check` e `node flows.mjs` antes de dizer que terminaram e colocam o resultado no `CHANGES.md` (o que foi testado e o que não foi).
