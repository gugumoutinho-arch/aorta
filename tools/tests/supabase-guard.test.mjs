// Regra da rodada A: os testes bloqueiam e registram qualquer tentativa de rede para *.supabase.co.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';
import { startServer, chromePath } from '../harness.mjs';

test('página de teste recusa e registra fetch, XHR e WebSocket para *.supabase.co; outros hosts seguem', { timeout: 120000 }, async () => {
  const { server, url } = await startServer();
  const browser = await chromium.launch({ executablePath: chromePath(), headless: true });
  try {
    const page = await browser.newPage(), errors = [];
    page.on('console', m => m.type() === 'error' && errors.push(m.text()));
    await page.goto(url + '#idomed'); await page.waitForSelector('#modules .mod');
    const r = await page.evaluate(async () => {
      const out = {};
      out.fetch = await fetch('https://rmqfduksayyplucshqea.supabase.co/rest/v1/materials').then(() => 'passou', e => e.message);
      try { new XMLHttpRequest().open('GET', 'https://x.supabase.co/a'); out.xhr = 'passou'; } catch (e) { out.xhr = e.message; }
      try { new WebSocket('wss://x.supabase.co/realtime'); out.ws = 'passou'; } catch (e) { out.ws = e.message; }
      out.local = await fetch(location.href).then(r => r.status);
      return { out, blocked: window.__supabaseBlocked };
    });
    assert.match(r.out.fetch, /bloqueada/); assert.match(r.out.xhr, /bloqueada/); assert.match(r.out.ws, /bloqueada/);
    assert.equal(r.out.local, 200);
    assert.equal(r.blocked.length, 3);
    assert.equal(errors.filter(e => /bloqueou rede para o Supabase/.test(e)).length, 3);
  } finally { await browser.close(); server.close(); }
});
