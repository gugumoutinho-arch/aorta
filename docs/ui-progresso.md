# Progresso da rodada B (interface e movimento) — ramo `nuvem/ui-lapidacao`

Prompt: `docs/nuvem/rodada-b-interface.md` (ramo `prototipo-v4`, commit `69490d9`). Alvo: a DIREÇÃO D aprovada pelo dono (maquetes `docs/nuvem/direcao-d/*.dc.html` no `prototipo-v4`).

Quem retomar: leia esta lista, rode `cd tools && npm test && npm run check` e siga do primeiro pacote não concluído.

## Ponto de partida

- **Repositório:** `git rev-parse --show-toplevel` = `/home/user/aorta`. Este checkout Linux substitui `C:\claude e codexx`.
- **Remote:** `origin` = `https://github.com/gugumoutinho-arch/aorta`. Ao começar, o ramo era `nuvem/f1-conteudo` com o status limpo.
- **Rodada A:**
  - última linha "RODADA A ENCERRADA (com o complemento local) em 03/10/2026, SHA 0ad655f";
  - `git merge-base --is-ancestor 0ad655f origin/nuvem/f1-conteudo` → ancestral;
  - `git diff --stat 0ad655f..origin/nuvem/f1-conteudo` → só `docs/nuvem-progresso.md` (11 linhas).
- **Ramo:** `nuvem/ui-lapidacao`, criado do topo de `origin/nuvem/f1-conteudo`.
- **SHA base:** `d5fcad2`.

## Preflight (`node tools/ambiente.mjs`, saída em `tools/reports/ambiente/`)

- **Node e navegador:** Node v22.22.0; Chromium 141.0.7390.37 (`/opt/pw-browsers/chromium`).
  - O `npx playwright-core install` do prompt não foi rodado: este ambiente proíbe `playwright install` e já traz o Chromium.
  - Por isso, `CHROME_PATH=/opt/pw-browsers/chromium` e `CI=1`.
- **WebGL:** "ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero)))". WebGL2 funciona por software, sem GPU.
- **Captura PNG:** ok (308 KB, 1440×900).
- **Vídeo:** `recordVideo` gera `.webm` FINALIZADO depois de fechar o contexto (228 KB). Há `ffmpeg` em `/opt/pw-browsers/ffmpeg-1011` e em `/usr/bin/ffmpeg`.
- **Fontes:**
  - na 1ª tentativa, NÃO carregaram (`net::ERR_CERT_AUTHORITY_INVALID` em fonts.googleapis.com). O banco de certificados do navegador (`~/.pki/nssdb`) estava vazio, embora o README do proxy diga que vem configurado;
  - na 2ª tentativa, instalei o `certutil` (`libnss3-tools`) e registrei no NSS as CAs do proxy da nuvem que já estão em `/root/.ccr/ca-bundle.crt` (as "O = Anthropic"). A verificação TLS continua ligada; nada foi desligado;
  - depois disso, `document.fonts` mostra 16 faces e 3 carregadas na tela inicial, e os 4 pedidos de fonte (css2, Literata ×2, Schibsted) retornam ok.
  - **Consequência:** as capturas e o Lighthouse desta rodada TÊM as fontes reais e passam a ser comparáveis com o computador do dono, ao contrário da rodada A.
  - **Para retomar noutro contêiner:** a configuração é só deste contêiner (fora do repositório); refaça com `certutil -d sql:$HOME/.pki/nssdb -A -t "C,," -n <nome> -i <ca.pem>` para cada CA "O = Anthropic" do bundle.
- **Bateria G na base (`d5fcad2`):** ver abaixo.
