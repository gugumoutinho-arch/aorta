---
name: medleaf-design
description: Sistema visual e de movimento do MedLeaf (biblioteca de medicina em C:\claude e codexx). Use antes de desenhar, prototipar ou implementar qualquer interface do site, e ao revisar mudanças visuais. Traz paleta, tipografia, conceito Folhas, componentes, regras de movimento, camada WebGL, bibliotecas aprovadas com versões e SRI, e o que nunca pode quebrar.
---

# MedLeaf — sistema visual

Decisões do dono (02/10/2026). Regras gerais em `AGENTS.md` (seção "Direção MedLeaf"); produto em `PRODUCT.md`. Referência viva: `_fora-do-site/propostas-home/medleaf-folhas.html`.

## Conceito: Folhas
*Leaf* = folha de livro e folha de planta; *to leaf through* = folhear.
- Módulos e materiais são **folhas** que se folheiam (maço de cartas, orelha dobrada, papel).
- As **nervuras** da folha desenham a hierarquia: nervura central = curso; laterais = módulos; secundárias = unidades/matérias.
- A folha de planta aparece na marca e nas nervuras, nunca como enfeite solto (evitar cara de app de jardinagem).
- Sem clichê médico (estetoscópio, cruz, coração de ECG decorativo). O ECG só aparece como marca do tipo "Caso clínico".

## Paleta (tema escuro é o padrão)
| Token | Valor | Uso |
|---|---|---|
| `--night` | `#0f0b1a` | fundo |
| `--night-2` | `#1b1431` | superfícies elevadas |
| `--violet` | `#8b6cff` | ação principal, luz |
| `--violet-2` | `#c2b2ff` | destaque tipográfico, foco |
| `--leaf` | `#93e38a` | marca, fita de retomada, "Abrir" |
| `--cream` / `--cream-2` | `#f5efe3` / `#d9d1e6` | texto |
| `--mute` | `#b1a8c6` | texto secundário (contraste ≥ 4,5:1 no fundo) |
| `--paper` / `--paper-2` | `#f7f1e4` / `#ece3cf` | folhas de material |
| matérias | `--hema #a99dff`, `--eosin #ff8db5`, `--giemsa #79bcff`, `--masson #7fd892`, `--pas #e19af2`, `--safra #ffa46e` | cor por matéria/módulo |

Fundo: gradiente radial roxo no topo + grão estático sutil (opacidade ~0,06). Tema claro: precisa de desenho próprio (papel creme como fundo, roxo profundo como ação); nunca inverter cores automaticamente.

## Tipografia
- Literata (serifa): títulos, numerais de módulo (enormes, `letter-spacing:-.05em`), títulos de material.
- Schibsted Grotesk: interface, rótulos, metadados.
- Rótulos de seção: 12 px, caixa alta, `letter-spacing:.1em`, `--mute`.
- Itálico em roxo claro para a palavra de ênfase do título ("hoje?").

## Componentes
- **Folha de módulo** (`.leaf`): cor da matéria/módulo, orelha dobrada no canto superior direito, nervuras SVG ao fundo (opacidade ~0,2), numeral gigante, unidades, CTA "Folhear o Mx". Em produção: folha escura **opaca**, borda tracejada, texto "Em produção" — nunca translúcida (vaza conteúdo no maço).
- **Maço** (Swiper `effect:'cards'`): `perSlideOffset:10`, `perSlideRotate:3`, `slideShadows:false`, teclado e a11y ligados, botões anterior/próximo e chips M1–M8 sincronizados; contador "n / total" que rola.
- **Folha de material** (`.sheet`): papel creme, faixa da matéria com tipo + ícone, título completo (nunca cortar), assunto, situação, "Abrir original ↗". Variações: slides (faixa cheia), resumo (pautado), caso clínico (linha na faixa), livro (folha cheia na cor).
- **Folha marcada**: atalho "Continuar de onde parou" com fita verde.
- **Leque por tipo**: três folhas que se abrem ao passar/tocar.
- Busca: placa creme que levanta no foco; o exemplo digita assuntos **que existem no acervo**.

## Movimento (GSAP + Swiper)
- Toda animação tem função (entrar, abrir, folhear, confirmar, explicar estado). Sem loop infinito decorativo.
- Facilidades: entradas `expo.out` (0,7–1,1 s); transições de tela `expo.inOut` (0,6–0,8 s); resposta ao toque `back.out(2)` curta (≤ 0,5 s). Seguir ponteiro: `gsap.quickTo` (0,5–0,8 s, `power3`).
- Títulos: `SplitText` por caracteres com `mask:"words"`, `stagger` ~0,018.
- Abrir módulo: a folha cresce até a tela (transform, não width/height) e o conteúdo entra em cascata; fechar faz o caminho inverso e devolve o foco à folha.
- Animar só `transform`, `opacity`, `clip-path` (e `filter` raramente, nunca em listas).
- `gsap.matchMedia("(prefers-reduced-motion: no-preference)")` envolve tudo que anima; com movimento reduzido: troca instantânea, Swiper `speed:0`, sem tremer, sem seguir ponteiro.
- Vibração (`navigator.vibrate`) só curta (≤ 18 ms) e só em resposta a toque.

## Camada WebGL (Three.js)
- Carrega **depois** da primeira tela útil (dynamic import / `requestIdleCallback`), nunca bloqueia LCP.
- Sempre há versão sem WebGL (CSS/SVG) com a mesma navegação: falta de WebGL, aparelho fraco (`navigator.hardwareConcurrency <= 4` ou `deviceMemory <= 4`), economia de dados ou movimento reduzido.
- Canvas é decorativo/visual; a navegação real é HTML acessível por cima ou ao lado (links, botões, foco).
- Limitar pixel ratio a 2, pausar render quando a aba some ou o canvas sai da tela.

## Bibliotecas aprovadas (versão fixa)
| Biblioteca | Versão | Arquivo CDN (jsDelivr) | SRI |
|---|---|---|---|
| GSAP | 3.15.0 | `gsap@3.15.0/dist/gsap.min.js` | `sha384-XmJ9SoHtVOHoQUcKvFAzVXwdkKo1Ie3bhmSoIAkcdsHGaIrVJIkmozyq0FJeb/Ly` |
| SplitText | 3.15.0 | `gsap@3.15.0/dist/SplitText.min.js` | `sha384-SWJ0lLVRoipvHh59xj0pL7uC7Ih51F+5smaFtrG+2nr+TlDZU5SYJHmxfolbeNTr` |
| Flip | 3.15.0 | `gsap@3.15.0/dist/Flip.min.js` | `sha384-LY8cG/IUULu4u3V3AhwWBt01HIuO/hlekjkqgBx0DOJ/oquEL0Qk2L6qy+1QeRZM` |
| Swiper | 14.3.0 | `swiper@14.3.0/swiper-bundle.min.js` | `sha384-nimz5qRuF8SOYqiuzkhgKleYiz6jIj9pUhB/LlAAsbB6I3fI9v9s5RMwMTzEyOAY` |
| Three.js, Lenis | fixar ao adotar | — | calcular e registrar aqui |

Depois da migração para Vite, instalar pelo `npm` com as mesmas versões (lockfile) e remover os CDNs.

## Nunca quebrar
Teclado e foco visível; contraste 4,5:1; leitor de tela (canvas com alternativa); alvos ≥ 44 px; 375 px sem rolagem lateral (atenção: maço/pilhas não podem empurrar a página — usar `overflow-x:clip`); títulos completos; "O site guarda links"; dados reais vindos do banco (nunca inventar contagem, atividade ou recomendação); "Em produção" deduzido dos dados.

## Verificar
Capturas 375 e 1440, claro e escuro, movimento reduzido; Lighthouse celular (desempenho ≥ 85, acessibilidade e boas práticas 100); revisão pelo agente `medleaf-design-reviewer`.
