#version 300 es
precision highp float;

in vec2 uv;
in vec3 position;

out vec2 vUv;

void main() {
    vUv = vec2(1.0 - uv.x, uv.y); // Flip UV.x for correct orientation
    gl_Position = vec4(position, 1.0);
}
