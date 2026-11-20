export function initHeroStars() {
  const canvas = document.querySelector<HTMLCanvasElement>('.hero-stars');
  const context = canvas?.getContext('2d');
  if (!canvas || !context) return;
  let lastDpr = 0;

  const draw = () => {
    const { clientWidth, clientHeight } = canvas;
    if (!clientWidth || !clientHeight) return;

    const dpr = window.devicePixelRatio || 1;
    const width = Math.round(clientWidth * dpr);
    const height = Math.round(clientHeight * dpr);
    if (width === canvas.width && height === canvas.height && dpr === lastDpr) return;
    lastDpr = dpr;
    canvas.width = width;
    canvas.height = height;

    // Keep the same positions on reload and while the hero resizes.
    let seed = 71087;
    const random = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 0x100000000;
    };

    const count = Math.round(clientWidth * clientHeight / 1200);
    context.fillStyle = '#eeeaff';
    for (let i = 0; i < count; i++) {
      const x = random();
      const y = random();
      const brightness = random();
      const diameter = brightness > 0.97 ? 1.5 : 0.8;
      const size = Math.max(1, Math.round(diameter * dpr));
      context.globalAlpha = 0.15 + 0.60 * brightness ** 2;
      context.fillRect(Math.floor(x * (width - size + 1)), Math.floor(y * (height - size + 1)), size, size);
    }
  };

  draw();
  if ('ResizeObserver' in window) new ResizeObserver(draw).observe(canvas);
  window.addEventListener('resize', draw);
}
