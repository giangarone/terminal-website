#version 300 es
precision highp float;
precision highp sampler3D;
in vec2 vUv;
out vec4 fragColor;
uniform float uTime;
uniform float uAspect;
uniform vec3 uBackground;
uniform vec3 uBase;
uniform vec3 uHighlight;
uniform bool uHero;
uniform bool uBrandPalette;
uniform vec3 uAmber;
uniform vec3 uVermilion;
uniform sampler3D uNoise;
const vec3 VOLUME_LOW = vec3(-250.0, 50.0, -500.0);
const vec3 VOLUME_HIGH = vec3(250.0, 125.0, 500.0);
const vec3 EYE = vec3(0.0, 10.0, 0.0);
float hash(vec3 p) {
  p = fract(p * vec3(0.1031, 0.1030, 0.0973));
  p += dot(p, p.yxz + 33.33);
  return fract((p.x + p.y) * p.z);
}
float lineGradient(float cell) {
  vec3 p = fract(vec3(cell) * 0.1031);
  p += dot(p, p.yzx + 19.19);
  float h = fract((p.x + p.y) * p.z);
  return mod(floor(h * 1e4), 2.0) == 0.0 ? 1.0 : -1.0;
}
float lineNoise(float point) {
  float cell = floor(point);
  float t = fract(point);
  float weight = t * t * t * (t * (6.0 * t - 15.0) + 10.0);
  return 2.0 * mix(lineGradient(cell) * t, lineGradient(cell + 1.0) * (t - 1.0), weight);
}
float volumeNoise(vec3 point) {
  vec3 t = fract(point);
  // Hardware trilinear sampling replaces eight hashes per noise sample.
  vec3 cell = floor(point) + t * t * (3.0 - 2.0 * t);
  return texture(uNoise, (cell + 0.5) / 32.0).r;
}
float curtainDensity(vec3 point, float timeFlow) {
  float height = (point.y - VOLUME_LOW.y) / (VOLUME_HIGH.y - VOLUME_LOW.y);
  vec3 warped = 0.04 * vec3(point.x, 2.0 * timeFlow, 0.225 * point.z + timeFlow * 0.5);
  warped.xz += 19.6 * vec2(17.3, 29.1);
  warped.x += 0.3 * height + 5.5 * cos(0.005 * point.z);
  warped.x += 0.02 * lineNoise(0.1 * point.z + timeFlow * 2.0);
  float noise = 1.0 - (volumeNoise(warped)
    + 0.5 * volumeNoise(2.0 * warped) + 0.25 * volumeNoise(4.0 * warped)) / 1.75;
  float vertical = 0.48 + 0.006 * (point.y - VOLUME_LOW.y)
    + 0.015 * (lineNoise(timeFlow + warped.z) + lineNoise(-2.0 * timeFlow + warped.z));
  float radiance = pow(0.3025 / (2.0 * noise * noise + vertical * vertical), 6.0);
  return radiance * max(0.0, cos(0.13 * warped.x));
}
vec2 traceAurora(vec3 direction) {
  vec3 a = (VOLUME_LOW - EYE) / direction;
  vec3 b = (VOLUME_HIGH - EYE) / direction;
  vec3 nearPlane = min(a, b);
  vec3 farPlane = max(a, b);
  float nearDist = max(max(nearPlane.x, nearPlane.y), max(nearPlane.z, 10.0));
  float farDist = min(min(farPlane.x, farPlane.y), farPlane.z);
  if (farDist <= nearDist) return vec2(0.0);
  int steps = uHero ? 44 : 32;
  float stepSize = (farDist - nearDist) / float(steps);
  float offset = 0.35 + 0.3 * hash(vec3(gl_FragCoord.xy, 7.0));
  vec3 point = EYE + direction * (nearDist + offset * stepSize);
  vec3 stepVector = direction * stepSize;
  float timeFlow = uTime * 0.65;
  vec2 light = vec2(0.0);
  for (int i = 0; i < steps; i++) {
    float height = (point.y - VOLUME_LOW.y) / (VOLUME_HIGH.y - VOLUME_LOW.y);
    light += curtainDensity(point, timeFlow) * vec2(1.0 - height, height);
    point += stepVector;
  }
  return 0.05 * stepSize * light;
}
vec3 toneMap(vec3 light) {
  return clamp((light * (2.51 * light + 0.03)) / (light * (2.43 * light + 0.59) + 0.14), 0.0, 1.0);
}
vec3 brandPalette(float hue) {
  vec3 indigoToPurple = mix(uBase, uHighlight, smoothstep(0.08, 0.35, hue));
  vec3 amberToVermilion = mix(uAmber, uVermilion, smoothstep(0.65, 0.94, hue));
  return mix(indigoToPurple, amberToVermilion, smoothstep(0.35, 0.65, hue));
}
void main() {
  vec2 sceneUv = vUv;
  float aspect = uAspect;
  if (uHero) {
    // Match the reference hero's upper curtain and fade it into the full backdrop.
    const float curtainHeight = 0.70;
    sceneUv.y = (vUv.y - (1.0 - curtainHeight)) / curtainHeight;
    aspect /= curtainHeight;
  }
  float fade = smoothstep(0.04, 0.40, sceneUv.y);
  if (fade <= 0.0) {
    fragColor = vec4(uBackground, 1.0);
    return;
  }
  // Keep the curtains in view as the canvas gets taller relative to its width.
  float pitch = mix(0.31, 0.45, smoothstep(0.6, 1.6, aspect));
  vec3 forward = normalize(vec3(
    -0.4 + sin(uTime * 0.1) * 0.1,
    pitch + cos(uTime * 0.05) * 0.05,
    -1.0
  ));
  vec3 right = normalize(cross(forward, vec3(0.0, 1.0, 0.0)));
  vec3 up = cross(right, forward);
  vec2 screen = (2.0 * sceneUv - 1.0) * vec2(aspect, 1.0);
  vec3 direction = normalize(forward * 1.73205 + right * screen.x + up * screen.y);
  vec2 glow = traceAurora(direction) * fade;
  vec3 gamma = vec3(1.0 / 2.2);
  // Give the headline some separation from the brightest parts of the curtains.
  float exposure = mix(0.55, 0.82, smoothstep(0.0, 0.9, abs(2.0 * sceneUv.x - 1.0)));
  vec3 light;
  if (uBrandPalette) {
    // Fit the full palette inside the FAQ backdrop's cropped, masked edges.
    float paletteX = uHero ? sceneUv.x : (sceneUv.x - 0.20) / 0.55;
    float hue = paletteX + 0.12 * (sceneUv.y - 0.5) + 0.025 * sin(4.0 * sceneUv.y + uTime * 0.2);
    vec3 aurora = brandPalette(hue) * toneMap(vec3(glow.x + glow.y));
    light = pow(aurora, gamma) * exposure;
  } else {
    light = pow(toneMap(uBase * glow.x + uHighlight * glow.y), gamma) * exposure;
  }
  fragColor = vec4(uBackground + (1.0 - uBackground) * light, 1.0);
}
