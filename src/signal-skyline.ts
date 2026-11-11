// Decorative signal columns: fixed cells, independently moving light levels.
export function initSignalSkyline(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const pitch = 8;
  const size = 6;
  // The same pale cyan, logo cyan, azure, and deep blue as the hero.
  const stops = [
    [186, 234, 255], [99, 217, 255], [7, 188, 250],
    [8, 167, 252], [9, 135, 255], [7, 84, 191],
  ];
  const positions = [0, 0.08, 0.18, 0.35, 0.65, 1];
  const palette = Array.from({ length: 256 }, (_, index) => {
    const progress = index / 255;
    const end = Math.max(1, positions.findIndex(value => value >= progress));
    const blend = smooth((progress - positions[end - 1]) / (positions[end] - positions[end - 1]));
    return `rgb(${stops[end - 1].map((value, channel) =>
      Math.round(value + (stops[end][channel] - value) * blend)).join(' ')})`;
  });
  let width = 0;
  let height = 0;
  let time = 0;
  let frame = 0;
  let lastDraw = 0;
  let inView = false;
  let columns: { x: number; front: number; back: number; gutter: boolean }[] = [];

  function smooth(value: number) {
    const clamped = Math.max(0, Math.min(1, value));
    return clamped * clamped * (3 - 2 * clamped);
  }

  function seed(index: number) {
    const value = Math.sin(index * 127.1 + 311.7) * 43758.5453;
    return value - Math.floor(value);
  }

  function paint() {
    if (!ctx || !width || !height) return;
    ctx.clearRect(0, 0, width, height);
    const rows = Math.floor(height / pitch);
    const offsetY = height - (rows - 1) * pitch - size;
    const base = height * 0.96;
    const frontLevels = new Map<number, number>();
    const backLevels = new Map<number, number>();
    for (const column of columns) {
      // Every group has its own height and tempo, without sliding the lattice.
      if (!frontLevels.has(column.front)) {
        const id = column.front;
        // Broad strokes every 3.6–5.5 seconds, with a slower secondary sway.
        frontLevels.set(id, height * (0.38 + seed(id + 2) * 0.08
          + Math.sin(time * (1.15 + seed(id + 9) * 0.6) + id * 2.4) * 0.25
          + Math.sin(time * 0.65 + id * 0.8) * 0.055));
      }
      if (!backLevels.has(column.back)) {
        const id = column.back;
        backLevels.set(id, height * (0.42 + seed(id + 41) * 0.1
          + Math.sin(time * (0.85 + seed(id + 53) * 0.35) + id * 1.7) * 0.23));
      }
    }

    for (const column of columns) {
      const centerX = column.x + size / 2;
      const frontTop = frontLevels.get(column.front)!;
      const backTop = backLevels.get(column.back)!;
      const sideFade = smooth(Math.min(centerX, width - centerX) / 56);
      for (let row = 0; row < rows; row++) {
        const y = offsetY + row * pitch;
        const centerY = y + size / 2;
        const frontDepth = centerY - frontTop;
        const backDepth = centerY - backTop;
        if (frontDepth < -12 && backDepth < -12) continue;
        const bottomFade = smooth((base - centerY) / (height * 0.2));
        if (!bottomFade) continue;
        const frontProgress = Math.max(0, frontDepth) / (height * 0.65);
        const backProgress = Math.max(0, backDepth) / (height * 0.65);
        // Keep the blue bodies substantial; only the tips reach pale cyan.
        const front = column.gutter ? 0 : smooth((frontDepth + 10) / 16)
          * (0.46 + 0.5 * Math.exp(-frontProgress * 5));
        const back = smooth((backDepth + 10) / 16)
          * (0.19 + 0.19 * Math.exp(-backProgress * 4));
        const foreground = front >= back;
        const progress = foreground ? frontProgress : backProgress;
        const alpha = Math.max(front, back) * bottomFade * sideFade;
        if (alpha < 0.012) continue;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = palette[Math.round(Math.min(1, progress * 2.3 + (foreground ? 0 : 0.26)) * 255)];
        ctx.fillRect(column.x, y, size, size);
      }
    }
    ctx.globalAlpha = 1;
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
    paint();
    if (inView && !document.hidden && !motion.matches) frame = requestAnimationFrame(tick);
  }

  function resize() {
    const bounds = canvas.getBoundingClientRect();
    width = bounds.width;
    height = bounds.height;
    const scale = Math.min(devicePixelRatio, 2);
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    ctx!.setTransform(scale, 0, 0, scale, 0, 0);
    const count = Math.floor(width / pitch);
    const offsetX = Math.round((width - (count - 1) * pitch - size) / 2);
    // Alternate tower widths, with only one cell of separation between them.
    let group = 0;
    let remaining = 0;
    columns = Array.from({ length: count }, (_, index) => {
      if (!remaining) {
        group++;
        remaining = 4 + Math.floor(seed(group) * (width < 640 ? 4 : 7));
      }
      remaining--;
      return { x: offsetX + index * pitch, front: group, back: Math.floor((index + 3) / 9), gutter: remaining === 0 };
    });
    paint();
  }

  new ResizeObserver(resize).observe(canvas);
  new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    updateMotion();
  }).observe(canvas);
  motion.addEventListener('change', updateMotion);
  document.addEventListener('visibilitychange', updateMotion);
}
