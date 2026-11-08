export function initHeroCells(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const tau = Math.PI * 2;
  let width = 0;
  let height = 0;
  let time = 0;
  let inView = false;
  let frame = 0;
  let lastDraw = 0;

  function paint() {
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    const compact = width < 640;
    const reach = width * (compact ? 0.34 : 0.37);
    const columns = Math.ceil(reach / (compact ? 6 : 10));
    const rows = compact ? 8 : 14;

    for (let side = 0; side < 2; side++) {
      for (let column = 0; column < columns; column++) {
        const u = column / columns;
        const x = side ? width - u * reach : u * reach;
        const bend = u * 5.6 + 0.48 * Math.sin(time * 0.7 + side) + side * 1.7;
        const midline = height * (0.48 + 0.20 * Math.cos(bend));
        const spacing = (compact ? 5 : 8) * (1 + 0.43 * Math.sin(bend));
        const taper = (1 - u * u) ** 1.6;
        for (let row = 0; row < rows; row++) {
          const across = row / (rows - 1) - 0.5;
          const y = midline + across * rows * spacing + across * across * 46 * Math.sin(bend);
          // Stagger nearby rows so each pulse travels diagonally across the fold.
          const phase = u * 2.1 + across * 0.48 - time * 0.47 + side * 0.36;
          const crest = (1 + Math.cos(tau * phase)) / 2;
          const light = crest ** 6;
          const depth = (1 - Math.abs(across) * 0.85) * taper;
          const size = (compact ? 2.2 : 3.1) * (1.05 + 0.52 * light + across * 0.34);
          ctx.globalAlpha = Math.min(1, depth * (0.18 + 0.94 * light));
          ctx.fillStyle = light > 0.82 ? '#a6f4ff' : light > 0.32 ? '#16baff' : '#188cff';
          // A small halo on the crests keeps the dimmer cells crisp.
          ctx.shadowColor = '#16baff80';
          ctx.shadowBlur = light > 0.65 ? (compact ? 4 : 7) * light : 0;
          ctx.fillRect(x - size / 2, y - size / 2, size, size);
        }
      }
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  }

  function tick(now: number) {
    if (now - lastDraw >= 1000 / 30) {
      if (lastDraw) time += Math.min(now - lastDraw, 100) / 1000;
      lastDraw = now;
      paint();
    }
    frame = requestAnimationFrame(tick);
  }

  function updateMotion() {
    cancelAnimationFrame(frame);
    lastDraw = 0;
    if (inView && !document.hidden && !motion.matches) frame = requestAnimationFrame(tick);
  }

  new ResizeObserver(() => {
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    const scale = Math.min(devicePixelRatio, 2);
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    paint();
  }).observe(canvas);

  new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    updateMotion();
  }).observe(canvas);
  motion.addEventListener('change', updateMotion);
  document.addEventListener('visibilitychange', updateMotion);
}
