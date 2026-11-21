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
  level?: 'L1' | 'L2';
  category?: string;
  access?: 'Open source' | 'Protected';
  description: string;
  author: string;
}

export const premiumIndicators: PremiumIndicator[] = [
  // Author names for the original five cards are fictional placeholders.
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
  {
    id: '9-100-ema-cross', name: '9/100 EMA CROSS', category: 'Trend', access: 'Open source',
    description: 'Track crossovers between the 9-period and 100-period exponential moving averages to see when short-term momentum shifts relative to the longer trend.',
    author: 'Gabs[Prime]',
  },
  {
    id: 'auction-balance-compare', name: 'Auction Balance Compare', category: 'Volume', access: 'Open source',
    description: 'Compare the two latest equal-length auction windows on the same price grid. Volume at each price is estimated from the chart’s OHLCV data.',
    author: 'TZack',
  },
  {
    id: 'volume-footprint', name: 'Volume Footprint', access: 'Open source',
    description: 'See how volume was distributed by price within each recent candle, using the trades recorded during that candle.',
    author: 'VanHelsing',
  },
  {
    id: 'sa-iceberg-1s-ts', name: 'sa_iceberg_1s TS',
    description: 'This test version flags potential iceberg orders as they occur at price levels where executed volume exceeds displayed size. Hover over a mark for details.',
    author: 'Saad',
  },
  {
    id: 'historical-bookmap', name: 'Historical BookMap', access: 'Open source',
    description: 'See where large bids and asks rested as price moved. A heatmap behind the candles uses brighter cells to show larger orders.',
    author: 'VanHelsing',
  },
  {
    id: 'orderbook-delta-oscillator', name: 'OrderBook Delta Oscillator (Bid/Ask Delta)', category: 'Momentum', access: 'Protected',
    description: 'Track the rolling imbalance between resting Level 2 bids and asks inside a band around price that expands or contracts with average true range.',
    author: 'VanHelsing',
  },
  {
    id: 'fixed-range-profile', name: 'Fixed Range Profile', access: 'Open source',
    description: 'Plot a volume profile for a selected chart range to see which price levels saw the most trading.',
    author: 'VanHelsing',
  },
  {
    id: 'l2-liquidity-heatmap', name: 'L2 Liquidity Heatmap', access: 'Open source',
    description: 'See live Level 2 order book depth, liquidity walls, and aggressive trades directly on your chart.',
    author: 'VanHelsing',
  },
  {
    id: 'l2-liquidity-cluster-order-blocks', name: 'L2 Liquidity Cluster Order Blocks', access: 'Protected',
    description: 'Highlight clusters of large resting orders as price zones on your chart using Level 2 order book data.',
    author: 'VanHelsing',
  },
  {
    id: 'orderbook-volume-matrix-heatmap', name: 'Orderbook Volume Matrix Heatmap', access: 'Open source',
    description: 'See where resting liquidity built up over a rolling window. The heatmap aggregates recorded Level 2 order book size at each price.',
    author: 'VanHelsing',
  },
  {
    id: 'prism-volume-profile', name: 'Prism Volume Profile', category: 'Volume', access: 'Protected',
    description: 'See where futures traded during each session. Horizontal bars beside the candles show how much volume traded at each price.',
    author: 'Melek',
  },
  {
    id: 'liquidation-heatmap', name: 'Liquidation heatmap', access: 'Open source',
    description: 'See where large resting orders have built up behind the candles. Levels disappear from the heatmap once price trades through them.',
    author: 'VanHelsing',
  },
  {
    id: 'moving-average-suite', name: 'Moving Average Suite', access: 'Protected',
    description: 'Combine multiple moving averages and smooth each one with an optional second moving average.',
    author: 'DigitalLRS',
  },
  {
    id: 'orderflow-absorption-whale-tracker', name: 'Orderflow Absorption & Whale Tracker', category: 'Volatility', access: 'Open source',
    description: 'See aggressive trades grouped into medium and whale-size tiers. The indicator flags candles where heavy buying or selling was absorbed.',
    author: 'nesmill',
  },
  {
    id: 'prism-absorption', name: 'Prism Absorption', category: 'Volume', access: 'Protected',
    description: 'Spot candles where heavy trading at a price level produced little movement beyond it. The indicator evaluates trades when each candle closes.',
    author: 'Melek',
  },
];
