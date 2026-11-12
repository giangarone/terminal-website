# Indicator orb rendering

The indicator cards use the original idle orb renderer from the ElevenLabs
homepage, captured on November 12, 2026. The two files in `src/shaders/` are
unchanged shader strings captured from the browser's `shaderSource` calls.
They are upstream code, not authored by MarketStream. No license for the
homepage bundle was identified; this is not the separately published,
MIT-licensed ElevenLabs UI Orb component.

## Source

Homepage: https://elevenlabs.io/

Rendering module:
https://eleven-public-cdn.elevenlabs.io/marketing_website/_next/static/chunks/43355.1686bf45c3b93a1a.js

The local WebGL2 host in `src/indicator-orb.ts` supplies the original triangle,
UV orientation, texture filtering, uniforms, premultiplied alpha, and 1.4 time
scale. It does not import the homepage's React runtime or analytics.

## Texture assets

These original 512×512 textures are bundled locally, so visitors make no
requests to ElevenLabs:

| Local asset | Original filename |
| --- | --- |
| violet.webp | creative-5.d389d3b1.webp |
| green.webp | creative-20.adb7c7e5.webp |
| coral.webp | creative-1.18030cd4.webp |
| gold.webp | creative-19.0a16dfaf.webp |
| blue.webp | creative-10.ff95f095.webp |
| noise.avif | noise@20aq.289c1f1d.avif |
| noise.png | noise.24b8225d.png |

Source directory:
https://eleven-public-cdn.elevenlabs.io/marketing_website/_next/static/media/

## Idle behavior

The homepage's fluid simulation only injects splats when audio changes.
With all audio uniforms at zero, its RGB texture remains zero. These cards
have no audio, so a zero-valued texture supplies the identical resting input
without running the empty simulation passes. The original shader still
performs its FBM and simplex texture distortion, sphere projection and color
correction. Audio-reactive behavior is not implemented here.

The homepage's separate grain overlay is also retained: the original noise
asset, nested overlay blending, 0.5 opacity, and 256px tile size (128px on
high-density displays). The shader itself has grain disabled, as upstream.

The site's small centered layout and palette-colored backdrop are retained.
Animation pauses outside the viewport or in a hidden tab. Reduced motion
renders a fixed frame. A CSS orb remains as a fallback if WebGL2 or a texture
is unavailable; lost graphics contexts restore their resources and textures.
