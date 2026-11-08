// Ocean-blue aurora behind the hero, with deeper folds and cyan highlights.
const CONFIG = {
  colorA: '#0987FF',
  colorB: '#064DB8',
  colorC: '#07BCFA',
  brightness: 1,
  speed: 0.52,
  spread: 0.27,
  diag: -1,
  alpha: 2,
};

const VERTEX_SHADER = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const FRAGMENT_SHADER = `
precision highp float;

varying vec2 vUv;
uniform float uTime;
uniform float uIntensity;
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform vec3 uColorC;
uniform vec3 uBackground;
uniform float uSpread;
uniform float uDiag;
uniform vec2 uEdgeFade;

vec3 warp3d(vec3 pos, float t) {
  // Unequal fold widths and independent drift give the light its own rhythm.
  pos *= vec3(1.9, 2.05, 1.85);
  pos.x += 0.78 * sin(0.86 * t + 1.82 * pos.y + 0.35) + t * 0.54;
  pos.y += 0.70 * cos(0.72 * t + 2.08 * pos.x);
  pos.y += 0.82 * sin(0.94 * t + 1.74 * pos.z + 0.60) + t * 0.60;
  pos.z += 0.66 * cos(0.78 * t + 1.96 * pos.y);
  pos.z += 0.76 * sin(0.90 * t + 1.88 * pos.x) + t * 0.48;
  pos.x += 0.72 * cos(0.82 * t + 1.80 * pos.z);
  return 0.5 + 0.5 * cos(pos + vec3(0.8, 2.3, 4.25));
}

void main() {
  vec2 uv = 2.0 * vUv - 1.0;
  // Bend the folds gently without moving the hero's outer fade boundaries.
  vec2 flowUv = uv + vec2(
    0.08 * sin(2.4 * uv.y + 0.33 * uTime),
    0.045 * sin(2.0 * uv.x - 0.22 * uTime + 0.4)
  );
  // GPU rounding can push cosine-derived values below zero; fractional pow
  // is undefined there and produces black specks. Keep its input in range.
  vec3 wave = clamp(warp3d(vec3(flowUv.x, sin(flowUv.y), flowUv.y), uTime), 0.0, 1.0);
  vec3 w = pow(wave, vec3(1.5));
  vec3 tint = mix(uColorB, uColorA, smoothstep(0.1, 0.9, w.y));
  tint = mix(tint, uColorC, 0.6 * smoothstep(0.25, 0.9, w.z));
  float density = 0.9 * w.x * w.y + 0.65 * w.z;
  density *= smoothstep(uSpread, 1.0, abs(uv.y));
  float m = smoothstep(uDiag, 1.0, -uv.y * uv.x);
  density *= m * m;
  float edgeFade = uv.y > 0.0 ? uEdgeFade.x : uEdgeFade.y;
  density *= smoothstep(0.0, max(edgeFade, 0.0001), 1.0 - abs(uv.y));
  // Compress bright folds smoothly to keep the blue glow soft.
  float glow = 1.0 - exp(-density * uIntensity);
  // Compose the smooth screen-style glow directly against the page color.
  vec3 col = uBackground + (1.0 - uBackground) * tint * glow;
  // The opaque result already matches the page at the edges, avoiding a
  // second gradient in alpha and another CSS blending/quantization step.
  gl_FragColor = vec4(col, 1.0);
}`;

function hexToRgb(hex: string): Float32Array {
  const value = parseInt(hex.slice(1), 16);
  return new Float32Array([
    ((value >> 16) & 255) / 255,
    ((value >> 8) & 255) / 255,
    (value & 255) / 255,
  ]);
}

function buildProgram(gl: WebGLRenderingContext): WebGLProgram | null {
  const compile = (type: number, source: string): WebGLShader | null => {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return shader;
  };

  const vertex = compile(gl.VERTEX_SHADER, VERTEX_SHADER);
  const fragment = compile(gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
  if (!vertex || !fragment) return null;

  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }
  return program;
}

interface AuroraState {
  program: WebGLProgram;
  buffer: WebGLBuffer;
  uTime: WebGLUniformLocation | null;
  uIntensity: WebGLUniformLocation | null;
}

function setup(gl: WebGLRenderingContext): AuroraState | null {
  const program = buildProgram(gl);
  if (!program) return null;
  gl.useProgram(program);

  const buffer = gl.createBuffer();
  if (!buffer) return null;
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

  const position = gl.getAttribLocation(program, 'aPos');
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

  gl.uniform3fv(gl.getUniformLocation(program, 'uColorA'), hexToRgb(CONFIG.colorA));
  gl.uniform3fv(gl.getUniformLocation(program, 'uColorB'), hexToRgb(CONFIG.colorB));
  gl.uniform3fv(gl.getUniformLocation(program, 'uColorC'), hexToRgb(CONFIG.colorC));
  const background = getComputedStyle(document.documentElement).getPropertyValue('--background').trim();
  gl.uniform3fv(gl.getUniformLocation(program, 'uBackground'), hexToRgb(background));
  gl.uniform1f(gl.getUniformLocation(program, 'uSpread'), CONFIG.spread);
  gl.uniform1f(gl.getUniformLocation(program, 'uDiag'), CONFIG.diag);
  gl.uniform2f(gl.getUniformLocation(program, 'uEdgeFade'), 0.2, 0.32);

  return {
    program,
    buffer,
    uTime: gl.getUniformLocation(program, 'uTime'),
    uIntensity: gl.getUniformLocation(program, 'uIntensity'),
  };
}

export function initAurora(canvas: HTMLCanvasElement): () => void {
  const gl = canvas.getContext('webgl', {
    alpha: false,
    depth: false,
    stencil: false,
    antialias: false,
    powerPreference: 'low-power',
  });
  if (!gl) return () => { };

  const initial = setup(gl);
  if (!initial) return () => { };
  let state: AuroraState = initial;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let startTime = 0;
  let running = false;
  let queued = false;
  let frame = 0;
  let inView = false;
  let contextLost = false;

  const draw = (now: number) => {
    if (!startTime && !reducedMotion.matches) startTime = now;
    const elapsed = now - startTime;
    const animationTime = reducedMotion.matches ? 12000 : now;
    gl.uniform1f(state.uTime, (animationTime / 1000) * CONFIG.speed);
    const fade = reducedMotion.matches ? 1 : Math.max(0, Math.min(1, (elapsed - 200) / 1500));
    gl.uniform1f(state.uIntensity, CONFIG.brightness * CONFIG.alpha * fade);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  const resize = () => {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (!width || !height) return;
    // Render at CSS-pixel resolution and cap wide-screen buffers to keep
    // the decorative effect lightweight.
    const scale = Math.min(1, 1536 / width);
    const nextWidth = Math.max(1, Math.round(width * scale));
    const nextHeight = Math.max(1, Math.round(height * scale));
    if (canvas.width === nextWidth && canvas.height === nextHeight) return;
    canvas.width = nextWidth;
    canvas.height = nextHeight;
    gl.viewport(0, 0, nextWidth, nextHeight);
    if (reducedMotion.matches && !contextLost) draw(12000);
  };

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);
  resize();

  const renderFrame = (now: number) => {
    draw(now);
    if (running) frame = requestAnimationFrame(renderFrame);
    else queued = false;
  };
  const kick = () => {
    if (!queued && running) {
      queued = true;
      frame = requestAnimationFrame(renderFrame);
    }
  };

  const updateMotion = () => {
    running = inView && !document.hidden && !reducedMotion.matches && !contextLost;
    if (running) kick();
    else {
      cancelAnimationFrame(frame);
      queued = false;
      if (reducedMotion.matches && inView && !document.hidden && !contextLost) draw(12000);
    }
  };
  const observer = new IntersectionObserver(entries => {
    inView = entries[0].isIntersecting;
    updateMotion();
  });
  observer.observe(canvas);
  reducedMotion.addEventListener('change', updateMotion);
  document.addEventListener('visibilitychange', updateMotion);

  if (reducedMotion.matches) draw(12000);

  const onContextLost = (event: Event) => {
    event.preventDefault();
    contextLost = true;
    updateMotion();
  };
  const onContextRestored = () => {
    const next = setup(gl);
    if (!next) return;
    state = next;
    contextLost = false;
    gl.viewport(0, 0, canvas.width, canvas.height);
    updateMotion();
  };
  canvas.addEventListener('webglcontextlost', onContextLost);
  canvas.addEventListener('webglcontextrestored', onContextRestored);

  return () => {
    observer.disconnect();
    resizeObserver.disconnect();
    cancelAnimationFrame(frame);
    reducedMotion.removeEventListener('change', updateMotion);
    document.removeEventListener('visibilitychange', updateMotion);
    canvas.removeEventListener('webglcontextlost', onContextLost);
    canvas.removeEventListener('webglcontextrestored', onContextRestored);
    gl.deleteBuffer(state.buffer);
    gl.deleteProgram(state.program);
    gl.getExtension('WEBGL_lose_context')?.loseContext();
  };
}
