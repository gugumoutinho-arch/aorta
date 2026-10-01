# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
- **Hoje:** a dona da biblioteca, estudante de medicina (M1 › CIS 1), que organiza e abre os próprios materiais.
- **Destino confirmado (30/09/2026):** alunos de medicina de todos os períodos, acima e abaixo do dela, usando a mesma base para achar materiais da matéria que estão cursando ou revisando.
- **Situação de uso:** principalmente no celular, em momentos curtos (entre aulas, no transporte, antes de estudar), para **achar ou retomar** um material e **abrir o original** no Google Drive. No computador, para cadastrar e organizar.

## Product Purpose
Um catálogo de **links** para materiais de estudo (slides, casos clínicos, resumos, livros, estudos dirigidos), organizado como o curso é organizado: módulo › unidade › matéria, com assunto, período, tipo, coleções e situação de estudo. Sucesso é o aluno chegar ao material certo em poucos toques e abrir o original sem se perder.

## Positioning
A biblioteca segue a estrutura real do curso (módulos, unidades, matérias, semanas, assuntos) e o vocabulário dos alunos, em vez de pastas soltas do Drive. A base deve crescer até reunir os materiais de muitos períodos.

## Operating Context
- Os arquivos ficam no Google Drive de quem os criou; o site guarda só o link e os metadados. A busca consulta só os metadados.
- O conteúdo de M1 › CIS 1 inclui embriologia por semanas (1ª semana, 1ª e 2ª semanas, 2ª semana, 3ª semana, dobramento, placentação, gametogênese) e anatomia por região (membro superior, membro inferior, coluna vertebral), além de histologia (tecido epitelial, tecido conjuntivo).
- Coleções reais: "Prova Integrada CIS I" e "Casos clínicos". Provas integradas são um ritual do curso.
- A dona só vai começar a cadastrar os arquivos em volume quando o design estiver lapidado.

## Capabilities and Constraints
- Uma página (`index.html`, fragmento) que roda dentro do claude.ai (`window.claude.use("db")`) e no GitHub Pages (Supabase).
- Tabelas `materials`, `areas`, `collections`; status `nao-iniciado` | `em-estudo` | `revisado`; favoritos; remoção com aviso de que o original não é apagado e "Desfazer".
- Acesso hoje: só os e-mails da dona (RLS). **Em aberto:** como colegas de outros períodos vão ler e contribuir (leitura pública? contas? quem cadastra?). Mudar acesso ou banco só com pedido explícito.
- **Em aberto:** situação de estudo e favoritos são hoje do catálogo, não de cada aluno; com muitos usuários isso precisa de uma decisão de produto.
- Sem dependências novas; só fontes do Google Fonts; sem `alert/confirm/prompt`.

## Brand Commitments
- Nome: "Biblioteca de Medicina". Português do Brasil.
- Tom: **direto e calmo**. Frases curtas, sem entusiasmo forçado, com o vocabulário do curso (módulo, unidade, matéria, semana, prova integrada).
- Honestidade: nada que pareça importar, sincronizar ou buscar dentro dos arquivos.

## Evidence on Hand
- Catálogo real: 26 materiais em M1 › CIS 1 (Práticas Médicas 18, Anatomia 8), todos "não iniciado", sem favoritos e sem abertura registrada.
- Dados de teste fictícios: `tools/seed.json`; protótipos: `_fora-do-site/remodelacao/dados.json`.
- Não há depoimentos, números de uso ou marcas a preservar. Não inventar.

## Product Principles
1. **Achar e abrir primeiro.** Toda tela deixa o próximo material e o "Abrir original" ao alcance do polegar.
2. **A estrutura do curso é a navegação.** Módulo, unidade, matéria, semana e região vêm dos dados, nunca fixos no código.
3. **Escala sem ruído.** A interface precisa funcionar com 26 materiais e com milhares, de vários períodos.
4. **Links, não arquivos.** O site é honesto sobre o que guarda.
5. **Calma.** Sem pressa visual, sem gamificação gratuita.

## Accessibility & Inclusion
WCAG 2.1 AA: contraste de 4,5:1 nos temas claro e escuro, foco visível, teclado, toque de 44 px, `prefers-reduced-motion`, 375 px sem rolagem lateral.
