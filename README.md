# MarketStream

A static, responsive marketing homepage built with semantic HTML, plain CSS, TypeScript, and Vite. No framework, backend, or runtime dependencies.

## Run locally

Requires Node 22.18+ (Node 24+ recommended).

```sh
npm install
npm run dev
```

`npm run build` checks TypeScript and produces `dist/`. `npm run preview` serves that production build. `npm run typecheck` checks types independently.

## Hero demo

The hero and “Describe your idea. AI builds it.” both embed the `#ai` scene from `public/demos/marketstream.html` in a responsive 16:9 frame. To give the hero a different demo, update the iframe inside `.platform-media` in `index.html`.

## Edit content and pricing

Marketing copy, FAQs, and the three mock plans are in `index.html`. Monthly USD prices are Free $0, Pro $79.99, and Elite $149.99. The billing switcher uses the monthly cent amounts in `data-monthly-cents`. Yearly billing takes 20% off twelve monthly payments, rounds the annual total to cents, and displays its monthly equivalent above the total. The mock plan buttons use `aria-disabled="true"`. All acquisition links point to `#pricing`.

The hero's three social-proof stats are in `index.html` under `.hero-stats`. The figures (100K+ active users, 1M+ trades tracked, and 4.9★ average rating) are design placeholders; replace the values and labels with verified metrics before launch. They use an accessible description list and a responsive three-column layout beneath the main button. `src/hero-stats.ts` counts each `data-count-to` value up once when the group enters view, easing out over 1.6 seconds after a short entrance delay. Keep the final text and accessible labels in sync when editing targets. Symbols stay fixed, screen readers retain the final values, and reduced motion or disabled JavaScript shows the finished stats immediately.

Color, surface, typography, and spacing rules live in `src/style.css`; palette variables are declared at the top. The MarketStream navbar uses the logo at `public/assets/marketstream-logo.svg`.

The hero backdrop and product demos share the WebGL aurora renderer in `src/demo-aurora.ts`. The hero uses the Black Friday homepage’s curtain framing with all four brand colors defined in `src/style.css`. The aurora falls back to a CSS gradient if WebGL is unavailable. A separate canvas in `src/hero-stars.ts` draws crisp stars at device resolution. Two layers drift diagonally at different speeds, with independent twinkling and continuous coverage as stars enter and leave the frame. Both effects pause offscreen and in hidden tabs and show a still frame for reduced motion.

Element box and text shadows are removed throughout the site.

Pricing and checkout follow the reviews. The WebGL aurora from `src/aurora.ts` is attached to `.pricing-grid` as a full-width decorative background limited to the plan cards' height; the heading and payment icons sit outside it. The quiet grid spans the checkout section and remains layered above the aurora and below the content. The aurora blends navy (`#13233c`) with the Pro plan's blue button (`#2563eb`) and light blue border (`#60a5fa`). Fine, static grain softens gradient banding and fades with the glow at the edges.

The FAQ heading uses the same purple aurora backdrop as “Describe your idea. AI builds it.” Both use the same colors, fade, and animation. The aurora pauses offscreen and in hidden tabs and holds still for reduced motion.

The “Safe & Secure Checkout” block below the plans preserves the `n-safe-div` structure, spacing, responsive breakpoints, and original SVG icons from https://v1-7.webflow.io/blackfriday. It inherits the site's Inter font. Its six icons are stored in `public/assets/payments/`.

### Product demos

The product demos at `#product-demos` sit between the hero and the reviews. Edit their copy in `index.html` and their styles in `src/style.css`.

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
