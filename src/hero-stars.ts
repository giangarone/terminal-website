const starLayers = [
  { seed: 71087, areaPerStar: 1560, speed: 2.8, diameter: 0.8, brightness: 0.72 },
  { seed: 28181, areaPerStar: 4800, speed: 4.9, diameter: 1.1, brightness: 0.84 },
];
const edgeMargin = 4;

function createLayer(width: number, height: number, dpr: number, config: typeof starLayers[number]) {
  let seed = config.seed;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 0x100000000;
  };

  const count = Math.round(width * height / (dpr ** 2 * config.areaPerStar));
  const stars = Array.from({ length: count }, () => {
    const x = width * random();
    const y = height * random();
    const brightness = random();
    const tint = random();
    const diameter = brightness > 0.97 ? 1.5 : config.diameter;
    return {
      x,
      y,
      size: Math.max(1, Math.round(diameter * dpr)),
      opacity: config.brightness * (0.24 + 0.76 * brightness ** 2),
      color: tint < 0.09 ? '#ffe1c8' : tint < 0.27 ? '#d6e3ff' : '#eeeaff',
      phase: 2 * Math.PI * random(),
      twinkleRate: 0.8 + 1.5 * random(),
    };
  });
  return { stars, speed: config.speed * dpr };
}

export function initHeroStars() {
  const canvas = document.querySelector<HTMLCanvasElement>('.hero-stars');
  const context = canvas?.getContext('2d');
  if (!canvas || !context) return;

  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let inView = !('IntersectionObserver' in window);
  let frame: number | undefined;
  let previous: number | undefined;
  let time = 0;
  let lastDpr = 0;
  let layers: ReturnType<typeof createLayer>[] = [];

  const draw = () => {
    const { width, height } = canvas;
    const margin = edgeMargin * lastDpr;
    const spanWidth = width + 2 * margin;
    const spanHeight = height + 2 * margin;
    const slope = 0.36 + 0.38 * (1 - Math.min(1, width / height));
    context.clearRect(0, 0, width, height);

    for (const layer of layers) {
      const offset = time * layer.speed;
      for (const star of layer.stars) {
        // Wrap beyond the visible edges so points can enter and leave without a jump.
        const x = (star.x + offset) % spanWidth - margin;
        const y = (star.y + offset * slope) % spanHeight - margin;
        if (x < -star.size || x >= width || y < -star.size || y >= height) continue;

        const pulse = time * star.twinkleRate;
        const shimmer = 0.7 * Math.sin(pulse + star.phase)
          + 0.3 * Math.sin(pulse * 1.73 + star.phase * 2.37);
        context.globalAlpha = star.opacity * (1 + (0.10 + 0.10 * y / height) * shimmer);
        context.fillStyle = star.color;
        context.fillRect(x, y, star.size, star.size);
      }
    }
  };

  function paint(now: number) {
    const elapsed = now - (previous ?? now);
    if (previous === undefined || elapsed >= 32) {
      time += Math.min(elapsed, 100) / 1000;
      previous = now;
      draw();
    }
    frame = requestAnimationFrame(paint);
  }

  function syncPlayback() {
    const active = inView && !document.hidden && !motion.matches;
    if (active && frame === undefined) {
      frame = requestAnimationFrame(paint);
    } else if (!active && frame !== undefined) {
      cancelAnimationFrame(frame);
      frame = undefined;
      previous = undefined;
    }
  }

  const resize = () => {
    const { clientWidth, clientHeight } = canvas;
    if (!clientWidth || !clientHeight) return;

    const dpr = window.devicePixelRatio || 1;
    const width = Math.round(clientWidth * dpr);
    const height = Math.round(clientHeight * dpr);
    if (width === canvas.width && height === canvas.height && dpr === lastDpr) return;
    lastDpr = dpr;
    canvas.width = width;
    canvas.height = height;
    const padding = 2 * edgeMargin * dpr;
    layers = starLayers.map(config => createLayer(width + padding, height + padding, dpr, config));
    draw();
  };

  resize();
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(canvas);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      syncPlayback();
    }).observe(canvas);
  }
  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', syncPlayback);
  motion.addEventListener('change', syncPlayback);
  syncPlayback();
}
