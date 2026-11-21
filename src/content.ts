/** Set a local image path here when product screenshots are available.
 * Files placed in public/images/ are referenced as /images/example.webp.
 * Empty src values leave the finished, empty frame in place (no broken image).
 */
export const productImages = {
  depth: { src: '', alt: 'MarketStream market depth and liquidity analysis' },
} satisfies Record<string, { src: string; alt: string }>;

export interface PremiumIndicator {
  id: string;
  name: string;
  level: 'L1' | 'L2' | null;
  category: string;
  description: string;
  author: string;
}

// Author names are fictional placeholders. Add entries here to extend the carousel.
export const premiumIndicators: PremiumIndicator[] = [
  {
    id: 'exhaustion', name: 'Exhaustion', level: 'L2', category: 'Momentum',
    description: 'Spot when buying or selling pressure fades and a move starts to lose momentum.',
    author: 'Mara Voss',
  },
  {
    id: 'flowprint-blocks', name: 'Flowprint Blocks', level: 'L2', category: 'Liquidity',
    description: 'See where buy and sell orders cluster, and track how price reacts when it reaches those levels.',
    author: 'Nolan Vance',
  },
  {
    id: 'liquidation-prints', name: 'Liquidation Prints', level: 'L1', category: 'Liquidations',
    description: 'See forced exits on perpetual futures charts. Red bubbles below candles mark long liquidations, and green bubbles above mark short liquidations.',
    author: 'Lina Calder',
  },
  {
    id: 'prime-support-resistance', name: 'Prime Support & Resistance', level: 'L1', category: 'Order flow',
    description: 'See potential support and resistance directly on your chart. Our servers calculate each level from executed market trades.',
    author: 'Dev Saran',
  },
  {
    id: 'footprint', name: 'Footprint', level: 'L1', category: 'Order flow',
    description: 'See how much traded at the bid and ask at every price within each candle. Fine-tune the view with dedicated footprint settings.',
    author: 'Tessa Vale',
  },
];
