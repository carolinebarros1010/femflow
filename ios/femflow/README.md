# FemFlow iOS setup

## Current delivery
- Primary app lives at `/app` (web/PWA).

## PWA checklist (Safari Add to Home Screen)
- Confirm `manifest.json` is reachable from `/app/`.
- Ensure the service worker is registered on the main entry page(s).
- Provide Apple touch icons (180x180) in the app root.
- Validate theme/background colors and launch screen expectations.

## Native wrapper checklist (App Store)
- Define the base URL to load (e.g., `/app/index.html`).
- Decide whether to use a single shared wrapper or a dedicated FemFlow target.
- Capture required assets (icons, splash, privacy policy).

## Open items
- Specify the final iOS distribution path (PWA-only vs App Store).
- Define signing team and bundle ID when a native wrapper is started.
