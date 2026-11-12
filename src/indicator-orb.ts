import vertexSource from './shaders/elevenlabs-orb.vert.glsl?raw';
import fragmentSource from './shaders/elevenlabs-orb.frag.glsl?raw';

// Original ElevenLabs homepage shaders, textures and idle configuration.
// See docs/indicator-orbs.md for provenance and the zero-audio fluid state.
const IDLE_SETTINGS = {
  uCircleSize: 1,
  uAlpha: 1,
  uExposure: 0.15,
  uContrast: 0,
  uSaturation: 1,
  uNoiseOpacity: 0,
  uAnimatedNoise: 0,
  uNoiseSpeed: 0.25,
  uNoiseAmplitude: 0.15,
  uNoiseScale: 0.65,
  uSphereScale: 0.9,
  uSpherePower: 1.1,
  uFluidColorOpacity: 0.1,
  uRingColorOpacity: 0.25,
  uFbmScale: 3.25,
  uFbmPower: 2.75,
  uFbmAmplitude: 0.65,
  uFbmSpeed: 4.5,
  uFadeInDuration: 0,
};

export function initIndicatorOrb(canvas: HTMLCanvasElement, textureSrc: string) {
  const gl = canvas.getContext('webgl2', {
    alpha: true, premultipliedAlpha: true, antialias: false,
    depth: false, stencil: false, powerPreference: 'low-power',
  });
  if (!gl) return;

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const image = new Image();
  let program: WebGLProgram | null = null;
  let buffer: WebGLBuffer | null = null;
  let texture: WebGLTexture | null = null;
  let fluidTexture: WebGLTexture | null = null;
  let timeLocation: WebGLUniformLocation | null = null;
  let resolutionLocation: WebGLUniformLocation | null = null;
  let ready = false;
  let visible = false;
  let disposed = false;
  let frame = 0;
  let previousTime = 0;
  let time = 0;

  function deleteResources() {
    gl!.deleteProgram(program);
    gl!.deleteBuffer(buffer);
    gl!.deleteTexture(texture);
    gl!.deleteTexture(fluidTexture);
    program = buffer = texture = fluidTexture = null;
  }

  function setup() {
    const shaders: WebGLShader[] = [];
    for (const [type, source] of [[gl!.VERTEX_SHADER, vertexSource], [gl!.FRAGMENT_SHADER, fragmentSource]] as const) {
      const shader = gl!.createShader(type);
      if (!shader) {
        shaders.forEach(shader => gl!.deleteShader(shader));
        return false;
      }
      gl!.shaderSource(shader, source);
      gl!.compileShader(shader);
      shaders.push(shader);
      if (!gl!.getShaderParameter(shader, gl!.COMPILE_STATUS)) {
        shaders.forEach(shader => gl!.deleteShader(shader));
        return false;
      }
    }
    program = gl!.createProgram();
    if (program) {
      shaders.forEach(shader => gl!.attachShader(program!, shader));
      gl!.linkProgram(program);
    }
    shaders.forEach(shader => gl!.deleteShader(shader));
    if (!program || !gl!.getProgramParameter(program, gl!.LINK_STATUS)) return false;
    buffer = gl!.createBuffer();
    texture = gl!.createTexture();
    fluidTexture = gl!.createTexture();
    if (!buffer || !texture || !fluidTexture) return false;
    gl!.useProgram(program);
    gl!.bindBuffer(gl!.ARRAY_BUFFER, buffer);
    // Same full-screen triangle and UVs as the original OGL Triangle geometry.
    gl!.bufferData(gl!.ARRAY_BUFFER, new Float32Array([
      -1, -1, 0, 0, 3, -1, 2, 0, -1, 3, 0, 2,
    ]), gl!.STATIC_DRAW);
    for (const [name, offset] of [['position', 0], ['uv', 8]] as const) {
      const location = gl!.getAttribLocation(program, name);
      gl!.enableVertexAttribArray(location);
      gl!.vertexAttribPointer(location, 2, gl!.FLOAT, false, 16, offset);
    }
    for (const [name, value] of Object.entries(IDLE_SETTINGS)) {
      gl!.uniform1f(gl!.getUniformLocation(program, name), value);
    }
    for (const name of ['uAudioAverage', 'uAudioAverageInput', 'uCumulativeAudio']) {
      gl!.uniform4f(gl!.getUniformLocation(program, name), 0, 0, 0, 0);
    }
    gl!.uniform3f(gl!.getUniformLocation(program, 'uFluidColor'), 1, 1, 1);
    gl!.uniform1i(gl!.getUniformLocation(program, 'uTexture'), 0);
    gl!.uniform1i(gl!.getUniformLocation(program, 'uFluidSimTexture'), 1);
    timeLocation = gl!.getUniformLocation(program, 'uTime');
    resolutionLocation = gl!.getUniformLocation(program, 'uResolution');

    gl!.activeTexture(gl!.TEXTURE1);
    gl!.bindTexture(gl!.TEXTURE_2D, fluidTexture);
    // With no audio, the original simulation has no splats and stays RGB zero.
    // Bind that exact resting state instead of running empty simulation passes.
    gl!.texImage2D(gl!.TEXTURE_2D, 0, gl!.RGBA, 1, 1, 0, gl!.RGBA, gl!.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 255]));
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MIN_FILTER, gl!.LINEAR);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MAG_FILTER, gl!.LINEAR);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_S, gl!.CLAMP_TO_EDGE);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_T, gl!.CLAMP_TO_EDGE);
    return true;
  }

  function uploadTexture() {
    if (!ready || !image.naturalWidth || disposed) return;
    gl!.activeTexture(gl!.TEXTURE0);
    gl!.bindTexture(gl!.TEXTURE_2D, texture);
    gl!.pixelStorei(gl!.UNPACK_FLIP_Y_WEBGL, true);
    gl!.texImage2D(gl!.TEXTURE_2D, 0, gl!.RGBA, gl!.RGBA, gl!.UNSIGNED_BYTE, image);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MIN_FILTER, gl!.LINEAR_MIPMAP_LINEAR);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MAG_FILTER, gl!.LINEAR);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_S, gl!.CLAMP_TO_EDGE);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_T, gl!.CLAMP_TO_EDGE);
    gl!.generateMipmap(gl!.TEXTURE_2D);
    gl!.uniform2f(gl!.getUniformLocation(program!, 'uTextureResolution'), image.naturalWidth, image.naturalHeight);
    resize();
    updateMotion();
  }
  function draw() {
    if (!ready || !image.naturalWidth) return;
    gl!.uniform1f(timeLocation, reducedMotion.matches ? 8 : time);
    gl!.drawArrays(gl!.TRIANGLES, 0, 3);
  }
  function resize() {
    if (!ready) return;
    const size = Math.max(1, Math.round(canvas.clientWidth * Math.min(devicePixelRatio, 2)));
    canvas.width = canvas.height = Math.min(size, 512);
    gl!.viewport(0, 0, canvas.width, canvas.height);
    gl!.uniform2f(resolutionLocation, canvas.width, canvas.height);
    draw();
  }
  function tick(now: number) {
    const delta = previousTime ? Math.min((now - previousTime) / 1000, 0.05) : 0;
    previousTime = now;
    time += delta * 1.4; // Original homepage timeScale.
    draw();
    frame = requestAnimationFrame(tick);
  }
  function updateMotion() {
    cancelAnimationFrame(frame);
    previousTime = 0;
    if (!ready || !visible || document.hidden || !image.naturalWidth || disposed) return;
    if (reducedMotion.matches) draw();
    else frame = requestAnimationFrame(tick);
  }
  const lost = (event: Event) => {
    event.preventDefault();
    ready = false;
    updateMotion();
  };
  const restored = () => {
    ready = setup();
    if (!ready) { deleteResources(); return; }
    uploadTexture();
  };
  ready = setup();
  if (!ready) { deleteResources(); return; }
  const observer = new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    updateMotion();
  });
  observer.observe(canvas);
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);
  reducedMotion.addEventListener('change', updateMotion);
  document.addEventListener('visibilitychange', updateMotion);
  canvas.addEventListener('webglcontextlost', lost);
  canvas.addEventListener('webglcontextrestored', restored);
  image.onload = uploadTexture;
  image.src = textureSrc;

  const dispose = () => {
    disposed = true;
    cancelAnimationFrame(frame);
    observer.disconnect();
    resizeObserver.disconnect();
    reducedMotion.removeEventListener('change', updateMotion);
    document.removeEventListener('visibilitychange', updateMotion);
    canvas.removeEventListener('webglcontextlost', lost);
    canvas.removeEventListener('webglcontextrestored', restored);
    image.onload = null;
    deleteResources();
  };
  if (import.meta.hot) import.meta.hot.dispose(dispose);
  return dispose;
}
