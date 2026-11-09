export function initHeroCells(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const tau = Math.PI * 2;
  const cellSize = 4;
  const cellPitch = 10;
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
    const reach = width * (compact ? 0.48 : 0.44);
    const columns = Math.floor(width / cellPitch);
    const rows = Math.floor(height / cellPitch);
    const offsetX = Math.round((width - (columns - 1) * cellPitch - cellSize) / 2);
    const offsetY = Math.round((height - (rows - 1) * cellPitch - cellSize) / 2);
    const bandWidth = height * (compact ? 0.12 : 0.15);

    // This lattice only changes on resize. Time affects light, never geometry.
    for (let column = 0; column < columns; column++) {
      const x = offsetX + column * cellPitch;
      const centerX = x + cellSize / 2;
      const side = centerX < width / 2 ? 0 : 1;
      const u = (side ? width - centerX : centerX) / reach;
      if (u >= 1) continue;

      const bend = u * 5.6 - time * 0.55 + side * 1.7;
      const midline = height * (0.48 + 0.20 * Math.cos(bend));
      const taper = (1 - u * u) ** 1.6;
      for (let row = 0; row < rows; row++) {
        const y = offsetY + row * cellPitch;
        const centerY = y + cellSize / 2;
        const across = (centerY - midline) / bandWidth;
        if (Math.abs(across) >= 1) continue;

        const band = (1 - across * across) ** 2;
        const phase = u * 2.1 + across * 0.24 - time * 0.47 + side * 0.36;
        const light = ((1 + Math.cos(tau * phase)) / 2) ** 4;
        const edge = Math.min(1, centerY / 40, (height - centerY) / 40);
        const opacity = band * taper * edge * (0.14 + 0.86 * light);
        if (opacity < 0.015) continue;

        ctx.globalAlpha = opacity;
        ctx.fillStyle = light > 0.82 ? '#a6f4ff' : light > 0.32 ? '#16baff' : '#188cff';
        ctx.fillRect(x, y, cellSize, cellSize);
      }
    }
    ctx.globalAlpha = 1;
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
