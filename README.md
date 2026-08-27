# BloomAura — Flower Garland Website (Phase 1)

A luxury flower-garland business website. Phase 1 covers the full frontend:
homepage, garland collection, garland detail pages, contact section,
navigation, and Call Now — all running on sample data, with no backend yet.

## Tech stack

- React 18
- Vite 5
- React Router 6 (client-side routing between pages)
- Plain CSS (design tokens in `src/styles.css`, no CSS framework)

## Getting started

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually `http://localhost:5173`).

To build for production:

```bash
npm run build
```

This outputs a static site to `dist/`, which can be deployed to any static
host (Netlify, Vercel, GitHub Pages, cPanel, etc.). Preview the production
build locally with:

```bash
npm run preview
```

## Project structure

```text
flower-garland-shop/
├── public/
│   └── images/            # Placeholder garland artwork (SVG) + favicon
│
├── src/
│   ├── components/
│   │   ├── Header.jsx         # Sticky nav, logo, hamburger menu, Call Now
│   │   ├── Footer.jsx         # Business info, quick links, hours
│   │   ├── GarlandCard.jsx    # Reusable product card (used everywhere)
│   │   ├── CallButton.jsx     # Reusable "Call Now" button (tel: link)
│   │   ├── GarlandDivider.jsx # Signature decorative garland-strand divider
│   │   ├── ReviewCard.jsx     # Customer review card
│   │   └── ScrollToTop.jsx    # Scrolls to top / anchor on route change
│   │
│   ├── pages/
│   │   ├── Home.jsx            # Hero, featured garlands, categories, etc.
│   │   ├── Garlands.jsx        # Full collection with category filter
│   │   ├── GarlandDetails.jsx  # Reusable detail page, driven by URL slug
│   │   ├── Contact.jsx         # Phone / location / hours
│   │   └── NotFound.jsx        # 404 fallback
│   │
│   ├── data/
│   │   └── garlands.js    # Centralized sample garland data (6 garlands)
│   │
│   ├── config/
│   │   └── site.js        # Business name, phone number, address, hours
│   │
│   ├── App.jsx             # Routes + layout
│   ├── main.jsx             # React entry point
│   └── styles.css           # All styling (design tokens + components)
│
├── index.html
├── package.json
├── vite.config.js
├── .gitignore
└── README.md
```

## Configuration (change these first)

Everything a non-technical owner is likely to need to update lives in two
files:

- **`src/config/site.js`** — business name, phone number, address, hours,
  email, social links. The phone number is defined once here
  (`phoneDisplay` for what's shown, `phoneDial` for the `tel:` link) and used
  everywhere else in the site — there are no other hard-coded numbers.
- **`src/data/garlands.js`** — the 6 sample garlands (name, price,
  description, flowers, sizes, images, etc). This is placeholder data for
  Phase 1; a later phase can replace this file with data fetched from an API
  without changing any UI component, because every component only depends on
  the object shape defined here.

## Replacing placeholder images

All current product images are generated placeholder illustrations located
in `public/images/`. To use real photography later:

1. Add your photo files to `public/images/` (or a subfolder like
   `public/images/products/`).
2. Update the `images: [...]` array for the relevant garland in
   `src/data/garlands.js` to point at the new file paths.

No component code needs to change.

## How to test in the browser

- [ ] `npm run dev` starts without errors and the homepage loads
- [ ] Header nav links work on desktop: Home, Collection, About, Reviews, Contact
- [ ] Resize to mobile width — hamburger menu appears, opens/closes, and links work
- [ ] "Call Now" buttons (header, hero, contact section, footer, detail page)
      all link to `tel:+919876543210`
- [ ] Homepage shows featured garlands, categories, why-choose-us, about,
      reviews, and a contact section
- [ ] "Collection" page lists all 6 sample garlands and category filter pills work
- [ ] Clicking "View Details" on any card opens that garland's detail page
- [ ] Detail page shows gallery (thumbnails switch the main image), price,
      flowers, sizes (selectable), customization info, delivery info
- [ ] "Order Now" (on cards and detail page) shows "Order functionality will
      be available soon."
- [ ] Contact page shows phone, address and hours (all marked as placeholders)
- [ ] No horizontal scrolling at mobile, tablet, laptop, or desktop widths
- [ ] `npm run build` completes with no errors

## What's intentionally NOT in Phase 1

Per the project brief, the following are not implemented yet and will come
in later phases: database, authentication, admin panel, image upload
backend, order backend, payments, email/WhatsApp notifications, customer
accounts, shopping cart, inventory, and hosting configuration.

The data layer (`src/data/garlands.js`) and reusable components
(`GarlandCard`, the collection page, the detail page) are structured so that
a future API/backend can replace the sample data without a UI rewrite.
