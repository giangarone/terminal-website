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

The `userCount` values are design placeholders for the number of users using each indicator. Replace them with verified counts before launch. A `null` value displays an em dash. The “View indicator” buttons are intentionally inactive and marked `aria-disabled`.

The collection supports touch swiping, trackpad scrolling, previous/next buttons, and Left/Right/Home/End keys when focused. Reduced-motion preferences disable animated scrolling.

Marketing copy, FAQs, and the three mock plans are in `index.html`. Prices are USD monthly: Free $0, Pro $49, Elite $99. The mock plan buttons have no handlers or links, and use `aria-disabled="true"`. All acquisition links point to `#pricing`.

The hero's three social-proof stats are in `index.html` under `.hero-stats`. The figures (100K+ active users, 1M+ trades tracked, and 4.9★ average rating) are design placeholders; replace the values and labels with verified metrics before launch. They use an accessible description list and a responsive three-column layout beneath the main button. `src/hero-stats.ts` counts each `data-count-to` value up once when the group enters view, easing out over 1.6 seconds after a short entrance delay. Keep the final text and accessible labels in sync when editing targets. Symbols stay fixed, screen readers retain the final values, and reduced motion or disabled JavaScript shows the finished stats immediately.

Color, surface, typography, and spacing rules live in `src/style.css`; palette variables are declared at the top. The MarketStream navbar uses the logo at `public/assets/marketstream-logo.svg`.

The hero’s animated circle lives in `src/hero-cells.ts`. Identical 6px squares sit on an invisible 8px grid (2px gaps) at every screen size, with the last row flush to the bottom edge. On entrance, cells expand and fade in from below the bottom center over 2.4 seconds using `cubic-bezier(0.32, 0, 0.1, 1)`, revealing the cyan edge and soft blue interior. The finished circle breathes by 6% every 7 seconds, with the pulse easing in over 0.9 seconds after the entrance. Light softens around the heading and the top and side edges while staying lit along the bottom. Cell positions and sizes stay fixed until the hero resizes. A separate, subtle background grid remains visible behind the animated cells. The renderer pauses outside the viewport and in hidden tabs, resumes without replaying its entrance, and shows the finished still composition for reduced motion.

Pricing and checkout follow the hero's platform media. The WebGL aurora from `src/aurora.ts` is attached to `.pricing-grid` as a full-width decorative background limited to the plan cards' height; the heading and payment icons sit outside it. The quiet grid spans the checkout section and remains layered above the aurora and below the content. The aurora blends navy (`#13233c`) with the Pro plan's blue button (`#2563eb`) and light blue border (`#60a5fa`). Fine, static grain softens gradient banding and fades with the glow at the edges. The FAQ section uses the plain page background.

The “Safe & Secure Checkout” block below the plans preserves the `n-safe-div` structure, spacing, responsive breakpoints, and original SVG icons from https://v1-7.webflow.io/blackfriday. It inherits the site's Inter font. Its six icons are stored in `public/assets/payments/`.

### Feature showcase

The five-card section at `#features` sits immediately after pricing and checkout. Edit its copy and inline SVG illustrations in `index.html`; its scoped styles are in `src/style.css`. The graphics are illustrative, including the labeled sample journal results and economic event, and do not use live data. Each card uses the same entrance animation as the market-coverage cards in `src/main.ts`; its text and illustrations remain static within the card. Cards appear immediately without JavaScript or with reduced motion enabled.

## Asset provenance

MarketStream logo: supplied by the site owner (`public/assets/marketstream-logo.svg`).

Coin icons are local files provided for this site (`public/assets/btc.png`, `eth.png`, `sol.png`).
Brand marks identify the illustrated assets; no partnership or endorsement is implied.

- Inter variable font: https://github.com/rsms/inter — SIL Open Font License is included at `public/fonts/OFL.txt`.
- Checkout security and payment SVGs: original assets from https://v1-7.webflow.io/blackfriday, copied locally at the site owner's request.

## Publishing

The public repository is https://github.com/giangarone/terminal-website and the live site is https://giangarone.github.io/terminal-website/.

GitHub Pages uses **GitHub Actions** as its deployment source. Each push to `main` runs `.github/workflows/deploy.yml`, which installs dependencies, builds the site, and publishes only `dist/`. The workflow can also be run manually from the Actions tab. Do not configure Pages to serve the source folder directly: browsers need the compiled JavaScript and CSS produced by Vite.

`vite.config.js` sets the base path to `/terminal-website/` so scripts, styles, fonts, and images load under the GitHub Pages project URL. To deploy at a different path or a custom domain, update `base` accordingly and rebuild.

The contents of `dist/` can also be served by other static hosts at the configured base path. Images and fonts are local. This repository contains no sign-in flow, payment processing, or trading engine.
