// Aurora background for the closing section.
// WebGL domain-warped gradient, cloned from luxalgo.com.
const CONFIG = {
  colorA: '#0d8ed6',
  colorB: '#19282f',
  brightness: 1,
  speed: 0.55,
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
uniform float uSpread;
uniform float uDiag;
uniform vec2 uEdgeFade;

vec3 warp3d(vec3 pos, float t) {
  float curv = 0.8;
  float a = 1.9;
  float b = 0.7;
  pos *= 2.0;
  pos.x += curv * sin(t + a * pos.y) + t * b;
  pos.y += curv * cos(t + a * pos.x);
  pos.y += curv * sin(t + a * pos.z) + t * b;
  pos.z += curv * cos(t + a * pos.y);
  pos.z += curv * sin(t + a * pos.x) + t * b;
  pos.x += curv * cos(t + a * pos.z);
  return 0.5 + 0.5 * cos(pos + vec3(1.0, 2.0, 4.0));
}

void main() {
  vec2 uv = 2.0 * vUv - 1.0;
  vec3 w = pow(warp3d(vec3(uv.x, sin(uv.y), uv.y), uTime), vec3(1.5));
  vec3 col = 1.5 * uColorA * w.x;
  col *= w.y;
  col += uColorB * w.z;
  col *= smoothstep(uSpread, 1.0, abs(uv.y));
  float m = smoothstep(uDiag, 1.0, -uv.y * uv.x);
  col *= m * m;
  float edgeFade = uv.y > 0.0 ? uEdgeFade.x : uEdgeFade.y;
  col *= smoothstep(0.0, max(edgeFade, 0.0001), 1.0 - abs(uv.y));
  col *= uIntensity;
  // Monochrome: drop hue, keep luminance.
  col = vec3(dot(col, vec3(0.299, 0.587, 0.114)));
  float n = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
  col += (n - 0.5) / 255.0;
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
  if (!gl) return () => {};

  const initial = setup(gl);
  if (!initial) return () => {};
  let state: AuroraState = initial;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let startTime = 0;
  let running = false;
  let queued = false;
  let frame = 0;

  const draw = (now: number) => {
    if (!startTime) startTime = now;
    const elapsed = now - startTime;
    gl.uniform1f(state.uTime, (now / 1000) * CONFIG.speed);
    const fade = reducedMotion.matches ? 1 : Math.max(0, Math.min(1, (elapsed - 200) / 1500));
    gl.uniform1f(state.uIntensity, CONFIG.brightness * CONFIG.alpha * fade);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  const resize = () => {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (!width || !height) return;
    const scale = Math.min(0.5, 1536 / width);
    const nextWidth = Math.max(1, Math.round(width * scale));
    const nextHeight = Math.max(1, Math.round(height * scale));
    if (canvas.width === nextWidth && canvas.height === nextHeight) return;
    canvas.width = nextWidth;
    canvas.height = nextHeight;
    gl.viewport(0, 0, nextWidth, nextHeight);
    if (reducedMotion.matches) draw(12000);
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

  const observer = new IntersectionObserver(entries => {
    running = entries[0].isIntersecting;
    kick();
  });
  observer.observe(canvas);

  if (reducedMotion.matches) draw(12000);

  const onContextLost = (event: Event) => {
    event.preventDefault();
    cancelAnimationFrame(frame);
  };
  const onContextRestored = () => {
    const next = setup(gl);
    if (next) state = next;
  };
  canvas.addEventListener('webglcontextlost', onContextLost);
  canvas.addEventListener('webglcontextrestored', onContextRestored);

  return () => {
    observer.disconnect();
    resizeObserver.disconnect();
    cancelAnimationFrame(frame);
    canvas.removeEventListener('webglcontextlost', onContextLost);
    canvas.removeEventListener('webglcontextrestored', onContextRestored);
    gl.deleteBuffer(state.buffer);
    gl.deleteProgram(state.program);
    gl.getExtension('WEBGL_lose_context')?.loseContext();
  };
}
