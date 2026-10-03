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
| N2 · Formulário com assuntos | concluído | `80bc24c` |
| N3 · Quase-duplicatas | concluído | `771470f` |
| N4 · Importação por colagem | concluído | `6299ca4`, correções da revisão em `0beab8b` |
| N5 · Cardiologia → coração | concluído | `e60e5e3` |
| N6 · Trocas rápidas instáveis | concluído | `57f77e6` |
| N7 · Desempenho da primeira tela | tentado e revertido (meta não atingida) | `368fce2` → `128067b` |

### N1 · Gravar assuntos e ligações

- **Comandos e resultados:** `npm test` 49/49 (34 da base + 15 novos), `check` 0 erros e 0 avisos, `flows` 364/364, `acervos` 67/67, `topics` 57/57, `topic-edit` 5/5.
- **Prova de que o teste pega o defeito:** com o `actions.js` antigo, o e2e reprova em "Desfazer: material e as duas ligações de volta" (espera de 5 s estourada).
- **Pendências:** criar, ligar e desligar pela interface entram no e2e do N2, que traz o formulário. Nesta etapa, essas ações têm teste de unidade nas duas pontas do banco.

### N3 · Quase-duplicatas

- **Comandos e resultados:** `node --test tests/similar.test.mjs` 7/7 (reprovou com "módulo não encontrado" antes da implementação); `npm test` completo 56/56. `check`, `flows`, `acervos`, `topics` e `topic-edit` da bateria do N1 rodaram já com `similar.js` presente, que nada importa.
- **Pendências:** confirmar com o dono "inf." e o veto de algarismos romanos.

### N2 · Formulário com assuntos

- **Resultados:** `npm test` 56/56; `check` 0/0; `flows` 364/364; `topics` 57/57; `topic-edit` 46/46. O e2e reprovou antes de o formulário ser ligado.
- **`acervos`:** reprovou em "320 dark idomed … rótulos sobrepostos". O teste já era instável antes do N2; correção no N6.
- **Lighthouse:** celular 95/93, computador 100/100, acessibilidade 100. Boas práticas 96 só pelo certificado das fontes no proxy da nuvem.
- **Revisão de design:** 0 bloqueantes; 3 importantes corrigidos (salvar durante a criação, foco, falha visível).
- **Pendências:** contraste da borda `--line-strong` (2,1 a 2,3:1), que é decisão de identidade do dono.
- **Ambiente:** o Chrome daqui não confia no certificado do proxy para fonts.googleapis.com; as fontes caem no padrão do sistema e o Lighthouse marca 96 em boas práticas.

### N4 · Colar links

- **Bateria (`6299ca4`):** `npm test` 74/74; `check` 0/0; `flows` 364/364; `acervos` 67/67; `topics` 57/57; `topic-edit` 46/46; `import` 38/38. Lighthouse 94/94 e 100/100; boas práticas 96 (ambiente).
- **Revisão de design:**
  - 1 bloqueante, corrigido em `0beab8b`: "ligar" a duplicata mudava um material publicado sem dizer;
  - 8 importantes, corrigidos;
  - `import` 44/44 depois das correções.
- **Limite:** os direitos não ficam guardados no material, porque `materials` não tem a coluna e a migração precisa do dono.

### N5 · Cardiologia → coração

- `routes.test` 6/6; `npm test` 80/80; `check` 0/0. O `acervos` desse commit caiu na corrida dos rótulos (corrigida no N6). Captura com uma Cardiologia fictícia: rótulo "Coração" e ponta no peito; página do módulo com o coração 3D.

### N6 · Trocas rápidas

- **Antes:** roteiro focado com 1/30, 2/40 e ≥ 1/11 falhas; `acervos` com 1/10.
- **Depois:** roteiro focado 0/60; `acervos` 10/10 no teste-alvo.
- **Ainda instável:** "botão fica pressionado até soltar", 1 em 10 depois da correção parcial.
- **Bateria do commit:** toda verde, exceto Lighthouse boas práticas 96 (ambiente).

### N7 · Desempenho (extra)

- **6 pares de `medir-v5` e 5 rodadas de métricas de layout:** layouts −70%, tempo de layout quase igual; a maior tarefa da IDOMED não melhorou (mediana pior, variação enorme). Lighthouse igual (94/94).
- **Revertido pela regra do pacote.** Próximo passo sugerido: atacar o carregamento e a montagem do coração 3D (é a maior tarefa).

## Bateria final (`9594add`, cópia isolada)

- `npm test` 80/80; `check` 0 erros e 0 avisos; `flows` 364/364; `acervos` 67/67; `topics` 57/57; `topic-edit` 46/46; `import` 44/44.
- Lighthouse (mediana de 3): celular 94 (IDOMED) e 94 (geral), computador 100/100, acessibilidade 100. Boas práticas 96: o único erro de console é `ERR_CERT_AUTHORITY_INVALID` nas fontes do Google, porque o proxy da nuvem intercepta o certificado. No CI do GitHub não acontece.

## Pendências abertas

- **SQL para autorizar:** nenhum. Nada exigiu mudar o banco nem as regras de acesso.
- **Direitos:** `materials` não tem coluna de direitos; os direitos do rascunho só decidem se pode publicar. Guardá-los exigiria uma migração, decisão do dono.
- **Instabilidade ainda aberta em `acervos.mjs`:** "botão fica pressionado até soltar", 1 em 10 rodadas depois da correção parcial. Não reproduz isolada (0 em 30).
- **Contraste da borda `--line-strong` (1,9 a 2,3:1) em campos e fichas:** decisão de identidade.
- **N3:** confirmar "inf." como abreviação aprovada e o veto de algarismos romanos.
- **N7:** revertido; o peso real da entrada é a montagem do coração 3D.
- **Demonstração:** `cd tools && node demo.mjs --abas` (assuntos e colagem); `node demo.mjs --v4 --cardio` (Cardiologia no corpo).

---

# RODADA A (funcional) — prompt `docs/nuvem/rodada-a-funcional.md`

- **Repositório:** `/home/user/aorta` (checkout Linux no lugar de `C:\claude e codexx`); remote `origin` = `https://github.com/gugumoutinho-arch/aorta`; ramo `nuvem/f1-conteudo`; status limpo ao começar.
- **Retomada:** o ramo existia no remoto (`1cda9d7`) e descende do `prototipo-v4` antigo (`63e6004`). O `prototipo-v4` atual (`4b6f838`, que inclui `afef4f6`) entrou por merge (`7303e51`), sem recriar e sem force.
- **SHA base da rodada A:** `4b6f838` (`origin/prototipo-v4` depois do fetch).

## Preflight

- Node v22.22.0; Chromium 141 (`/opt/pw-browsers/chromium`; o `chromium-1243` que o playwright-core 1.63 espera não existe e o ambiente proíbe `playwright install`, então `CHROME_PATH=/opt/pw-browsers/chromium`).
- O Chromium abre; WebGL2 por SwiftShader (ANGLE/Vulkan) funciona; captura PNG funciona.
- **Fontes não carregam:** 0 fontes carregadas; o proxy da nuvem recusa o certificado do Google Fonts. O `document.fonts.check` diz "sim" só porque não há `@font-face`. **Capturas e Lighthouse NÃO são comparáveis** com os do computador do dono; nada de tipografia ou de gate foi mudado por isso.
- **Bateria G no preflight (`7303e51`):** `npm test` 80/80; `check` 0/0; `flows` 364/364; `acervos` 67/67; `topics` 57/57; `topic-edit` 46/46; `import` 44/44. Lighthouse (mediana de 3): celular 94/94, computador 100/100, acessibilidade 100, boas práticas **96** (só o erro de certificado das fontes; não comparável).

| Pacote (rodada A) | Situação | Commit |
|---|---|---|
| N6 · trocas rápidas e botão | concluído | (este) |
| N1 · assuntos, ligações e rascunhos nas duas pontas | a fazer | |
| N3 · quase-duplicatas | a fazer | |
| N2 · formulário com assuntos | a fazer | |
| N4 · colagem | a fazer | |
| N5 · Cardiologia → coração | a fazer | |

### A · N6

- Trocas rápidas 0/10; botão sob CPU 6×: regra antiga 2/10 falhas, regra nova 10/10; `acervos` 67/67 em 3/3.
