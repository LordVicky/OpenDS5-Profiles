# OpenDS5 Profiles Library

Community adaptive-trigger profiles for [OpenDS5](https://github.com/LordVicky/OpenDS5).

This repository is a **published mirror**. The OpenDS5 companion app fetches
`profiles/library/index.json` from here to populate its in-app library browser.

## Contents

- `profiles/library/index.json` — the catalog the app reads.
- `profiles/library/*.json` — one adaptive-trigger profile per file.

## Contributing a profile

Profiles are authored and validated in the main OpenDS5 repository, which holds
the shared trigger-profile validator. `index.json` here is generated — editing it
by hand will be overwritten on the next publish.

To submit a profile, open an issue on
[OpenDS5](https://github.com/LordVicky/OpenDS5/issues) with your exported profile
JSON attached.
