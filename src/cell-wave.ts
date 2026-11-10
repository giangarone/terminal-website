export function initCellWave(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const cellSize = 6;
  const cellPitch = 8;
  // These modes deform one surface as it travels left to right. Different speeds
  // and gently changing amplitudes keep it rising and falling as it moves.
  // Choose random phases once per visit so the motion stays continuous.
  const modes = [
    { amplitude: 0.17, frequency: 1.75 },
    { amplitude: 0.072, frequency: 3.125 },
    { amplitude: 0.026, frequency: 5.25 },
  ].map((mode) => ({
    ...mode,
    spatialPhase: Math.random() * Math.PI * 2,
    temporalPhase: Math.random() * Math.PI * 2,
    // Keep the shorter swells moving at a gentle, steady pace.
    speed: 1.6 * Math.sqrt(mode.frequency),
  }));
  // Carry the logo's cyan and azure from a pale highlight into a deep blue fade.
  const colorStops = [
    { at: 0, rgb: [186, 234, 255] },
    { at: 0.08, rgb: [99, 217, 255] },
    { at: 0.18, rgb: [7, 188, 250] }, // Logo cyan: #07BCFA.
    { at: 0.35, rgb: [8, 167, 252] },
    { at: 0.65, rgb: [9, 135, 255] }, // Logo azure: #0987FF.
    { at: 1, rgb: [7, 84, 191] },
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
    ctx.shadowColor = '#07bcfa';
    const compact = width < 640;
    const columns = Math.floor(width / cellPitch);
    const rows = Math.floor(height / cellPitch);
    const offsetX = Math.round((width - (columns - 1) * cellPitch - cellSize) / 2);
    // Anchor the last row to the section edge, with no leftover space below it.
    const offsetY = height - (rows - 1) * cellPitch - cellSize;
    const trailLength = height * 0.28;
    const leadingEdge = compact ? 7 : 10;
    const displacements = modes.map((mode) =>
      mode.amplitude * (0.82 + 0.18 * Math.cos(time * mode.speed * 0.55 + mode.temporalPhase)),
    );

    // This lattice only changes on resize. Time affects light, never geometry.
    for (let column = 0; column < columns; column++) {
      const x = offsetX + column * cellPitch;
      const centerX = x + cellSize / 2;
      const position = (centerX - width / 2) / Math.max(width, 760);
      // Subtracting time from each phase moves every swell to the right.
      // Interference also changes the surface's height, slope, and curvature.
      // Evaluate it once per column; all illuminated cells belong to this surface.
      const elevation = modes.reduce((sum, mode, index) => sum
        + displacements[index] * Math.sin(position * Math.PI * 2 * mode.frequency + mode.spatialPhase - time * mode.speed), 0);
      const surface = height * (0.68 + elevation);
      for (let row = 0; row < rows; row++) {
        const y = offsetY + row * cellPitch;
        const centerY = y + cellSize / 2;
        const behind = centerY - surface;
        if (behind < -leadingEdge * 2) continue;
        const trailProgress = Math.min(1, Math.max(0, behind) / trailLength);
        // A full-bright band at least one grid pitch wide always catches a row
        // of cells, avoiding brightness pulses as the crest crosses the lattice.
        const crestDistance = Math.max(0, Math.abs(behind) - cellPitch / 2);
        const glow = Math.exp(-((crestDistance / leadingEdge) ** 2));
        // Blend across the surface so cells fade smoothly as the water lifts.
        const blend = Math.max(0, Math.min(1, (behind + leadingEdge) / (leadingEdge * 2)));
        const submerged = blend * blend * (3 - 2 * blend);
        const trail = (0.18 + 0.6 * (1 - trailProgress) ** 2) * submerged;
        const opacity = Math.max(glow, 0.65 * trail);
        const shade = Math.min(0.85, Math.max(0, behind - cellPitch / 2) / trailLength);
        if (opacity < 0.015) continue;

        ctx.globalAlpha = opacity;
        ctx.fillStyle = palette[Math.round(shade * (palette.length - 1))];
        // Keep the same restrained cyan glow along the water's surface.
        ctx.shadowBlur = glow > 0.35 ? (compact ? 3 : 4) * glow : 0;
        ctx.fillRect(x, y, cellSize, cellSize);
      }
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  }

  function tick(now: number) {
    if (now - lastDraw >= 1000 / 60 - 1) {
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
    const bounds = canvas.getBoundingClientRect();
    width = bounds.width;
    height = bounds.height;
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
