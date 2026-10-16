# MarketStream

A static, responsive marketing homepage built with semantic HTML, plain CSS, TypeScript, and Vite. No framework, backend, or runtime dependencies.

## Run locally

Requires Node 22.18+ (Node 24+ recommended).

```sh
npm install
npm run dev
```

`npm run build` checks TypeScript and produces `dist/`. `npm run preview` serves that production build. `npm test` runs the market-feed tests with Node's built-in test runner. `npm run typecheck` checks types independently.

## Replace the three product images

Place screenshots in `public/images/`, then set `src` and `alt` for the appropriate entry in `src/content.ts`:

| Slot | Purpose | Desktop frame |
| --- | --- | --- |
| `platform` | Full trading workspace | 2.25:1 |
| `depth` | Order book / market-depth screenshot | 4:3 |
| `intelligence` | AI assistant / indicator builder | 4:3 |

Example source: `/images/platform.webp`. Empty sources render empty charcoal frames with reserved dimensions, no broken-image requests, and no public placeholder messages. Images fill their frames using `object-fit: cover`; use matching crops for the best fit. Frames adapt on smaller screens.

## Edit content and pricing

### Premium indicators

The indicator showcase follows market depth. Edit or add entries in `premiumIndicators` in `src/content.ts`; card rendering and carousel navigation adapt automatically. Names stay unchanged.

Each entry has an empty image source ready for a screenshot (approximately 1.8:1). Include the deployment base in image paths, e.g. `/terminal-website/images/indicator.webp` for the current GitHub Pages setup. Empty or failed images leave a clean charcoal frame.

Favorite counts are invented design placeholders between 200 and 2,000, requested for the mockup. Replace them with verified counts before launch; `null` displays an em dash. The “View indicator” buttons are intentionally inactive and marked `aria-disabled`.

The collection supports touch swiping, trackpad scrolling, previous/next buttons, and Left/Right/Home/End keys when focused. Reduced-motion preferences disable animated scrolling.

Marketing copy, FAQs, and the three mock plans are in `index.html`. Prices are USD monthly: Free $0, Pro $49, Elite $99. The mock plan buttons have no handlers or links, and use `aria-disabled="true"`. All acquisition links point to `#pricing`.

Color, surface, typography, and spacing rules live in `src/style.css`; palette variables are declared at the top. The MarketStream brand is plain text. Decorative lighting uses CSS gradients, a soft horizon, and a small static SVG grain texture. Motion stops off-screen, in hidden tabs, or when reduced motion is preferred.

## Reusable atmospheric backgrounds

Add `class="atmosphere-section" data-atmosphere` to a section. `src/atmosphere.ts` supplies overlapping silver light plumes, a softly illuminated horizon, and subtle grain automatically. Keep content in a child container and background artwork out of entrance-animation selectors. For a full-width treatment, put `.container` on that child instead of the section.

- Default: a monochrome illuminated horizon, used in the closing section.
- Add `atmosphere-subtle` for a quieter treatment, used in the hero.
- Override `--atmosphere-intensity` on the section to tune opacity (0–1).

Two overlapping light plumes rise continuously in seven- and nine-second cycles above a stationary horizon. Each expands and fades out before resetting, with staggered timing to avoid a synchronized pulse or reversing sweep. Only transforms and opacity animate. Reduced motion retains a static composition. Without JavaScript the original dark background and all content remain available.

## Live prices

`src/market-feed.ts` opens one public connection to `wss://ws-feed.exchange.coinbase.com` for BTC-USD, ETH-USD, and SOL-USD. It subscribes to `ticker_batch` (changed prices approximately every five seconds) and per-product heartbeats. No API credentials are required.

Percentages use `(price - open_24h) / open_24h * 100`. Only validated provider messages populate prices. A 15-second watchdog detects silent or incomplete feeds. Disconnects retain the last real quote with a stale status; initial failures remain empty. Reconnection backs off from 1 to 30 seconds and requires refreshed quotes for all three assets before returning to Live. Source timestamps and sequences are validated; older sequences are ignored. All connections and timers are cleaned up when the page closes, including back/forward-cache restoration.

The landing-page feed is Coinbase crypto spot data. NASDAQ/CME capability descriptions are separate product content. Browser or network restrictions can prevent the public feed; the rest of the site remains usable.

Provider documentation: https://docs.cdp.coinbase.com/exchange/websocket-feed/channels

## Asset provenance

Coin icons are local files provided for this site (`public/assets/btc.png`, `eth.png`, `sol.png`).
Brand marks identify the quoted assets; no partnership or endorsement is implied.

- Inter variable font: https://github.com/rsms/inter — SIL Open Font License is included at `public/fonts/OFL.txt`.

## Publishing

The public repository is https://github.com/giangarone/terminal-website and the live site is https://giangarone.github.io/terminal-website/.

GitHub Pages uses **GitHub Actions** as its deployment source. Each push to `main` runs `.github/workflows/deploy.yml`, which installs dependencies, runs the tests, builds the site, and publishes only `dist/`. The workflow can also be run manually from the Actions tab. Do not configure Pages to serve the source folder directly: browsers need the compiled JavaScript and CSS produced by Vite.

`vite.config.js` sets the base path to `/terminal-website/` so scripts, styles, fonts, and images load under the GitHub Pages project URL. To deploy at a different path or a custom domain, update `base` accordingly and rebuild.

The contents of `dist/` can also be served by other static hosts at the configured base path. If the host enforces a Content Security Policy, allow `connect-src wss://ws-feed.exchange.coinbase.com`; images and fonts are local. This repository contains no sign-in flow, payment processing, or trading engine.
