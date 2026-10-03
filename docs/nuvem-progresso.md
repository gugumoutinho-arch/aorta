# Progresso da sessão na nuvem (ramo `nuvem/f1-conteudo`)

Base: `prototipo-v4` em `63e6004`. Quem retomar: leia esta lista, rode a bateria G (abaixo) e siga do primeiro pacote não concluído.

Bateria G (dentro de `tools/`, com `CHROME_PATH` apontando para o Chromium e `CI=1`): `npm test`, `npm run check`, `npm run flows`, `npm run acervos`, `npm run topics`, `npm run topic-edit` e, nos pacotes visuais, `npm run lighthouse`.

Ambiente da nuvem: o Chromium está em `/opt/pw-browsers/chromium` (não precisa de `playwright install`). As fontes do Google falham por certificado do proxy (`net::ERR_CERT_AUTHORITY_INVALID`); `check` e `flows` já ignoravam esse erro, e `topics.mjs` passou a ignorar também.

## Base antes de qualquer mudança

- `npm test` 34/34; `npm run check` 0 erros e 0 avisos; `npm run flows` 364/364; `npm run acervos` 67/67.
- `npm run topics`: reprovou só em "sem erros no console" por causa das fontes (ver acima); as 18 verificações anteriores passaram.

## Pacotes

| Pacote | Situação | Commit |
|---|---|---|
| N1 · Gravar assuntos e ligações | concluído | `746ab39` |
| N2 · Formulário com assuntos | a fazer | |
| N3 · Quase-duplicatas | concluído | (este) |
| N4 · Importação por colagem | a fazer | |
| N5 · Cardiologia → coração | a fazer | |
| N6 · Trocas rápidas instáveis | a fazer | |
| N7 · Desempenho da primeira tela | extra | |

### N1 · Gravar assuntos e ligações

- **Comandos e resultados:** `npm test` 49/49 (inclui os 7 do N3, já escritos), `check` 0 erros e 0 avisos, `flows` 364/364, `acervos` 67/67, `topics` 57/57, `topic-edit` 5/5.
- **Prova de que o teste pega o defeito:** com o `actions.js` antigo, o e2e reprova em "Desfazer: material e as duas ligações de volta" (espera de 5 s estourada).
- **Pendências:** criar, ligar e desligar pela interface entram no e2e do N2, que traz o formulário. Nesta etapa, essas ações têm teste de unidade nas duas pontas do banco.

### N3 · Quase-duplicatas

- **Comandos e resultados:** `node --test tests/similar.test.mjs` 7/7 (reprovou com "módulo não encontrado" antes da implementação).
- **Pendências:** confirmar com o dono "inf." e o veto de algarismos romanos.
