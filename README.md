# PrimeTerminal

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

Marketing copy, FAQs, and the three mock plans are in `index.html`. Prices are USD monthly: Free $0, Pro $49, Elite $99. The mock plan buttons have no handlers or links, and use `aria-disabled="true"`. All acquisition links point to `#pricing`.

Color, surface, typography, and spacing rules live in `src/style.css`; palette variables are declared at the top. The PrimeTerminal brand is plain text. Decorative hero lighting is CSS only and stops off-screen, in hidden tabs, or when reduced motion is preferred.

## Live prices

`src/market-feed.ts` opens one public connection to `wss://ws-feed.exchange.coinbase.com` for BTC-USD, ETH-USD, and SOL-USD. It subscribes to `ticker_batch` (changed prices approximately every five seconds) and per-product heartbeats. No API credentials are required.

Percentages use `(price - open_24h) / open_24h * 100`. Only validated provider messages populate prices. A 15-second watchdog detects silent or incomplete feeds. Disconnects retain the last real quote with a stale status; initial failures remain empty. Reconnection backs off from 1 to 30 seconds and requires refreshed quotes for all three assets before returning to Live. Source timestamps and sequences are validated; older sequences are ignored. All connections and timers are cleaned up when the page closes, including back/forward-cache restoration.

The landing-page feed is Coinbase crypto spot data. NASDAQ/CME capability descriptions are separate product content. Browser or network restrictions can prevent the public feed; the rest of the site remains usable.

Provider documentation: https://docs.cdp.coinbase.com/exchange/websocket-feed/channels

## Asset provenance

Official project artwork is stored locally and unmodified:

- Bitcoin: `public/assets/bitcoin.svg`, from Bitcoin.org's official repository: https://raw.githubusercontent.com/bitcoin-dot-org/Bitcoin.org/master/img/icons/but_bitcoin.svg
- Ethereum: `public/assets/ethereum.png`, from ethereum.org's official repository: https://raw.githubusercontent.com/ethereum/ethereum-org-website/dev/public/images/eth-logo-grey.png
- Solana: `public/assets/solana.svg`, from the official brand kit: https://solana.com/src/img/branding/solanaLogoMark.svg — guidelines: https://solana.com/branding
- Inter variable font: https://github.com/rsms/inter — SIL Open Font License is included at `public/fonts/OFL.txt`.

Brand marks identify the quoted assets; no partnership or endorsement is implied.

## Publishing

The contents of `dist/` can be served by any static host. If the host enforces a Content Security Policy, allow `connect-src wss://ws-feed.exchange.coinbase.com`; images and fonts are local. This repository contains no sign-in flow, payment processing, trading engine, or deployment configuration.
