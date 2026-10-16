/** Set a local image path here when product screenshots are available.
 * Files placed in public/images/ are referenced as /images/example.webp.
 * Empty src values leave the finished, empty frame in place (no broken image).
 */
export const productImages = {
  platform: { src: '', alt: 'MarketStream multi-asset trading workspace' },
  depth: { src: '', alt: 'MarketStream market depth and liquidity analysis' },
  intelligence: { src: '', alt: 'MarketStream AI assistant and indicator builder' },
} satisfies Record<string, { src: string; alt: string }>;
