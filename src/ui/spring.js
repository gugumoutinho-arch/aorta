/* Mola amortecida: preserva velocidade ao mudar de alvo e para de desenhar ao repousar. */
export function spring(state, onUpdate, { stiffness = 210, damping = 28 } = {}) {
  const target = { ...state }, velocity = Object.fromEntries(Object.keys(state).map(k => [k, 0]));
  let frame = 0, previous = 0;
  const stop = () => { cancelAnimationFrame(frame); frame = 0; previous = 0; };
  function tick(now) {
    frame = 0;
    const dt = Math.min(previous ? (now - previous) / 1000 : 1 / 60, .05);
    previous = now;
    let moving = false;
    const steps = Math.ceil(dt / .008), h = dt / steps;
    for (const k of Object.keys(target)) {
      for (let i = 0; i < steps; i++) {
        velocity[k] += (stiffness * (target[k] - state[k]) - damping * velocity[k]) * h;
        state[k] += velocity[k] * h;
      }
      if (Math.abs(target[k] - state[k]) > .001 || Math.abs(velocity[k]) > .001) moving = true;
      else { state[k] = target[k]; velocity[k] = 0; }
    }
    onUpdate();
    if (moving) frame = requestAnimationFrame(tick); else previous = 0;
  }
  return {
    to(next) { Object.assign(target, next); if (!frame) frame = requestAnimationFrame(tick); },
    settle(next = target) { stop(); Object.assign(target, next); Object.assign(state, target); Object.keys(velocity).forEach(k => { velocity[k] = 0; }); onUpdate(); },
    dispose: stop,
  };
}
