# Verificações do site (tools/)

Ferramentas para conferir o `index.html` **sem precisar do banco real**. Usam dados fictícios (`seed.json`) e o Chrome já instalado no computador.

## Primeira vez
```bash
cd tools
npm install --ignore-scripts
```

## Depois de editar o index.html
```bash
npm run check        # formato, sintaxe, CSS, HTML, telas em 375/768/1440 px nos temas claro e escuro, erros de console e acessibilidade (axe)
npm run lighthouse   # notas de desempenho, acessibilidade e boas práticas (celular e computador)
```

Saída: `tools/reports/summary.md` e capturas de tela em `tools/reports/shots/`. O comando `check` termina com erro (código 1) se achar algo grave.

## O que NÃO verifica
- O banco real do Artifact (materiais, áreas, coleções do usuário). Só o Claude consegue conferir isso, depois de publicar.
- Se a página publicada abre na conta do usuário.
- Fluxos de gravação (cadastro, edição, remoção): a página de teste usa um banco fictício em memória.

## Quem usa
- **Codex e Claude** rodam `npm run check` antes de dizer que terminaram e colocam o resultado no `CHANGES.md` (o que foi testado e o que não foi).
- Esta pasta é só leitura para o Codex, exceto para rodar os comandos acima: a única fonte do site continua sendo `../index.html`.
