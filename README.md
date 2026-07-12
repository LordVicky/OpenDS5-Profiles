# OpenDS5 Profiles Library

Adaptive-trigger data for the OpenDS5 companion app.

This repository is a **published mirror**, not a working repo. The app fetches the
files below at runtime to populate its in-app library browser. They are generated
and pushed from upstream — edits made directly here are overwritten on the next
publish.

## Contents

- `profiles/library/index.json` — the profile catalog the app reads. Generated.
- `profiles/library/native.json` — games that drive the adaptive triggers themselves.
- `profiles/library/<game>.json` — one adaptive-trigger profile per file.

## Profile tiers

Every profile in the catalog carries a `tier`:

| Tier | Meaning |
|---|---|
| `verified` | Hardware-tested by the maintainer. |
| `community` | Submitted, not yet hardware-tested. |

A profile with no tier is treated as `community` — an unlabelled profile is never
presented as verified.

Profiles ported from an existing game mod also carry an `origin`
(`{ "kind": "port", "from": "<mod name>" }`). That is independent of tier: a port can
be verified or community.

## Native games

`native.json` lists games with native adaptive-trigger support, sourced from
[PCGamingWiki](https://www.pcgamingwiki.com/wiki/List_of_games_that_support_DualSense).
These need no profile — OpenDS5 passes the game's own trigger effects through, and the
app shows them as **Native** with nothing to install.

The list covers games the wiki marks as native or limited-native adaptive-trigger
support. Games that only work with a manual fix are not included.

## Descriptions

A profile's `description` is one sentence written by its author. The `capabilities`
line next to it (`L2 multi-zone · R2 slope · 2 modifiers`) is **derived from the
profile itself** at publish time, so it cannot claim an effect the profile does not
have.

## Notes

Profiles are currently curated by the maintainer. The app imports and exports profile
JSON directly, so you can always build and share your own locally.
