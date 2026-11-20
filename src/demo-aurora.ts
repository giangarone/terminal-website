import fragmentSource from './shaders/demo-aurora.frag.glsl?raw';

const vertexSource = `#version 300 es
in vec2 aPosition;
out vec2 vUv;
void main() {
  vUv = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

interface Palette {
  background: Float32Array;
  base: Float32Array;
  highlight: Float32Array;
  warm?: { amber: Float32Array; vermilion: Float32Array };
}

function readColor(style: CSSStyleDeclaration, property: string, gamma: number) {
  const hex = style.getPropertyValue(property).trim();
  const value = parseInt(hex.slice(1), 16);
  const channels = [(value >> 16) & 255, (value >> 8) & 255, value & 255];
  return new Float32Array(channels.map(channel => (channel / 255) ** gamma));
}

function compileShader(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  return shader;
}

function createNoiseTexture(gl: WebGL2RenderingContext) {
  // Keep in sync with the sampling scale in the fragment shader.
  const size = 32;
  const texture = gl.createTexture();
  if (!texture) return null;
  const values = new Uint8Array(size ** 3);
  const fraction = (value: number) => value - Math.floor(value);
  let index = 0;
  for (let z = 0; z < size; z++) {
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const px = fraction(x * 0.1031);
        const py = fraction(y * 0.1030);
        const pz = fraction(z * 0.0973);
        const offset = px * (py + 33.33) + py * (px + 33.33) + pz * (pz + 33.33);
        values[index++] = Math.round(255 * fraction((px + py + 2 * offset) * (pz + offset)));
      }
    }
  }
  gl.bindTexture(gl.TEXTURE_3D, texture);
  gl.texStorage3D(gl.TEXTURE_3D, 1, gl.R8, size, size, size);
  gl.texSubImage3D(gl.TEXTURE_3D, 0, 0, 0, 0, size, size, size, gl.RED, gl.UNSIGNED_BYTE, values);
  gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  return texture;
}

function createRenderer(canvas: HTMLCanvasElement) {
  const gl = canvas.getContext('webgl2', {
    alpha: false,
    depth: false,
    stencil: false,
    antialias: false,
    powerPreference: 'low-power',
  });
  if (!gl) return null;

  const program = gl.createProgram();
  if (!program) return null;
  const vertex = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragment = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  if (vertex && fragment) {
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
  }
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }

  const buffer = gl.createBuffer();
  if (!buffer || !createNoiseTexture(gl)) {
    gl.deleteBuffer(buffer);
    gl.deleteProgram(program);
    return null;
  }
  gl.useProgram(program);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, 'aPosition');
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

  gl.uniform1i(gl.getUniformLocation(program, 'uNoise'), 0);
  const uAspect = gl.getUniformLocation(program, 'uAspect');
  const uTime = gl.getUniformLocation(program, 'uTime');
  const uBackground = gl.getUniformLocation(program, 'uBackground');
  const uBase = gl.getUniformLocation(program, 'uBase');
  const uHighlight = gl.getUniformLocation(program, 'uHighlight');
  const uHero = gl.getUniformLocation(program, 'uHero');
  const uBrandPalette = gl.getUniformLocation(program, 'uBrandPalette');
  const uAmber = gl.getUniformLocation(program, 'uAmber');
  const uVermilion = gl.getUniformLocation(program, 'uVermilion');

  return (time: number, palette: Palette, width: number, height: number, isHero: boolean) => {
    gl.viewport(0, 0, width, height);
    gl.uniform1f(uAspect, width / height);
    gl.uniform1f(uTime, time);
    gl.uniform3fv(uBackground, palette.background);
    gl.uniform3fv(uBase, palette.base);
    gl.uniform3fv(uHighlight, palette.highlight);
    gl.uniform1i(uHero, isHero ? 1 : 0);
    gl.uniform1i(uBrandPalette, palette.warm ? 1 : 0);
    if (palette.warm) {
      gl.uniform3fv(uAmber, palette.warm.amber);
      gl.uniform3fv(uVermilion, palette.warm.vermilion);
    }
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };
}

export function initAuroraBackdrops() {
  const hero = document.querySelector<HTMLCanvasElement>('.hero-aurora canvas');
  const canvases = [...document.querySelectorAll<HTMLCanvasElement>('.product-demo-aurora canvas')];
  if (hero) canvases.unshift(hero);
  if (!canvases.length || !('IntersectionObserver' in window)) return;

  const source = document.createElement('canvas');
  source.width = 720;
  source.height = 480;
  const palettes = new Map<HTMLCanvasElement, Palette>(canvases.map(canvas => {
    const style = getComputedStyle(canvas);
    const palette: Palette = {
      background: readColor(style, '--background', 1),
      base: readColor(style, '--aurora-base', 2.2),
      highlight: readColor(style, '--aurora-highlight', 2.2),
    };
    if (canvas.closest('.aurora--brand')) {
      palette.warm = {
        amber: readColor(style, '--aurora-amber', 2.2),
        vermilion: readColor(style, '--aurora-vermilion', 2.2),
      };
    }
    return [canvas, palette];
  }));
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const visible = new Set<HTMLCanvasElement>();
  let draw: ReturnType<typeof createRenderer>;
  let initialized = false;
  let frame: number | undefined;
  let previous: number | undefined;
  let needsPaint = true;
  let time = 0;

  function syncPlayback() {
    const active = draw && visible.size > 0 && !document.hidden && (needsPaint || !motion.matches);
    if (active && frame === undefined) {
      frame = requestAnimationFrame(paint);
    } else if (!active) {
      if (frame !== undefined) cancelAnimationFrame(frame);
      frame = undefined;
      previous = undefined;
    }
  }

  function paint(now: number) {
    frame = undefined;
    const elapsed = previous === undefined ? 0 : now - previous;
    if (draw && (needsPaint || previous === undefined || elapsed >= 40)) {
      if (!motion.matches) time += Math.min(elapsed, 100) / 1000;
      // Render each visible palette with a single shared WebGL context.
      for (const canvas of visible) {
        const context = canvas.getContext('2d', { alpha: false });
        const palette = palettes.get(canvas);
        if (!context || !palette) continue;
        const { width, height } = canvas;
        const phase = canvas === hero ? time : time + 4;
        draw(phase, palette, width, height, canvas === hero);
        // WebGL's viewport starts at the bottom left of the shared surface.
        context.drawImage(source, 0, source.height - height, width, height, 0, 0, width, height);
        canvas.classList.add('is-ready');
      }
      needsPaint = false;
      previous = now;
    }
    syncPlayback();
  }

  if (hero) {
    const resize = () => {
      const bounds = hero.getBoundingClientRect();
      const scale = Math.min(0.5, source.width / bounds.width, source.height / bounds.height);
      const width = Math.max(1, Math.round(bounds.width * scale));
      const height = Math.max(1, Math.round(bounds.height * scale));
      if (hero.width === width && hero.height === height) return;
      hero.width = width;
      hero.height = height;
      needsPaint = true;
      syncPlayback();
    };
    resize();
    if ('ResizeObserver' in window) new ResizeObserver(resize).observe(hero);
  }

  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      const canvas = entry.target as HTMLCanvasElement;
      if (entry.isIntersecting) {
        visible.add(canvas);
        needsPaint = true;
      } else {
        visible.delete(canvas);
      }
    }
    if (visible.size && !initialized) {
      draw = createRenderer(source);
      initialized = true;
    }
    syncPlayback();
  });
  canvases.forEach(canvas => observer.observe(canvas));
  motion.addEventListener('change', syncPlayback);
  document.addEventListener('visibilitychange', syncPlayback);
  source.addEventListener('webglcontextlost', event => {
    event.preventDefault();
    draw = null;
    canvases.forEach(canvas => canvas.classList.remove('is-ready'));
    syncPlayback();
  });
  source.addEventListener('webglcontextrestored', () => {
    draw = createRenderer(source);
    needsPaint = true;
    syncPlayback();
  });
}
