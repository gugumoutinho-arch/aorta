/* Temporizador que pausa (avisos com "Desfazer"): enquanto há cursor, dedo ou foco no aviso, o tempo para; ao sair,
   volta o que faltava, com um piso para dar tempo de ler de novo. */
export function pausableTimer(ms, onDone, { minAfterResume = 3000 } = {}) {
  let left = ms, started = Date.now(), id = setTimeout(fire, ms), paused = false, over = false;
  function fire() { if (over) return; over = true; onDone(); }
  return {
    pause() {
      if (paused || over) return;
      paused = true; clearTimeout(id); left -= Date.now() - started;
    },
    resume() {
      if (!paused || over) return;
      paused = false; left = Math.max(left, minAfterResume); started = Date.now(); id = setTimeout(fire, left);
    },
    cancel() { over = true; clearTimeout(id); },
  };
}
