#!/usr/bin/env node
// Regenerates profiles/library/native.json from PCGamingWiki's cargo API.
//
// The list is seeded from games with native DualSense adaptive-trigger support
// ("true" or "limited"), and each entry is annotated with the other DualSense
// features PCGamingWiki tracks so the app can flag exactly what a game drives
// itself: haptic feedback and PlayStation light-bar sync.
//
// Usage: node scripts/build-native.mjs        (writes the file)
//        node scripts/build-native.mjs --check (fails if the file is stale)

import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const API = 'https://www.pcgamingwiki.com/w/api.php';
const USER_AGENT = 'OpenDS5-native-list/1.0 (github.com/LordVicky/OpenDS5-Profiles)';
const PAGE_SIZE = 500;

const here = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.join(here, '..', 'profiles', 'library', 'native.json');

function supported(value) {
  return value === 'true' || value === 'limited';
}

async function fetchPage(offset) {
  const params = new URLSearchParams({
    action: 'cargoquery',
    tables: 'Input',
    fields: [
      'Input._pageName=game',
      'Input.DualSense_adaptive_trigger_support=triggers',
      'Input.DualSense_haptic_feedback_support=haptics',
      'Input.Playstation_light_bar_support=lightbar'
    ].join(','),
    where: 'Input.DualSense_adaptive_trigger_support IN ("true","limited")',
    limit: String(PAGE_SIZE),
    offset: String(offset),
    format: 'json'
  });
  const response = await fetch(`${API}?${params}`, { headers: { 'User-Agent': USER_AGENT } });
  if (!response.ok) throw new Error(`PCGamingWiki responded ${response.status}`);
  const payload = await response.json();
  if (!Array.isArray(payload?.cargoquery)) throw new Error('Unexpected cargoquery payload');
  return payload.cargoquery.map((row) => row.title);
}

async function fetchAll() {
  const rows = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const page = await fetchPage(offset);
    rows.push(...page);
    if (page.length < PAGE_SIZE) break;
  }
  return rows;
}

function toEntries(rows) {
  const byGame = new Map();
  for (const row of rows) {
    const game = typeof row.game === 'string' ? row.game.trim() : '';
    if (!game || !supported(row.triggers)) continue;
    const entry = {
      game,
      features: {
        triggers: true,
        haptics: supported(row.haptics),
        lightbar: supported(row.lightbar)
      }
    };
    // Duplicate pages (rare) keep the most capable row.
    const existing = byGame.get(game);
    if (!existing
      || (entry.features.haptics && !existing.features.haptics)
      || (entry.features.lightbar && !existing.features.lightbar)) {
      byGame.set(game, entry);
    }
  }
  return [...byGame.values()].sort((a, b) => a.game.localeCompare(b.game, 'en'));
}

const entries = toEntries(await fetchAll());
if (entries.length < 100) {
  // The list has 130+ games; a sudden shrink means the query broke, not the world.
  throw new Error(`Only ${entries.length} games returned — refusing to shrink native.json`);
}
const serialized = `${JSON.stringify(entries, null, 2)}\n`;

if (process.argv.includes('--check')) {
  const current = readFileSync(outPath, 'utf8');
  if (current !== serialized) {
    console.error('native.json is stale — run: node scripts/build-native.mjs');
    process.exit(1);
  }
  console.log(`native.json is current (${entries.length} games)`);
} else {
  writeFileSync(outPath, serialized, 'utf8');
  console.log(`Wrote ${entries.length} games to profiles/library/native.json`);
}
