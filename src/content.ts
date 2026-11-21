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
  category?: string;
  access?: 'Open source' | 'Protected';
  description: string;
  author: string;
}

export const premiumIndicators: PremiumIndicator[] = [
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
  {
    id: 'opening-auction-profile', name: 'Opening Auction Profile',
    description: 'Profile a configurable opening window for each UTC session and extend its value levels. Volume at each price is estimated from chart OHLCV.',
    author: 'TZack',
  },
  {
    id: 'pivot-volume-confluence', name: 'Pivot Volume Confluence',
    description: 'Highlight confirmed price pivots that line up with high-volume levels in a rolling profile. Volume at each price is estimated from chart OHLCV.',
    author: 'TZack',
  },
  {
    id: 'multi-horizon-value-nodes', name: 'Multi Horizon Value Nodes', category: 'Volume', access: 'Open source',
    description: 'Compare estimated volume profiles over 7, 30, 60, 180, and 365 bars. Each profile allocates volume across candle bodies and wicks.',
    author: 'TZack',
  },
  {
    id: 'range-participation-density', name: 'Range Participation Density', category: 'Volume', access: 'Open source',
    description: 'Track price participation over a rolling window. Each candle’s full volume counts at every price level it crosses.',
    author: 'TZack',
  },
  {
    id: 'bounded-auction-profile', name: 'Bounded Auction Profile', category: 'Volume', access: 'Open source',
    description: 'Set Unix start and end times to build a fixed auction profile. Volume at each price is estimated from chart OHLCV.',
    author: 'TZack',
  },
  {
    id: 'swing-auction-map', name: 'Swing Auction Map', category: 'Volume', access: 'Open source',
    description: 'Anchor an estimated volume profile to the latest swing pivot. Subsequent bars confirm the pivot, and the profile uses chart OHLCV.',
    author: 'TZack',
  },
  {
    id: 'session-value-atlas', name: 'Session Value Atlas', category: 'Volume', access: 'Open source',
    description: 'Compare historical value areas across UTC sessions with a configurable start hour. Volume at each price is estimated from chart OHLCV.',
    author: 'TZack',
  },
  {
    id: 'calendar-value-ledger', name: 'Calendar Value Ledger', category: 'Volume', access: 'Open source',
    description: 'Track completed and developing weekly volume profiles. Each week starts on Monday UTC, and volume at each price is estimated from chart OHLCV.',
    author: 'TZack',
  },
  {
    id: 'imbalance-streak-signal', name: 'Imbalance Streak Signal', category: 'Structure', access: 'Open source',
    description: 'Mark qualifying gap zones and track streaks of gaps in the same direction. ATR filtering and candle confirmation refine the signals.',
    author: 'TZack',
  },
  {
    id: 'inversion-transition-zones', name: 'Inversion Transition Zones', category: 'Structure', access: 'Open source',
    description: 'Track gap zones that flip direction when invalidated. Each inverted zone stays active until price breaches its far edge in the opposite direction.',
    author: 'TZack',
  },
  {
    id: 'gap-rejection-watch', name: 'Gap Rejection Watch', category: 'Structure', access: 'Open source',
    description: 'Flag one rejection per qualifying gap after a two-bar wait. Set the minimum gap size manually or use 14-period ATR, with wick-based invalidation.',
    author: 'TZack',
  },
  {
    id: 'momentum-gap-spectrum', name: 'Momentum Gap Spectrum', category: 'Structure', access: 'Open source',
    description: 'Filter gaps by size and candle direction, then measure momentum with smoothed RSI of percentage returns. Each gap retains its initial momentum reading.',
    author: 'TZack',
  },
  {
    id: 'gap-auction-detail', name: 'Gap Auction Detail', category: 'Structure', access: 'Open source',
    description: 'Filter gaps against the rolling average of recent gap widths, avoid overlapping zones, and track fills at the far edge.',
    author: 'TZack',
  },
];
