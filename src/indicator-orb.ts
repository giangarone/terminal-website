import type { PremiumIndicator } from './content.ts';

// A procedural, grain-textured sphere. All color and movement are generated
// locally; no image, video, audio or third-party runtime is required.
const vertexSource = `
attribute vec2 position;
varying vec2 uv;
void main() {
  uv = position;
  gl_Position = vec4(position, 0.0, 1.0);
}`;

const fragmentSource = `
precision highp float;
varying vec2 uv;
uniform float time;
uniform float resolution;
uniform vec3 baseColor;
uniform vec3 midColor;
uniform vec3 highlightColor;
uniform vec3 accentColor;

float hash(vec3 p) {
  p = fract(p * 0.3183099 + vec3(0.1, 0.2, 0.3));
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}
float noise(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x),
                 mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
                 mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
}
void main() {
  float radius = length(uv);
  float edge = 1.0 - smoothstep(1.0 - 3.0 / resolution, 1.0, radius);
  vec3 sphere = vec3(uv, sqrt(max(0.0, 1.0 - dot(uv, uv))));
  float t = time * 0.22;
  vec3 p = sphere * 2.4;
  p.x += 0.55 * sin(p.y * 1.7 + t);
  p.y += 0.45 * sin(p.z * 1.9 - t * 0.8);
  p.z += t * 0.35;
  float flow = noise(p + 1.3 * noise(p * 0.85 + vec3(t * 0.3, 0.0, -t * 0.2)));
  float fold = sin(flow * 9.0 + sphere.y * 2.2 - t * 0.6) * 0.5 + 0.5;
  vec3 color = mix(baseColor, midColor, smoothstep(0.1, 0.85, fold));
  float pearl = smoothstep(0.48, 0.85, noise(p * 0.9 + vec3(5.0, -t * 0.4, 1.0)));
  color = mix(color, highlightColor, pearl * 0.95);
  float lilac = smoothstep(0.4, 0.78, noise(p + vec3(-3.0, 2.0, t * 0.2)));
  color = mix(color, accentColor, lilac * (1.0 - pearl) * 0.75);
  float light = max(0.0, dot(sphere, normalize(vec3(-0.6, 0.7, 1.1))));
  color *= 0.46 + light * 0.65;
  color += midColor * pow(1.0 - sphere.z, 3.0) * 0.28;
  // Static screen-space grain avoids flicker while the underlying folds flow.
  float grain = hash(vec3(gl_FragCoord.xy, 1.0)) - 0.5;
  color += grain * 0.12;
  gl_FragColor = vec4(clamp(color, 0.0, 1.0), edge);
}`;

export function initIndicatorOrb(canvas: HTMLCanvasElement, card: HTMLElement, palette: PremiumIndicator['orb']) {
  const gl = canvas.getContext('webgl', {
    alpha: true, premultipliedAlpha: false, antialias: false,
    depth: false, stencil: false, powerPreference: 'low-power',
  });
  if (!gl) return; // The CSS sphere remains visible without WebGL.

  let program: WebGLProgram | null = null;
  let buffer: WebGLBuffer | null = null;
  let timeLocation: WebGLUniformLocation | null = null;
  let resolutionLocation: WebGLUniformLocation | null = null;
  let ready = false;
  let visible = false;
  let frame = 0;
  let previousTime = 0;
  let time = 8;
  let speed = 1;
  let hovered = false;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

  function setup() {
    const shaders: WebGLShader[] = [];
    for (const [type, source] of [[gl!.VERTEX_SHADER, vertexSource], [gl!.FRAGMENT_SHADER, fragmentSource]] as const) {
      const shader = gl!.createShader(type);
      if (!shader) return false;
      gl!.shaderSource(shader, source);
      gl!.compileShader(shader);
      shaders.push(shader);
      if (!gl!.getShaderParameter(shader, gl!.COMPILE_STATUS)) {
        shaders.forEach(shader => gl!.deleteShader(shader));
        return false;
      }
    }
    program = gl!.createProgram();
    if (!program) return false;
    shaders.forEach(shader => gl!.attachShader(program!, shader));
    gl!.linkProgram(program);
    shaders.forEach(shader => gl!.deleteShader(shader));
    if (!gl!.getProgramParameter(program, gl!.LINK_STATUS)) return false;
    buffer = gl!.createBuffer();
    if (!buffer) return false;
    gl!.useProgram(program);
    for (const [name, hex] of Object.entries(palette)) {
      const rgb = [1, 3, 5].map(offset => parseInt(hex.slice(offset, offset + 2), 16) / 255);
      gl!.uniform3fv(gl!.getUniformLocation(program, `${name}Color`), rgb);
    }
    gl!.bindBuffer(gl!.ARRAY_BUFFER, buffer);
    gl!.bufferData(gl!.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl!.STATIC_DRAW);
    const position = gl!.getAttribLocation(program, 'position');
    gl!.enableVertexAttribArray(position);
    gl!.vertexAttribPointer(position, 2, gl!.FLOAT, false, 0, 0);
    timeLocation = gl!.getUniformLocation(program, 'time');
    resolutionLocation = gl!.getUniformLocation(program, 'resolution');
    return true;
  }

  function draw() {
    if (!ready) return;
    gl!.uniform1f(timeLocation, time);
    gl!.uniform1f(resolutionLocation, canvas.width);
    gl!.drawArrays(gl!.TRIANGLES, 0, 3);
  }
  function resize() {
    if (!ready) return;
    const size = Math.max(1, Math.round(canvas.clientWidth * Math.min(devicePixelRatio, 2)));
    canvas.width = canvas.height = Math.min(size, 512);
    gl!.viewport(0, 0, canvas.width, canvas.height);
    draw();
  }
  function tick(now: number) {
    frame = 0;
    const delta = previousTime ? Math.min((now - previousTime) / 1000, 0.05) : 0;
    previousTime = now;
    speed += ((hovered ? 2 : 1) - speed) * Math.min(1, delta * 3);
    time += delta * speed;
    draw();
    frame = requestAnimationFrame(tick);
  }
  function updateMotion() {
    cancelAnimationFrame(frame);
    frame = 0;
    previousTime = 0;
    if (!ready || !visible || document.hidden) return;
    if (reducedMotion.matches) draw();
    else frame = requestAnimationFrame(tick);
  }
  const enter = () => { hovered = true; };
  const leave = () => { hovered = false; };
  const lost = (event: Event) => {
    event.preventDefault();
    ready = false;
    updateMotion();
  };
  const restored = () => {
    ready = setup();
    resize();
    updateMotion();
  };
  ready = setup();
  if (!ready) return;
  resize();
  const observer = new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    updateMotion();
  });
  observer.observe(canvas);
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);
  card.addEventListener('pointerenter', enter);
  card.addEventListener('pointerleave', leave);
  card.addEventListener('focusin', enter);
  card.addEventListener('focusout', leave);
  reducedMotion.addEventListener('change', updateMotion);
  document.addEventListener('visibilitychange', updateMotion);
  canvas.addEventListener('webglcontextlost', lost);
  canvas.addEventListener('webglcontextrestored', restored);

  return () => {
    cancelAnimationFrame(frame);
    observer.disconnect();
    resizeObserver.disconnect();
    card.removeEventListener('pointerenter', enter);
    card.removeEventListener('pointerleave', leave);
    card.removeEventListener('focusin', enter);
    card.removeEventListener('focusout', leave);
    reducedMotion.removeEventListener('change', updateMotion);
    document.removeEventListener('visibilitychange', updateMotion);
    canvas.removeEventListener('webglcontextlost', lost);
    canvas.removeEventListener('webglcontextrestored', restored);
    gl.deleteProgram(program);
    gl.deleteBuffer(buffer);
  };
}
