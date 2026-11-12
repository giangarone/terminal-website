/** Set a local image path here when product screenshots are available.
 * Files placed in public/images/ are referenced as /images/example.webp.
 * Empty src values leave the finished, empty frame in place (no broken image).
 */
export const productImages = {
  platform: { src: '', alt: 'MarketStream multi-asset trading workspace' },
  depth: { src: '', alt: 'MarketStream market depth and liquidity analysis' },
} satisfies Record<string, { src: string; alt: string }>;

export interface PremiumIndicator {
  id: string;
  name: string;
  level: 'L1' | 'L2' | null;
  category: string;
  description: string;
  orb: { base: string; mid: string; highlight: string; accent: string };
  userCount: number | null;
}

// User counts are design placeholders. Replace with verified counts (or null)
// before launch. Add entries here to extend the carousel.
export const premiumIndicators: PremiumIndicator[] = [
  {
    id: 'exhaustion', name: 'Exhaustion', level: 'L2', category: 'Momentum',
    description: 'Spot when buying or selling pressure fades and a move starts to lose momentum.',
    orb: { base: '#1f3887', mid: '#6e61c7', highlight: '#b8d4fa', accent: '#c483c9' }, userCount: 782,
  },
  {
    id: 'flowprint-blocks', name: 'Flowprint Blocks', level: 'L2', category: 'Liquidity',
    description: 'See where buy and sell orders cluster, and track how price reacts when it reaches those levels.',
    orb: { base: '#064f46', mid: '#209f82', highlight: '#bcf5df', accent: '#72d5af' }, userCount: 1084,
  },
  {
    id: 'liquidation-prints', name: 'Liquidation Prints', level: 'L1', category: 'Liquidations',
    description: 'See forced exits on perpetual futures charts. Red bubbles below candles mark long liquidations, and green bubbles above mark short liquidations.',
    orb: { base: '#8c222c', mid: '#e15d49', highlight: '#ffe1b0', accent: '#f3a166' }, userCount: 947,
  },
  {
    id: 'prime-support-resistance', name: 'Prime Support & Resistance', level: 'L1', category: 'Order flow',
    description: 'See potential support and resistance directly on your chart. Our servers calculate each level from executed market trades.',
    orb: { base: '#5b3b10', mid: '#c38c2c', highlight: '#fff1bb', accent: '#e9bd65' }, userCount: 1316,
  },
  {
    id: 'footprint', name: 'Footprint', level: 'L1', category: 'Order flow',
    description: 'See how much traded at the bid and ask at every price within each candle. Fine-tune the view with dedicated footprint settings.',
    orb: { base: '#103d70', mid: '#288bc2', highlight: '#c3efff', accent: '#72d7e3' }, userCount: 1542,
  },
];
