## Plan

1. Copy the two uploaded icons into `public/images/`:
   - `user-uploads://icon-192.png` → `public/images/icon-192.png`
   - `user-uploads://icon-512.png` → `public/images/icon-512.png`

2. Overwrite `public/manifest.json` with the exact JSON provided in the request (UMCIMBI name, #111872 colors, two icon entries pointing to `/images/icon-192.png` and `/images/icon-512.png` with `purpose: "any maskable"`).

No other files touched.