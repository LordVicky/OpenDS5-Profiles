# OpenDS5 Profiles Library

Adaptive-trigger profiles for the OpenDS5 companion app.

This repository is a **published mirror**, not a working repo. The OpenDS5 app
fetches `profiles/library/index.json` from here to populate its in-app library
browser.

## Contents

- `profiles/library/index.json` — the catalog the app reads.
- `profiles/library/*.json` — one adaptive-trigger profile per file.

## Notes

Profiles are authored, validated, and curated upstream, then published here.
`index.json` is generated — edits made directly to this repository will be
overwritten by the next publish.

Profiles are currently curated by the maintainer. The app can import and export
profile JSON directly, so you can always build and share your own locally.
