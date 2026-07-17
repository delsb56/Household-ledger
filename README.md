# Household Ledger

A shared budget, debt payoff, and goals tracker for couples. Income, an
emergency fund, long-term investing, debt payments, upcoming one-off costs,
and category budgets with over/under-spending warnings — all in one page.

Your data is stored in your browser's `localStorage`, so it's private to
whichever device and browser you use. It does not sync between devices on
its own (see "Making it sync" below if you want that).

## Run it locally

You'll need [Node.js](https://nodejs.org) (18 or newer) installed.

```bash
npm install
npm run dev
```

Then open the URL it prints (usually `http://localhost:5173`).

## Deploy it so you can use it from your phone

The easiest free options are **Vercel** or **Netlify**. Both work the same way:

1. Push this folder to a GitHub repository (create a free GitHub account if
   you don't have one, create a new repo, and push this code to it).
2. Go to [vercel.com](https://vercel.com) or [netlify.com](https://netlify.com),
   sign in with GitHub, and "import" that repository.
3. Framework preset: **Vite**. Build command: `npm run build`. Output
   directory: `dist`. These are usually auto-detected — just confirm and deploy.
4. You'll get a free `.vercel.app` or `.netlify.app` URL that works from any
   device, instantly, with HTTPS.

No server or database needed — it's a static site.

## Installing it like an app (PWA)

This project is already set up as a Progressive Web App (via
`vite-plugin-pwa`), which means once it's deployed:

- **iPhone (Safari):** open the URL → Share → "Add to Home Screen."
- **Android (Chrome):** open the URL → menu (⋮) → "Add to Home Screen" or
  "Install app."

It'll then open full-screen with its own icon, like a regular app.

The icons in `public/icon-192.png` and `public/icon-512.png` are simple
placeholders — swap them for your own artwork any time (keep the same
filenames and sizes, or update `vite.config.js` if you rename them).

## Making it sync between two people's phones

Right now each device has its own separate copy of the data (via
`localStorage`). If you want you and your partner to see the same live data
on both phones, that requires a small backend — the two most common paths:

- **Supabase or Firebase** (free tiers available): swap the `localStorage`
  calls in `src/App.jsx` (`loadState` / `useDebouncedSave`) for calls to a
  hosted database table, and add basic sign-in so the app knows which
  household's data to load.
- Anything simpler than that is possible but usually means the data is only
  ever as current as whoever remembered to update it.

This is the natural next step if the app proves useful — happy to help wire
it up when you're ready.

## Project structure

```
household-ledger/
├── index.html
├── package.json
├── vite.config.js          # includes the PWA plugin config
├── tailwind.config.js
├── postcss.config.js
├── public/
│   ├── icon-192.png
│   └── icon-512.png
└── src/
    ├── main.jsx
    ├── App.jsx              # the whole app lives here
    └── index.css
```
