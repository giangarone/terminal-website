import { createAuroraRenderer, type AuroraPalette } from './aurora.ts';

export interface IndicatorWave {
  canvas: HTMLCanvasElement;
  palette: AuroraPalette;
}

const WIDTH = 360;
const HEIGHT = 200;
const FRAME_INTERVAL = 1000 / 30;
const VISIBLE_FRACTION = 0.01;

export function initIndicatorWaves(waves: IndicatorWave[], motion: MediaQueryList) {
  if (!waves.length || !('IntersectionObserver' in window)) return;

  const source = document.createElement('canvas');
  source.width = WIDTH;
  source.height = HEIGHT;

  const visible = new Set<HTMLCanvasElement>();
  let renderer: ReturnType<typeof createAuroraRenderer>;
  let initialized = false;
  let frame: number | undefined;
  let lastPaint: number | undefined;
  let time = 4;
  let needsPaint = true;

  function syncPlayback() {
    if (!visible.size || document.hidden || (motion.matches && !needsPaint)) {
      if (frame !== undefined) cancelAnimationFrame(frame);
      frame = undefined;
      lastPaint = undefined;
      return;
    }

    if (!initialized) {
      initialized = true;
      renderer = createAuroraRenderer(source, true);
    }
    if (renderer && frame === undefined) frame = requestAnimationFrame(paint);
  }

  function paint(now: number) {
    frame = undefined;
    const elapsed = lastPaint === undefined ? 0 : now - lastPaint;
    // Allow for minor variation in refresh timing on 60 Hz displays.
    if (renderer && (lastPaint === undefined || elapsed >= FRAME_INTERVAL - 1)) {
      if (!motion.matches) time += Math.min(elapsed, 100) * 0.00075;
      for (const [index, { canvas, palette }] of waves.entries()) {
        if (!visible.has(canvas)) continue;
        const context = canvas.getContext('2d', { alpha: false });
        if (!context) continue;
        renderer.setPalette(palette);
        renderer.draw(time + index * 1.9, 1.5);
        context.drawImage(source, 0, 0);
        canvas.classList.add('is-ready');
      }
      lastPaint = now;
      needsPaint = false;
    }
    syncPlayback();
  }

  // Observing against the viewport also accounts for clipping by the carousel.
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      const canvas = entry.target as HTMLCanvasElement;
      if (entry.intersectionRatio >= VISIBLE_FRACTION) {
        visible.add(canvas);
        needsPaint = true;
      } else {
        visible.delete(canvas);
      }
    }
    syncPlayback();
  }, { threshold: VISIBLE_FRACTION });
  for (const { canvas } of waves) {
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    observer.observe(canvas);
  }

  const onContextLost = (event: Event) => {
    event.preventDefault();
    renderer = null;
    syncPlayback();
  };
  const onContextRestored = () => {
    renderer = createAuroraRenderer(source, true);
    needsPaint = true;
    syncPlayback();
  };
  source.addEventListener('webglcontextlost', onContextLost);
  source.addEventListener('webglcontextrestored', onContextRestored);
  document.addEventListener('visibilitychange', syncPlayback);
  motion.addEventListener('change', syncPlayback);

  import.meta.hot?.dispose(() => {
    observer.disconnect();
    if (frame !== undefined) cancelAnimationFrame(frame);
    source.removeEventListener('webglcontextlost', onContextLost);
    source.removeEventListener('webglcontextrestored', onContextRestored);
    document.removeEventListener('visibilitychange', syncPlayback);
    motion.removeEventListener('change', syncPlayback);
    renderer?.dispose();
  });
}
