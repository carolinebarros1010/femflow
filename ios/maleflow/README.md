# Maleflow iOS setup

## Current delivery
- Maleflow mirrors the FemFlow web app structure.

## PWA checklist (Safari Add to Home Screen)
- Confirm `manifest.json` is reachable from the Maleflow app root.
- Ensure the service worker is registered on the main entry page(s).
- Provide Apple touch icons (180x180) in the app root.
- Validate theme/background colors and launch screen expectations.

## Native wrapper checklist (App Store)
- Define the base URL to load (e.g., Maleflow app entry page).
- Decide whether to use a single shared wrapper or a dedicated Maleflow target.
- Capture required assets (icons, splash, privacy policy).

## Open items
- Confirm the exact Maleflow entry URL and directory layout.
- Define signing team and bundle ID when a native wrapper is started.
