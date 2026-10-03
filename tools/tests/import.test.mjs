// N4 · Importação por colagem: leitura das linhas, links do Drive, caminho → matéria e assunto, duplicatas e pendências.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parsePaste, driveInfo, normalizeUrl, planImport, draftFromRow, blockers, MAX_ROWS, DEFAULT_RIGHTS } from '../../src/domain/import.js';

const TYPES = ['Slides', 'Apostila', 'Resumo', 'Caso clínico', 'Livro', 'Link'];
const areas = [
  { id: 'm1', name: 'M1', parentId: '', acervo: 'idomed' },
  { id: 'cis1', name: 'CIS 1', parentId: 'm1' },
  { id: 'cis1-anat', name: 'Anatomia', parentId: 'cis1' },
  { id: 'cis1-embrio', name: 'Embriologia', parentId: 'cis1' },
  { id: 'g-anat', name: 'Anatomia', parentId: '', acervo: 'geral' },
];
const topics = [
  { id: 't1', areaId: 'cis1-anat', name: 'Membro superior', slug: 'membro-superior', order: 0 },
  { id: 't2', areaId: 'cis1-anat', name: 'Coluna vertebral', slug: 'coluna-vertebral', order: 1 },
];
const materials = [{ id: 'old1', title: 'Já no catálogo', url: 'https://drive.google.com/file/d/JAEXISTE123/view?usp=sharing' }];
const drafts = [{ id: 'd1', url: 'https://drive.google.com/open?id=RASCUNHO99', driveFileId: 'RASCUNHO99', status: 'rascunho', title: 'Rascunho' },
  { id: 'd2', url: 'https://drive.google.com/file/d/IGNORADO1/view', driveFileId: 'IGNORADO1', status: 'ignorado' }];
const ctx = { areas, topics, materials, drafts, types: TYPES };
const TAB = '\t';
const tsv = (...rows) => ['url\tcaminho\ttipo\ttitulo\tfonte\tano\tdireitos', ...rows.map(r => r.join(TAB))].join('\n');

test('ID do arquivo do Drive nos três formatos, preservando a resourcekey', () => {
  assert.deepEqual(driveInfo('https://drive.google.com/file/d/1AbC_d-9/view?usp=sharing'), { fileId: '1AbC_d-9', resourceKey: '', folder: false });
  assert.equal(driveInfo('https://drive.google.com/open?id=XYZ123').fileId, 'XYZ123');
  assert.equal(driveInfo('https://drive.google.com/uc?id=UC777&export=download').fileId, 'UC777');
  assert.deepEqual(driveInfo('https://drive.google.com/file/d/K1/view?resourcekey=0-abc'), { fileId: 'K1', resourceKey: '0-abc', folder: false });
  assert.equal(driveInfo('https://docs.google.com/document/d/DOC42/edit').fileId, 'DOC42');
  assert.equal(driveInfo('https://drive.google.com/drive/folders/PASTA1').folder, true);
  assert.equal(driveInfo('https://drive.google.com/drive/u/0/folders/PASTA2?usp=sharing').folder, true);
  assert.deepEqual(driveInfo('https://example.com/file/d/NAO/'), { fileId: '', resourceKey: '', folder: false });
  // a URL guardada continua com a resourcekey (sem ela, alguns arquivos antigos não abrem)
  const [row] = parsePaste('https://drive.google.com/file/d/K1/view?resourcekey=0-abc').rows;
  assert.equal(row.url, 'https://drive.google.com/file/d/K1/view?resourcekey=0-abc');
});

test('URL normalizada para achar duplicata: sem #, sem usp, sem barra final, host em minúsculas', () => {
  assert.equal(normalizeUrl('https://Example.com/a/?usp=sharing#x'), 'https://example.com/a');
  assert.equal(normalizeUrl('https://example.com/a?b=1&usp=drive_link'), 'https://example.com/a?b=1');
});

test('só a URL, uma por linha; linhas vazias não contam', () => {
  const r = parsePaste('\nhttps://drive.google.com/file/d/A1/view\n\n  https://example.com/aula  \n');
  assert.equal(r.error, undefined);
  assert.deepEqual(r.rows.map(x => [x.line, x.url, x.driveFileId]), [[2, 'https://drive.google.com/file/d/A1/view', 'A1'], [4, 'https://example.com/aula', '']]);
  assert.deepEqual(r.rows.map(x => x.title), ['', '']);
});

test('TSV com cabeçalho (com ou sem acento em "título")', () => {
  const r = parsePaste(tsv(['https://drive.google.com/file/d/B2/view', 'Aorta/IDOMED/M1/CIS 1/Anatomia/Membro superior/', 'Slides', 'Aula 1', 'Monitoria', '2026', 'proprio']));
  assert.deepEqual(r.rows[0], { line: 2, url: 'https://drive.google.com/file/d/B2/view', path: 'Aorta/IDOMED/M1/CIS 1/Anatomia/Membro superior/', type: 'Slides', title: 'Aula 1',
    source: 'Monitoria', year: '2026', rights: 'proprio', driveFileId: 'B2', resourceKey: '', errors: [] });
  assert.equal(parsePaste('URL\tCaminho\tTipo\tTítulo\tFonte\tAno\tDireitos\nhttps://example.com/x').rows.length, 1);
  const short = parsePaste('url\tcaminho\ttipo\thttps://x\nhttps://example.com/y\tM1\tSlides');
  assert.equal(short.rows[0].errors.length, 1, 'cabeçalho com coluna fora da lista não vale');
  const prefix = parsePaste('url\tcaminho\ttipo\ttitulo\nhttps://example.com/y\tM1\tSlides\tAula');
  assert.deepEqual([prefix.rows.length, prefix.rows[0].title, prefix.rows[0].source, prefix.rows[0].errors], [1, 'Aula', '', []], 'só as primeiras colunas');
});

test('rejeita pasta do Drive (com explicação), não-https e colunas sem cabeçalho', () => {
  const r = parsePaste('https://drive.google.com/drive/folders/PASTA1\nhttp://example.com/x\nftp://x.com/y\nnão é link\nhttps://example.com/a\tsem cabeçalho');
  assert.match(r.rows[0].errors[0], /pasta/i);
  assert.match(r.rows[0].errors[0], /cole os links dos arquivos/);
  assert.match(r.rows[1].errors[0], /https/);
  assert.match(r.rows[2].errors[0], /https/);
  assert.match(r.rows[3].errors[0], /link/);
  assert.match(r.rows[4].errors[0], /cabeçalho/);
});

test('no máximo 100 linhas por lote', () => {
  const lines = n => Array.from({ length: n }, (_, i) => 'https://example.com/' + i).join('\n');
  assert.equal(parsePaste(lines(MAX_ROWS)).rows.length, 100);
  const over = parsePaste(lines(MAX_ROWS + 1));
  assert.match(over.error, /100/);
  assert.deepEqual(over.rows, []);
  assert.equal(parsePaste(tsv(...Array.from({ length: 101 }, (_, i) => ['https://example.com/' + i]))).rows.length, 0, 'o cabeçalho não conta, as 101 linhas sim');
});

test('caminho vira matéria e assunto pelos nomes da árvore', () => {
  const [row] = planImport(parsePaste(tsv(['https://example.com/a', 'Aorta/IDOMED/M1/CIS 1/Anatomia/Membro superior/', 'Slides', 'Aula'])).rows, ctx);
  assert.equal(row.areaId, 'cis1-anat');
  assert.deepEqual(row.topicIds, ['t1']);
  assert.equal(row.place, 'M1 › CIS 1 › Anatomia › Membro superior');
  // sem "Aorta/IDOMED", em maiúsculas e sem acento, também acha
  const [b] = planImport(parsePaste(tsv(['https://example.com/b', 'm1/cis 1/ANATOMIA/coluna vertebral', 'Slides', 'B'])).rows, ctx);
  assert.deepEqual([b.areaId, b.topicIds], ['cis1-anat', ['t2']]);
  // acervo de medicina geral
  const [g] = planImport(parsePaste(tsv(['https://example.com/g', 'Aorta/Medicina geral/Anatomia', 'Livro', 'G'])).rows, ctx);
  assert.equal(g.areaId, 'g-anat');
});

test('caminho desconhecido não cria nada: fica pendente, à espera de escolha', () => {
  const rows = planImport(parsePaste(tsv(
    ['https://example.com/a', 'Aorta/IDOMED/M1/CIS 9/Anatomia', 'Slides', 'A'],
    ['https://example.com/b', 'Aorta/IDOMED/M1/CIS 1/Anatomia/Tórax', 'Slides', 'B'],
    ['https://example.com/c', 'Aorta/IDOMED/M1/CIS 1', 'Slides', 'C'])).rows, ctx);
  assert.equal(rows[0].areaId, '');
  assert.equal(rows[0].place, '', 'sem matéria, não diz "Vai para: M1"');
  assert.ok(rows[0].problems.includes('caminho-desconhecido'));
  assert.equal(rows[1].areaId, 'cis1-anat', 'a matéria existe');
  assert.deepEqual(rows[1].topicIds, []);
  assert.ok(rows[1].problems.includes('assunto-desconhecido'));
  assert.ok(rows[2].problems.includes('sem-materia'), 'parou numa unidade');
});

test('campo vazio vira pendência, nunca valor inventado; direitos padrão = público', () => {
  const [row] = planImport(parsePaste('https://drive.google.com/file/d/Z9/view').rows, ctx);
  assert.deepEqual([row.title, row.type, row.areaId, row.year, row.source], ['', '', '', '', '']);
  assert.deepEqual(row.problems.sort(), ['sem-materia', 'sem-tipo', 'sem-titulo']);
  assert.equal(row.rights, DEFAULT_RIGHTS);
  assert.equal(DEFAULT_RIGHTS, 'publico');
  assert.equal(planImport(parsePaste('https://example.com/x').rows, { ...ctx, defaultRights: 'proprio' })[0].rights, 'proprio');
});

test('tipo, ano e direitos fora da lista viram pendência, sem chute', () => {
  const [row] = planImport(parsePaste(tsv(['https://example.com/a', '', 'Powerpoint', 'A', '', '26', 'talvez'])).rows, ctx);
  assert.deepEqual([row.type, row.year, row.rights], ['', '', 'pendente']);
  assert.ok(row.problems.includes('tipo-desconhecido') && row.problems.includes('ano-invalido') && row.problems.includes('direitos-pendentes'));
  const [ok] = planImport(parsePaste(tsv(['https://example.com/b', '', 'caso clinico', 'B', '', '2025', 'Licença aberta'])).rows, ctx);
  assert.deepEqual([ok.type, ok.year, ok.rights], ['Caso clínico', '2025', 'licenca-aberta']);
});

test('duplicata (mesmo arquivo do Drive ou mesma URL) é marcada, nunca criada de novo', () => {
  const rows = planImport(parsePaste([
    'https://drive.google.com/open?id=JAEXISTE123',
    'https://drive.google.com/file/d/RASCUNHO99/view',
    'https://drive.google.com/file/d/IGNORADO1/view',
    'https://drive.google.com/file/d/NOVO1/view',
    'https://drive.google.com/uc?id=NOVO1',
    'https://Drive.google.com/file/d/JAEXISTE123/view#x',
  ].join('\n')).rows, ctx);
  assert.deepEqual(rows.map(r => r.duplicate?.kind || ''), ['material', 'rascunho', '', '', 'lote', 'material']);
  assert.equal(rows[0].duplicate.id, 'old1');
  assert.deepEqual(rows.map(r => r.action), ['ignorar', 'ignorar', 'criar', 'criar', 'ignorar', 'ignorar']);
  assert.deepEqual(rows.map(r => r.canLink), [false, false, false, false, false, false], 'sem assunto no caminho, não há o que ligar');
  const [byUrl] = planImport(parsePaste('https://example.com/aula/?usp=sharing').rows, { ...ctx, materials: [{ id: 'm9', url: 'https://example.com/aula' }] });
  assert.equal(byUrl.duplicate.kind, 'material');
});

test('duplicata de material com assunto resolvido pode ligar ao existente, mas só por escolha (padrão: ignorar)', () => {
  const [row] = planImport(parsePaste(tsv(['https://drive.google.com/file/d/JAEXISTE123/view', 'M1/CIS 1/Anatomia/Membro superior', 'Slides', 'X'])).rows, ctx);
  assert.deepEqual([row.action, row.canLink], ['ignorar', true]);
});

test('livro apontando para o Drive é avisado e não pode ser publicado', () => {
  const [row] = planImport(parsePaste(tsv(['https://drive.google.com/file/d/LIVRO1/view', 'M1/CIS 1/Anatomia', 'Livro', 'Moore', '', '', 'publico'])).rows, ctx);
  assert.ok(row.problems.includes('livro-no-drive'));
  assert.ok(blockers(draftFromRow(row, '2026-10-03T00:00:00Z'), ctx).includes('livro-no-drive'));
});

test('linha com erro nunca vira rascunho; título com HTML fica como texto puro', () => {
  const rows = planImport(parsePaste(tsv(
    ['https://drive.google.com/drive/folders/P', '', 'Slides', 'Pasta'],
    ['https://example.com/x', '', 'Slides', '<img src=x onerror=alert(1)>\u0007'])).rows, ctx);
  assert.equal(rows[0].action, 'ignorar');
  assert.equal(rows[1].title, '<img src=x onerror=alert(1)>', 'sem caractere de controle, sem escapar (a tela usa textContent)');
});

test('rascunho guarda os dados da linha e as pendências; publicar exige título, tipo, matéria e direitos', () => {
  const [row] = planImport(parsePaste(tsv(['https://drive.google.com/file/d/B2/view', 'M1/CIS 1/Anatomia/Membro superior', 'Slides', 'Aula 1', 'Monitoria', '2026', 'proprio'])).rows, ctx);
  const d = draftFromRow(row, '2026-10-03T00:00:00Z');
  assert.deepEqual(d, { url: 'https://drive.google.com/file/d/B2/view', path: 'M1/CIS 1/Anatomia/Membro superior', type: 'Slides', title: 'Aula 1', source: 'Monitoria',
    year: '2026', rights: 'proprio', areaId: 'cis1-anat', topicIds: ['t1'], driveFileId: 'B2', status: 'rascunho', materialId: null, problems: [],
    createdAt: '2026-10-03T00:00:00Z', updatedAt: '2026-10-03T00:00:00Z' });
  assert.deepEqual(blockers(d, ctx), []);
  assert.deepEqual(blockers({ ...d, title: ' ', type: '', areaId: 'sumiu', rights: 'pendente' }, ctx).sort(), ['direitos-pendentes', 'sem-materia', 'sem-tipo', 'sem-titulo']);
  // já publicado por outro caminho (mesmo arquivo no catálogo) também bloqueia
  assert.deepEqual(blockers({ ...d, driveFileId: 'JAEXISTE123' }, ctx), ['ja-no-catalogo']);
  // o próprio material criado por este rascunho não conta como duplicata
  assert.deepEqual(blockers({ ...d, driveFileId: 'JAEXISTE123', materialId: 'old1' }, ctx), []);
});
