---
name: aorta-design
description: Sistema visual e de movimento do Aorta (acervo de medicina em C:\claude e codexx, domínio useaorta.com). Use antes de desenhar, prototipar ou implementar qualquer interface do site e ao revisar mudanças visuais. Traz paleta, tipografia, conceito coração-mapa, componentes, regras de movimento e do batimento, camada WebGL com o modelo HuBMAP, bibliotecas aprovadas com versões e SRI, referências e o que nunca pode quebrar.
---

# Aorta — sistema visual

## Refinamento v4 aprovado pelo dono em 02/10/2026

Estas decisões posteriores prevalecem sobre as referências anteriores abaixo:
- IDOMED mantém o coração-mapa por módulos. Medicina geral mostra o corpo por disciplinas; não distribuir o acervo geral em M1–M8. A troca é automática pelas abas do acervo.
- Corpo com órgãos HuBMAP, crédito visível, rótulos distribuídos em duas colunas e nomes completos. Os destinos são associações visuais, não limites anatômicos do conteúdo.
- Movimento menos mecânico: molas amortecidas no ponteiro, sem reiniciar a velocidade a cada evento; entradas de 320–720 ms com `power2/3.out`; controles de press seguem o gesto; mergulho curto, interrompível e sem destino atrasado. Não impor os easings elásticos antigos a todos os componentes.
- Movimento reduzido é dinâmico: ativá-lo durante entradas, voo ou mergulho encerra o movimento e conserva a navegação. Limpar recursos 3D ao trocar de acervo/tela.
- Refino de layout desta rodada: **sem referência externa nova**; derivado do V4 existente e da escolha explícita do dono. Aplicadas skills ECC `make-interfaces-feel-better` e `motion-patterns` com GSAP já aprovado, sem dependências novas.

Decisões do dono (02/10/2026). Regras gerais em `AGENTS.md` (seção "Direção Aorta"); produto em `PRODUCT.md`.
Protótipo de referência: `_fora-do-site/propostas-home/coracao-mapa.html`. Ele carrega `modelos/heart-hra-v1.3.glb`, então abra por um servidor local, nunca por `file://`.

## Conceito: coração-mapa
- **Aorta** é a artéria de onde o sangue sai para o corpo inteiro. O acervo é de onde o material sai para cada módulo.
- **Coração:** anatômico, translúcido ("raio-X" roxo e magenta), em vista anterior.
- **Artérias = módulos:** cada artéria percorre o traçado de uma coronária (descendente anterior, coronária direita, circunflexa, diagonais, marginais, cone…).
- **Unidades:** ramos menores, quando houver espaço.
- **Fluxo:** depois de cada batida, um pulso de luz corre **só** pelas artérias de módulos com material ("irrigados").
- **Em produção:** módulos sem material ficam tracejados e apagados, "ainda não irrigados". O texto "Em produção" continua visível.
- **Traçado:** as artérias são estilizadas, não anatomia para estudo. Isso fica dito na página, junto com o crédito do modelo.
- **Proibido:** coração de emoji, sangue realista, ECG decorativo, estetoscópio.

## Modelo 3D (crédito obrigatório)
- **Arquivo:** "3D Reference Organ for Heart, Male, v1.3", HuBMAP / Human Reference Atlas, a partir do Visible Human Male (National Library of Medicine). Licença **CC BY 4.0**.
- **Fonte oficial:** `https://cdn.humanatlas.io/digital-objects/ref-organ/heart-male/v1.3/assets/3d-vh-m-heart.glb` (cerca de 4 MB).
- **Crédito:** visível na página, com link para `https://humanatlas.io/3d-reference-library`.
- **Partes do modelo:** átrios, ventrículos, septo, valvas e músculos papilares. **Não há coronárias:** as artérias são desenhadas por nós, projetadas na superfície por raio.
- **Unidades e eixos:** metros, Y para cima, +Z anterior. O ápice aponta para +X (esquerda do paciente), para baixo e para frente.
- **Carga:** o GLB é lido por um leitor mínimo (sem extensões), sem precisar do GLTFLoader.

## Paleta (tema escuro é o padrão)
| Token | Valor | Uso |
|---|---|---|
| `--night` | `#0d0817` | fundo |
| `--night-2` | `#1a1030` | superfícies elevadas, painéis |
| `--violet` / `--violet-2` | `#8b6cff` / `#c9b8ff` | luz, foco, átrios |
| `--crimson` | `#ff4f7e` | ação principal, marca, fluxo |
| `--flow` | `#ff8fb0` | pulso de fluxo, ênfase do título |
| `--cream` / `--cream-2` | `#f6eee8` / `#ddd0e3` | texto |
| `--mute` | `#b4a6c4` | texto secundário (≥ 4,5:1 no fundo) |
| módulos | M1 `#b8a8ff`, M2 `#ff8fb0`; os demais usam as tintas por matéria (`--hema`, `--eosin`, `--giemsa`, `--masson`, `--pas`, `--safra`) | cor da artéria e do rótulo |

- **Fundo:** gradiente radial vinho e roxo, mais grão estático sutil (opacidade cerca de 0,06).
- **Coração:** shader de fresnel.
  - Átrios: base `#3a1f6e`, borda `#c9b8ff`.
  - Ventrículos: base `#4a1f5e`, borda `#ff8fb0`.
  - Valvas: aditivas e discretas (opacidade 0,2).
- **Tema claro:** desenho próprio, nunca inversão automática.

## Tipografia
- **Literata:** títulos, numerais grandes de módulo, títulos de material.
- **Schibsted Grotesk:** interface, rótulos e metadados.
- **Título da home:** "O que você vai estudar *hoje?*", com a ênfase em itálico na cor `--flow`.
- **Rótulos de seção:** 12 px, caixa alta, `letter-spacing:.1em`, cor `--mute`.

## Componentes
- **Rótulos de módulo:** **botões HTML reais** sobre o canvas, presos à ponta da artéria e empilhados por lado sem sobreposição, dentro da área do mapa (`overflow:hidden`).
- **Resumo do módulo:** folha inferior no celular, cartão à direita no computador. Traz o numeral grande, a artéria ("Pelo traçado da descendente anterior"), as unidades, as matérias com material e a ação "Abrir o Mx".
- **Busca:** placa creme com botão carmim. O exemplo digita assuntos **que existem no acervo**.
- **Retomada:** "Continuar de onde parou", com a fita carmim.
- **Lista e folhas de material:** reaproveite `medleaf-folhas.html` (maço Swiper e folhas de papel), recolorido para a paleta Aorta.
- **Sem WebGL:** a mesma navegação vira uma lista de botões com borda na cor do módulo.

## Movimento (GSAP + Three.js)
- **Regra geral:** toda animação tem função (entrar, abrir, confirmar, mostrar fluxo). A **única** exceção ao "sem loop" é o batimento de repouso.
- **Batimento "lub-dub":**
  - os átrios contraem 5% em cerca de 0,12 s;
  - os ventrículos contraem 6,5% entre 0,16 e 0,30 s e voltam com `elastic.out`;
  - o fluxo corre pelas artérias irrigadas em cerca de 1,1 s.
- **Batimento de repouso:** a cada cerca de 2,6 s, com 45% da força. Pausa fora da tela (IntersectionObserver) e com a aba escondida.
- **Ao apontar ou focar um módulo:** batida mais forte e fluxo naquela artéria.
- **Ao abrir um módulo:** a câmera se aproxima. No celular, só um pouco, porque o painel cobre a parte de baixo.
- **Easings:**
  - entradas: `expo.out`;
  - transições: `expo.inOut` (0,6–1,1 s);
  - toque: `back.out(2)` (≤ 0,5 s);
  - seguir o ponteiro: interpolação de cerca de 0,075 por quadro.
- **Títulos:** `SplitText` por caracteres, com `mask:"words"`.
- **Desenho sob demanda:** só quando há movimento, tween ou batida.
- **Movimento reduzido:** coração estático, sem batida, sem fluxo e sem seguir o ponteiro; trocas instantâneas.

## Camada WebGL
- **Carregamento:** depois da primeira tela útil (`requestIdleCallback`). Nunca bloqueia o LCP.
- **Versão sem WebGL:** obrigatória quando falta WebGL, quando `deviceMemory <= 2` ou com economia de dados.
- **Limites:** pixel ratio no máximo 2; canvas com `aria-hidden`; a navegação real é o HTML.

## Bibliotecas aprovadas (versão fixa)
| Biblioteca | Versão | Arquivo CDN (jsDelivr) | SRI |
|---|---|---|---|
| GSAP | 3.15.0 | `gsap@3.15.0/dist/gsap.min.js` | `sha384-XmJ9SoHtVOHoQUcKvFAzVXwdkKo1Ie3bhmSoIAkcdsHGaIrVJIkmozyq0FJeb/Ly` |
| SplitText | 3.15.0 | `gsap@3.15.0/dist/SplitText.min.js` | `sha384-SWJ0lLVRoipvHh59xj0pL7uC7Ih51F+5smaFtrG+2nr+TlDZU5SYJHmxfolbeNTr` |
| Flip | 3.15.0 | `gsap@3.15.0/dist/Flip.min.js` | `sha384-LY8cG/IUULu4u3V3AhwWBt01HIuO/hlekjkqgBx0DOJ/oquEL0Qk2L6qy+1QeRZM` |
| Swiper | 14.3.0 | `swiper@14.3.0/swiper-bundle.min.js` | `sha384-nimz5qRuF8SOYqiuzkhgKleYiz6jIj9pUhB/LlAAsbB6I3fI9v9s5RMwMTzEyOAY` |
| Three.js (módulo) | 0.186.1 | `three@0.186.1/build/three.module.min.js` | `sha384-EU5UWigB3OuXjAXooUegndJSqYber3YSJHDoMZs6rV96yY/ol/B4W8logw4CKWkA` |
| Three.js (núcleo) | 0.186.1 | `three@0.186.1/build/three.core.min.js` | `sha384-ktZslgpl0L71WZcQ5wKV96Z04i9QSjtmiU/kYpjDQSfJ5NJ8B79qDF63oNTbQySl` |
| Lenis | fixar ao adotar | — | calcular e registrar aqui |

- **Three.js:** o módulo importa `./three.core.js`. No mapa de importação, redirecione essa URL para `three.core.min.js` e declare as duas em `integrity`.
- **Depois da migração para Vite:** instale pelo `npm` com as mesmas versões (lockfile) e remova os CDNs.

## Referências de interface
O quadro comentado fica em `_fora-do-site/referencias/`. Cada decisão de layout deve citar de qual referência veio, ou dizer "sem referência".

## Nunca quebrar
- Teclado e foco visível.
- Contraste de 4,5:1.
- Leitor de tela: o canvas tem alternativa em HTML.
- Alvos de pelo menos 44 px.
- 375 px sem rolagem lateral: use `overflow-x:clip` e não deixe mapa, maço ou rótulos empurrarem a página.
- Títulos completos.
- "O site guarda links".
- Dados reais vindos do banco: nunca inventar contagem, atividade ou recomendação.
- "Em produção" deduzido dos dados.
- Crédito do modelo 3D visível.

## Verificar
- Capturas em 375 e 1440 px, nos temas claro e escuro, com movimento reduzido e sem WebGL.
- Lighthouse no celular: desempenho ≥ 85; acessibilidade e boas práticas 100.
- Revisão pelo agente `aorta-design-reviewer`.
