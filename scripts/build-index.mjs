#!/usr/bin/env node
// Builds profiles/library/index.json from the *.json profiles in profiles/library/, after
// validating each one against the shared TriggerProfile validator.
//
//   node scripts/build-index.mjs                 rewrites index.json
//   node scripts/build-index.mjs --check         exits 1 if index.json is stale or a profile is invalid
//   node scripts/build-index.mjs --validate-only exits 1 only if a profile is invalid
//
// --validate-only is what pull requests run. Contributors do not regenerate index.json, so
// demanding it be in sync would fail every contribution; the index is rebuilt on merge instead.
//
// index.json is generated. Contributors never edit it: a hand-written index would conflict on
// every concurrent PR and could claim capabilities a profile does not have.
//
// Validation is delegated to scripts/validate-profile.mts, which imports the real validator from
// validator/ (vendored verbatim from the app), so CI enforces exactly what the app enforces at
// install time.
import { spawnSync } from 'node:child_process';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, '..');
const libraryDir = join(repoRoot, 'profiles', 'library');
const indexPath = join(libraryDir, 'index.json');
const validatorPath = join(scriptDir, 'validate-profile.mts');

const checkMode = process.argv.includes('--check');
const validateOnly = process.argv.includes('--validate-only');

function fail(message) {
  console.error(message);
  process.exit(1);
}

// index.json is generated, and native.json is a curated list of games that drive their own
// triggers. Neither is a profile, so neither goes through the profile validator.
const NON_PROFILE_FILES = new Set(['index.json', 'native.json']);
// The file name is interpolated into the library URL the app fetches, so it must be a bare slug.
const FILE_NAME_PATTERN = /^[a-z0-9-]+\.json$/;

const allJson = readdirSync(libraryDir).filter((name) => name.endsWith('.json'));
const profileFiles = allJson.filter((name) => !NON_PROFILE_FILES.has(name)).sort();

const badNames = profileFiles.filter((name) => !FILE_NAME_PATTERN.test(name));
if (badNames.length > 0) {
  fail(
    `build-index: profile file names must be lowercase slugs like cyberpunk-2077.json.\n` +
      badNames.map((name) => `  ${name}`).join('\n')
  );
}

if (profileFiles.length === 0) {
  fail('build-index: no profiles found in profiles/library/.');
}

// Validate every profile through the shared validator, which also returns each profile's derived
// capability line. stdout carries the derived JSON; errors go to stderr.
const validation = spawnSync(
  'npx',
  ['--yes', 'tsx', validatorPath, ...profileFiles.map((name) => join(libraryDir, name))],
  { cwd: repoRoot, stdio: ['ignore', 'pipe', 'inherit'], encoding: 'utf8' }
);
if (validation.status !== 0) {
  fail('build-index: one or more profiles failed validation (see errors above).');
}

let derived;
try {
  derived = JSON.parse(validation.stdout);
} catch {
  fail('build-index: could not parse derived profile data from validate-profile.');
}

// A profile with no tier is community: an unlabelled profile must never publish itself as
// maintainer-verified.
const index = profileFiles.map((file) => {
  const fullPath = join(libraryDir, file);
  const profile = JSON.parse(readFileSync(fullPath, 'utf8'));
  const meta = profile.meta ?? {};
  const capabilities = derived[fullPath]?.capabilities;
  if (typeof capabilities !== 'string') {
    fail(`build-index: no derived capabilities for ${file}.`);
  }
  return {
    file,
    name: profile.name,
    game: meta.game ?? '',
    author: meta.author ?? '',
    description: meta.description ?? '',
    capabilities,
    tier: meta.tier === 'verified' ? 'verified' : 'community',
    ...(meta.origin ? { origin: meta.origin } : {})
  };
});

const serialized = `${JSON.stringify(index, null, 2)}\n`;

if (validateOnly) {
  console.log(`build-index: all ${index.length} profile(s) are valid.`);
  for (const entry of index) {
    console.log(`  ${entry.file}  ${entry.game || '(no game)'}  [${entry.tier}]  ${entry.capabilities}`);
  }
  process.exit(0);
}

if (checkMode) {
  let current = null;
  try {
    current = readFileSync(indexPath, 'utf8');
  } catch {
    current = null;
  }
  if (current !== serialized) {
    fail(
      'build-index: index.json is out of sync with profiles/library/*.json.\n' +
        'It is generated on merge -- you do not need to update it in your pull request.'
    );
  }
  console.log(`build-index: index.json is in sync and all ${index.length} profile(s) are valid.`);
  process.exit(0);
}

writeFileSync(indexPath, serialized);
console.log(`build-index: wrote ${indexPath} (${index.length} profile(s)).`);
