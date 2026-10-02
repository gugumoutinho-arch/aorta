# Plano para a próxima sessão — Aorta (escrito em 02/10/2026)

## Onde paramos
- **Nome:** Aorta. Domínio pretendido `useaorta.com`; vale registrar também `aorta.study`. Antes de comprar, busca no INPI.
- **Direção aprovada:** coração-mapa.
  - Protótipo da home: `_fora-do-site/propostas-home/aorta-home.html`.
  - Quadro de referências: `_fora-do-site/referencias/quadro.html`.
- **Regras no repositório:**
  - `AGENTS.md`, seção "Direção Aorta";
  - skill `.claude/skills/aorta-design/`;
  - revisor `.claude/agents/aorta-design-reviewer.md`;
  - commits locais `abbdd57`, `6d14379`, `419636f`. Nada foi publicado.
- **Para ver os protótipos:** subir os servidores locais (prévias do site nas portas 4173 e 4174; protótipos na porta 4175), porque o modelo 3D não abre por `file://`.

## O que rodar amanhã, em ordem

### 1. Dez minutos de decisões do dono
- Gostou da home v2? O que mudar?
- O tema claro fica para depois da migração?
- Registrar o domínio?

### 2. Desenhar as telas que faltam (protótipo, mesma linguagem)
- **Página do módulo:**
  - cabeçalho com o numeral e a artéria ("Art. 01 · descendente anterior");
  - unidades como abas;
  - matérias em grade fina (Linear);
  - materiais como folhas de papel recoloridas;
  - transição em que a câmera entra pela artéria até a página.
- **Ficha do material:** título completo, onde fica, situação e favorito, "Abrir original", e o aviso de que o site guarda links.
- **Tema claro** desenhado (papel creme, artérias vinho).
- Mostrar ao dono antes de seguir.

### 3. Migração para Vite (aprovada)
- **Estrutura:** projeto com `index.html` mais `src/` (estilos, cena 3D, dados, telas), e o modelo em `public/modelos/`.
- **Dependências:**
  - GSAP, Swiper e Three pelo `npm`, com as versões fixadas da skill;
  - remover os CDNs.
- **Preservar intactos:**
  - Supabase e `supaDb()`;
  - login e RLS;
  - busca por metadados;
  - favoritos e situação;
  - remover com aviso e Desfazer;
  - "Em produção" deduzido dos dados.
- **Publicação:** atualizar o GitHub Pages (`.github/workflows/pages.yml`) para publicar o resultado do `vite build`.
- **Testes:** adaptar `tools/` (`check`, `flows`, `lighthouse`) ao novo projeto.
- **Rede de segurança:** backup em `versoes/` antes de começar; commit por etapa.

### 4. Implementar a home Aorta de verdade
- Dados reais do banco no lugar dos fictícios.
- Paleta Ctrl/⌘ + K ligada à busca real.
- Versão sem WebGL.
- Revisor `aorta-design-reviewer` passando antes de cada commit.

### 5. Verificar e registrar
- Capturas em 375 e 1440 px, nos temas claro e escuro, com movimento reduzido.
- Lighthouse no celular: desempenho ≥ 85; acessibilidade e boas práticas 100.
- `CHANGES.md` e `DESIGN.md` atualizados.
- Commit local; publicar só com o "pode publicar" do dono.

## Riscos a acompanhar
- Modelo de 4 MB em 4G: medir. Se pesar, comprimir com meshopt/Draco.
- Safari/iPhone com WebGL: testar num aparelho de verdade.
- O traçado das artérias é estilizado. Manter o aviso e o crédito CC BY 4.0 do HuBMAP.
