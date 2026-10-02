import { defineConfig } from 'vite';

// Caminhos relativos: o GitHub Pages serve o site numa subpasta (/<repositório>/).
export default defineConfig({
  base: './',
  // O pedaço do coração 3D (Three.js) passa de 500 kB, mas só carrega depois da primeira tela.
  // Mapas de código publicados: o projeto não tem segredos no front-end e eles ajudam a depurar no aparelho.
  build: { outDir: 'dist', emptyOutDir: true, target: 'es2022', assetsInlineLimit: 0, chunkSizeWarningLimit: 700, sourcemap: true },
  server: { port: 4173 },
  preview: { port: 4174 },
});
