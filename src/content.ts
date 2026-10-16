/** Set a local image path here when product screenshots are available.
 * Files placed in public/images/ are referenced as /images/example.webp.
 * Empty src values leave the finished, empty frame in place (no broken image).
 */
export const productImages = {
  platform: { src: '', alt: 'MarketStream multi-asset trading workspace' },
  depth: { src: '', alt: 'MarketStream market depth and liquidity analysis' },
  intelligence: { src: '', alt: 'MarketStream AI assistant and indicator builder' },
} satisfies Record<string, { src: string; alt: string }>;

export interface PremiumIndicator {
  id: string;
  name: string;
  level: 'L1' | 'L2' | null;
  category: string;
  description: string;
  image: { src: string; alt: string };
  favorites: number | null;
}

// Favorite counts are design placeholders, not measured usage. Replace with
// real counts (or null) before launch. Add entries here to extend the carousel.
export const premiumIndicators: PremiumIndicator[] = [
  {
    id: 'aggressive-order-flow', name: 'Aggressive Order Flow', level: 'L1', category: 'Order flow',
    description: 'See who’s driving the move. Track aggressive buying and selling in real time to reveal which side is taking control.',
    image: { src: '', alt: 'Aggressive Order Flow indicator preview' }, favorites: 1847,
  },
  {
    id: 'whale-movement', name: 'Whale Movement', level: null, category: 'Large participants',
    description: 'Follow the size behind the move. Surface outsized trading activity and see where the market’s biggest participants are stepping in.',
    image: { src: '', alt: 'Whale Movement indicator preview' }, favorites: 1632,
  },
  {
    id: 'spoofing-detector', name: 'Spoofing Detector', level: 'L2', category: 'Liquidity',
    description: 'Look past the pressure. Flag large orders that appear and vanish, helping you spot liquidity that may be more illusion than intent.',
    image: { src: '', alt: 'Spoofing Detector indicator preview' }, favorites: 978,
  },
  {
    id: 'iceberg-detector', name: 'Iceberg Detector', level: 'L2', category: 'Hidden liquidity',
    description: 'Uncover what’s beneath the book. Identify repeatedly replenished orders that can reveal larger positions working quietly below the surface.',
    image: { src: '', alt: 'Iceberg Detector indicator preview' }, favorites: 1256,
  },
  {
    id: 'limit-order-heatmap', name: 'Limit Order Heatmap', level: 'L2', category: 'Liquidity',
    description: 'Put liquidity on the map. See resting orders beside price in a live heatmap, revealing the levels that could shape the next move.',
    image: { src: '', alt: 'Limit Order Heatmap indicator preview' }, favorites: 1923,
  },
  {
    id: 'absorption-detector', name: 'Absorption Detector', level: 'L2', category: 'Order flow',
    description: 'See where conviction meets resistance. Detect heavy buying or selling absorbed by passive liquidity, revealing potential turning points.',
    image: { src: '', alt: 'Absorption Detector indicator preview' }, favorites: 864,
  },
  {
    id: 'trap-detector', name: 'Trap Detector', level: 'L2', category: 'Price structure',
    description: 'Catch the breakout that doesn’t hold. Identify failed moves and the trapped positions that can fuel a sharp reversal.',
    image: { src: '', alt: 'Trap Detector indicator preview' }, favorites: 743,
  },
  {
    id: 'exhaustion-detector', name: 'Exhaustion Detector', level: 'L2', category: 'Momentum',
    description: 'Know when a move is losing its drive. Spot aggressive flow delivering less price progress, an early clue that momentum may be fading.',
    image: { src: '', alt: 'Exhaustion Detector indicator preview' }, favorites: 589,
  },
  {
    id: 'delta-divergence-signal', name: 'Delta Divergence Signal', level: 'L2', category: 'Order flow',
    description: 'See when price and participation part ways. Flag new price extremes that aggressive order flow doesn’t confirm, before you chase the move.',
    image: { src: '', alt: 'Delta Divergence Signal indicator preview' }, favorites: 1128,
  },
  {
    id: 'institutional-order-blocks', name: 'Institutional Order Blocks', level: 'L2', category: 'Price structure',
    description: 'Map the zones that matter. Combine order flow and liquidity to highlight potential institutional positioning and levels worth watching on a return.',
    image: { src: '', alt: 'Institutional Order Blocks indicator preview' }, favorites: 467,
  },
];
