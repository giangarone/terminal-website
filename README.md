# MarketStream

A static, responsive marketing homepage built with semantic HTML, plain CSS, TypeScript, and Vite. No framework, backend, or runtime dependencies.

## Run locally

Requires Node 22.18+ (Node 24+ recommended).

```sh
npm install
npm run dev
```

`npm run build` checks TypeScript and produces `dist/`. `npm run preview` serves that production build. `npm run typecheck` checks types independently.

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

Color, surface, typography, and spacing rules live in `src/style.css`; palette variables are declared at the top. The MarketStream brand is plain text. Decorative hero lighting is CSS only and stops off-screen, in hidden tabs, or when reduced motion is preferred.

## Asset provenance

Coin icons are local files provided for this site (`public/assets/btc.png`, `eth.png`, `sol.png`).
Brand marks identify the illustrated assets; no partnership or endorsement is implied.

- Inter variable font: https://github.com/rsms/inter — SIL Open Font License is included at `public/fonts/OFL.txt`.

## Publishing

The public repository is https://github.com/giangarone/terminal-website and the live site is https://giangarone.github.io/terminal-website/.

GitHub Pages uses **GitHub Actions** as its deployment source. Each push to `main` runs `.github/workflows/deploy.yml`, which installs dependencies, builds the site, and publishes only `dist/`. The workflow can also be run manually from the Actions tab. Do not configure Pages to serve the source folder directly: browsers need the compiled JavaScript and CSS produced by Vite.

`vite.config.js` sets the base path to `/terminal-website/` so scripts, styles, fonts, and images load under the GitHub Pages project URL. To deploy at a different path or a custom domain, update `base` accordingly and rebuild.

The contents of `dist/` can also be served by other static hosts at the configured base path. Images and fonts are local. This repository contains no sign-in flow, payment processing, or trading engine.
