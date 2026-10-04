// Matriz de capturas da auditoria visual (rodada B): telas × larguras × temas × estados, só com dados fictícios.
// Uso: cd tools && node auditoria.mjs [--fase=u0] [--so=inicio-idomed,modulo] [--larguras=390,1440] [--temas=dark]
// Saída: reports/ui/<fase>/<cena>@<largura>-<tema>.png e reports/ui/<fase>/matriz.json (rolagem lateral, alvos < 44 px,
// erros de console). Não reprova: é a régua de olhar. Cada pacote recaptura só as cenas que mudou (--so).
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';
import { reports, chromePath, startServer, withDb, LOADING, FAILING, WEBGL_ARGS, here } from './harness.mjs';
import { withTopics, withManyTopics } from './fixtures-topics.mjs';

const arg = (k, d) => process.argv.find(a => a.startsWith(`--${k}=`))?.slice(k.length + 3) ?? d;
const fase = arg('fase', 'u0'), only = arg('so', '').split(',').filter(Boolean);
const widths = arg('larguras', '320,390,768,1440').split(',').map(Number), themes = arg('temas', 'dark,light').split(',');
const out = path.join(reports, 'ui', fase); fs.mkdirSync(out, { recursive: true });

const v4 = () => JSON.parse(fs.readFileSync(path.join(here, 'seed-v4.json'), 'utf8'));
/* Nomes longos: um material com título comprido e um assunto de nome comprido (fictícios). */
const longNames = d => {
  const x = withTopics(d);
  x.materials.push({ ...x.materials.find(m => m.areaId === 'cis1-anat'), id: 'longo', title: 'Anatomia topográfica e clínica do plexo braquial, da axila e dos compartimentos anterior e posterior do braço — revisão comentada para a prova prática', url: 'https://example.com/longo' });
  x.topics.push({ id: 'tl', areaId: 'cis1-anat', name: 'Sistema nervoso periférico do membro superior e lesões de nervos', slug: 'snp-ms', order: 9, slugAliases: [] });
  x.material_topics.push({ materialId: 'longo', topicId: 't1' });
  return x;
};
const srv = {
  main: await startServer({ inject: withDb(withTopics(v4())) }),
  many: await startServer({ inject: withDb(withManyTopics(withTopics(v4()))) }),
  long: await startServer({ inject: withDb(longNames(v4())) }),
  load: await startServer({ inject: LOADING }), fail: await startServer({ inject: FAILING }),
};
const click = sel => async p => { await p.locator(sel).first().click(); await p.waitForTimeout(700); };
const firstMaterial = async p => { await p.locator('#materials [data-mid]').first().click(); await p.waitForTimeout(900); };
/* Cada cena: servidor, endereço, preparo e opções (reduced = movimento reduzido, que também desliga o 3D). */
const SCENES = {
  'inicio-idomed': { hash: 'idomed' },
  'inicio-geral': { hash: 'geral' },
  'inicio-idomed-rolado': { hash: 'idomed', prep: async p => { await p.evaluate(() => scrollTo(0, innerHeight)); await p.waitForTimeout(900); } },
  'inicio-reduzido': { hash: 'idomed', reduced: true },
  'mapa-apontado': { hash: 'idomed', min: 1000, prep: async p => { await p.locator('#modules .mod').first().hover(); await p.waitForTimeout(700); } },
  'modulo': { hash: 'a-m1' },
  'modulo-assunto': { hash: 'a-cis1-anat/membro-superior' },
  'modulo-12-assuntos': { which: 'many', hash: 'a-cis1-anat' },
  'modulo-nomes-longos': { which: 'long', hash: 'a-cis1-anat' },
  'modulo-producao': { hash: 'a-m3' },
  'modulo-geral': { hash: 'a-g-anat' },
  'ficha': { hash: 'a-cis1-anat', prep: firstMaterial },
  'aviso-desfazer': { hash: 'a-cis1-anat', prep: async p => { await firstMaterial(p); await p.locator('#d-remove').click(); await p.locator('#d-rm-yes').click(); await p.waitForTimeout(600); } },
  'busca': { hash: 'idomed', prep: async p => { await p.locator('.top-actions [data-search]').click(); await p.keyboard.type('membro'); await p.waitForTimeout(600); } },
  'busca-vazia': { hash: 'idomed', prep: async p => { await p.locator('.top-actions [data-search]').click(); await p.keyboard.type('xyzw'); await p.waitForTimeout(600); } },
  'organizar': { hash: 'organizar' },
  'colagem': { hash: 'organizar', prep: async p => {
    await p.locator('#imp-text').fill('url,caminho,tipo,titulo\nhttps://drive.google.com/file/d/ficticio123/view,M1 › CIS 1 › Anatomia,Slides,Exemplo de colagem\nhttps://example.com/x,M9 › Nada,Slides,Caminho inexistente\nnao-e-link');
    await p.locator('#imp-form button[type=submit]').click(); await p.waitForTimeout(700); await p.locator('#imp-preview').scrollIntoViewIfNeeded(); } },
  'formulario': { hash: 'a-cis1-anat', prep: click('.top-actions [data-action="add"]') },
  'formulario-erro': { hash: 'a-cis1-anat', prep: async p => { await click('.top-actions [data-action="add"]')(p); await p.locator('#m-save').click(); await p.waitForTimeout(400); } },
  'carregando': { which: 'load', hash: 'a-m1' },
  'erro-banco': { which: 'fail', hash: 'idomed' },
};
const browser = await chromium.launch({ executablePath: chromePath(), headless: true, args: WEBGL_ARGS });
const matrix = [];
try {
  for (const [name, sc] of Object.entries(SCENES)) {
    if (only.length && !only.includes(name)) continue;
    for (const w of widths) for (const theme of themes) {
      if (sc.min && w < sc.min) continue;
      const ctx = await browser.newContext({ viewport: { width: w, height: w < 500 ? 844 : w < 1000 ? 1024 : 900 }, colorScheme: theme, reducedMotion: sc.reduced ? 'reduce' : 'no-preference' });
      await ctx.route(/supabase\.co/, r => r.abort());
      const page = await ctx.newPage(), errors = [];
      page.on('pageerror', e => errors.push(e.message));
      page.on('console', m => { if (m.type() === 'error' && !/fonts\.g|404/.test(m.text())) errors.push(m.text()); });
      await page.goto(srv[sc.which || 'main'].url + '#' + sc.hash);
      await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(1800);
      try { await sc.prep?.(page); } catch (e) { errors.push('preparo: ' + e.message.split('\n')[0]); }
      const file = `${name}@${w}-${theme}.png`;
      await page.screenshot({ path: path.join(out, file) });
      const cell = await page.evaluate(() => {
        const visible = e => { const r = e.getBoundingClientRect(), cs = getComputedStyle(e); return r.width && r.height && cs.visibility !== 'hidden' && !e.closest('[hidden],dialog:not([open]),.sr,footer') && !e.matches('.material-title button,.mini-card h3 button,.resume-title'); };
        const small = [...document.querySelectorAll('button,a[href],select,input:not([type=hidden]):not([type=radio]):not([type=checkbox]),[role=tab]')]
          .filter(visible).filter(e => e.offsetHeight < 43.5 || e.offsetWidth < 43.5).map(e => `${e.tagName.toLowerCase()}${e.id ? '#' + e.id : ''}.${String(e.className).split(' ')[0]}:${e.offsetWidth}x${e.offsetHeight}`);
        return { overflow: document.documentElement.scrollWidth - innerWidth, small: [...new Set(small)].slice(0, 12), smallCount: small.length };
      });
      matrix.push({ scene: name, width: w, theme, file, ...cell, errors });
      await ctx.close();
    }
  }
} finally { await browser.close(); Object.values(srv).forEach(s => s.server.close()); }
const prev = fs.existsSync(path.join(out, 'matriz.json')) ? JSON.parse(fs.readFileSync(path.join(out, 'matriz.json'), 'utf8')) : [];
const merged = [...prev.filter(c => !matrix.some(m => m.file === c.file)), ...matrix];
fs.writeFileSync(path.join(out, 'matriz.json'), JSON.stringify(merged, null, 1));
for (const c of matrix) if (c.overflow > 1 || c.errors.length || c.smallCount) console.log(`${c.file}: lateral=${c.overflow} alvos<44=${c.smallCount} ${c.small.slice(0, 4).join(' ')} ${c.errors.join(' | ')}`);
console.log(`${matrix.length} capturas em ${path.relative(here, out)}`);
