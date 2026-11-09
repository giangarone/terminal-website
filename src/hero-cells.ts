export function initHeroCells(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const cellSize = 4;
  const cellPitch = 8;
  // Blend ice blue through cyan into deeper blue as each illuminated cell fades.
  const colorStops = [
    { at: 0, rgb: [213, 251, 255] },
    { at: 0.08, rgb: [157, 239, 255] },
    { at: 0.18, rgb: [93, 225, 255] },
    { at: 0.35, rgb: [53, 213, 255] },
    { at: 0.65, rgb: [22, 171, 255] },
    { at: 1, rgb: [32, 100, 235] },
  ];
  // Prepare the shades once so per-frame drawing only needs a palette lookup.
  const palette = Array.from({ length: 256 }, (_, index) => {
    const progress = index / 255;
    const endIndex = Math.max(1, colorStops.findIndex((stop) => stop.at >= progress));
    const start = colorStops[endIndex - 1];
    const end = colorStops[endIndex];
    const blend = (progress - start.at) / (end.at - start.at);
    const smooth = blend * blend * (3 - 2 * blend);
    const rgb = start.rgb.map((channel, i) => Math.round(channel + (end.rgb[i] - channel) * smooth));
    return `rgb(${rgb.join(' ')})`;
  });
  let width = 0;
  let height = 0;
  let time = 0;
  let inView = false;
  let frame = 0;
  let lastDraw = 0;

  function paint() {
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    ctx.shadowColor = '#24c8ff';
    const compact = width < 640;
    const columns = Math.floor(width / cellPitch);
    const rows = Math.floor(height / cellPitch);
    const offsetX = Math.round((width - (columns - 1) * cellPitch - cellSize) / 2);
    const offsetY = Math.round((height - (rows - 1) * cellPitch - cellSize) / 2);
    const originX = width / 2;
    const originY = height * 1.05;
    const horizontalSpread = compact ? 1.05 : 1.5;
    const maxRadius = Math.hypot(width / (2 * horizontalSpread), originY);
    const ringSpacing = maxRadius * 0.36;
    const trailLength = Math.min(ringSpacing * 0.52, compact ? 72 : 110);
    const leadingEdge = compact ? 7 : 10;
    const pulseRadius = ringSpacing * (0.72 + time / 4.8);

    // This lattice only changes on resize. Time affects light, never geometry.
    for (let column = 0; column < columns; column++) {
      const x = offsetX + column * cellPitch;
      const centerX = x + cellSize / 2;
      for (let row = 0; row < rows; row++) {
        const y = offsetY + row * cellPitch;
        const centerY = y + cellSize / 2;
        // Expanding rings illuminate fixed cells outward from below the hero.
        const radius = Math.hypot((centerX - originX) / horizontalSpread, centerY - originY);
        const behind = ((pulseRadius - radius) % ringSpacing + ringSpacing) % ringSpacing;
        if (behind >= trailLength) continue;

        const trail = (1 - behind / trailLength) ** 2;
        const head = Math.exp(-((behind / leadingEdge) ** 2));
        const edge = Math.min(1, centerY / 48, (height - centerY) / 48, centerX / 32, (width - centerX) / 32);
        // Soften illumination behind the central heading and description.
        const focus = Math.min(1, Math.hypot(
          (centerX - width / 2) / (width * 0.38),
          (centerY - height * 0.5) / (height * (compact ? 0.75 : 0.55)),
        ));
        const contentFade = 0.16 + 0.84 * focus * focus;
        const opacity = Math.min(1, 0.75 * trail + 0.55 * head) * edge * contentFade;
        if (opacity < 0.015) continue;

        ctx.globalAlpha = opacity;
        ctx.fillStyle = palette[Math.round((behind / trailLength) * (palette.length - 1))];
        // A restrained glow picks out the outward-facing edges of the rings.
        ctx.shadowBlur = head > 0.35 ? (compact ? 3 : 4) * head : 0;
        ctx.fillRect(x, y, cellSize, cellSize);
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
