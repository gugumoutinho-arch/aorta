# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
- **Hoje:** o dono da biblioteca, estudante de medicina (M1 › CIS 1), que organiza e abre os próprios materiais.
- **Destino confirmado (30/09/2026):** alunos de medicina de todos os períodos, acima e abaixo do dele, usando a mesma base para achar materiais da matéria que estão cursando ou revisando.
- **Direção decidida pelo dono em 01/10/2026 (ainda não implementada):** acervo aberto de materiais de qualidade para estudantes de medicina em geral: provas antigas, materiais de monitoria, resumos e casos clínicos, de fácil acesso, para melhorar a primeira experiência de quem chega. Os alunos da IDOMED são o primeiro grupo; o site não é só deles e não leva o nome de nenhuma instituição. Qualquer pessoa lê sem login; o login é opcional e serve para guardar o que a pessoa já abriu e favoritou; só o dono e quem ele autorizar alteram o acervo. Quem tem login poderá sugerir material (só link do Drive), que passa por curadoria do dono antes de aparecer.
- **Módulos:** as pastas M1 a M8 (M8 é o último antes do internato) podem existir desde já; só M1 e M2 têm conteúdo. Módulo, unidade ou matéria sem nenhum material aparece marcado "Em produção", deduzido dos dados, e a marca some no primeiro material. Os módulos nunca são fixos no código.
- **Situação de uso:** principalmente no celular, em momentos curtos (entre aulas, no transporte, antes de estudar), para **achar ou retomar** um material e **abrir o original** no Google Drive. No computador, para cadastrar e organizar.

## Product Purpose
Um catálogo de **links** para materiais de estudo (slides, casos clínicos, resumos, livros, estudos dirigidos), organizado como o curso é organizado: módulo › unidade › matéria, com assunto, período, tipo, coleções e situação de estudo. Sucesso é o aluno chegar ao material certo em poucos toques e abrir o original sem se perder.

## Positioning
A biblioteca segue a estrutura real do curso (módulos, unidades, matérias, semanas, assuntos) e o vocabulário dos alunos, em vez de pastas soltas do Drive. A base deve crescer até reunir os materiais de muitos períodos.

## Operating Context
- Os arquivos ficam no Google Drive de quem os criou; o site guarda só o link e os metadados. A busca consulta só os metadados.
- O conteúdo de M1 › CIS 1 inclui embriologia por semanas (1ª semana, 1ª e 2ª semanas, 2ª semana, 3ª semana, dobramento, placentação, gametogênese) e anatomia por região (membro superior, membro inferior, coluna vertebral), além de histologia (tecido epitelial, tecido conjuntivo).
- Coleções reais: "Prova Integrada CIS I" e "Casos clínicos". Provas integradas são um ritual do curso.
- O dono só vai começar a cadastrar os arquivos em volume quando o design estiver lapidado.

## Capabilities and Constraints
- Uma página (`index.html`, fragmento) que roda dentro do claude.ai (`window.claude.use("db")`) e no GitHub Pages (Supabase).
- Tabelas `materials`, `areas`, `collections`; status `nao-iniciado` | `em-estudo` | `revisado`; favoritos; remoção com aviso de que o original não é apagado e "Desfazer".
- Acesso hoje: só os e-mails do dono (RLS). **Em aberto:** como colegas de outros períodos vão ler e contribuir (leitura pública? contas? quem cadastra?). Mudar acesso ou banco só com pedido explícito.
- **Em aberto:** situação de estudo e favoritos são hoje do catálogo, não de cada aluno; com muitos usuários isso precisa de uma decisão de produto. Direção do dono: no aparelho para quem não entrou; na conta, em tabela própria, para quem entrou.
- **Próximas rodadas (precisam de pedido explícito, migração e revisão de segurança):** leitura pública; login opcional; estado por pessoa; lista de editores no banco; sugestão de material com login e curadoria (fila separada do catálogo, limite de envios, só links do Drive, escolha entre aparecer como autor ou anônimo, fila consultada pelo dono sem aviso por e-mail); `noindex` mantido enquanto o acervo estiver em construção. Os links do Drive ainda não estão prontos: o dono vai reuni-los depois.
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
