// Validation + description harness for library profiles.
//
// Invoked by scripts/build-index.mjs via `npx tsx` so we can import the real shared validator and
// capability describer from validator/, which is vendored verbatim from the OpenDS5 app. A profile
// that fails here would fail on install in the app, and vice versa.
//
// Usage: npx tsx <this> <profile.json> [<profile.json> ...]
// Errors go to stderr, one line per invalid profile; exits 1 if any fail.
// On success, prints a JSON object to stdout mapping each file path to its derived fields, which
// build-index.mjs bakes into index.json.
import { readFileSync } from 'node:fs';
import { describeCapabilities } from '../validator/profile-capabilities.ts';
import { validateTriggerProfile } from '../validator/trigger-profiles.ts';

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error('validate-profile: no profile files given');
  process.exit(1);
}

let failed = false;
const derived: Record<string, { capabilities: string }> = {};

for (const file of files) {
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(file, 'utf8'));
  } catch (err) {
    console.error(`${file}: invalid JSON: ${(err as Error).message}`);
    failed = true;
    continue;
  }
  const result = validateTriggerProfile(raw);
  if (!result.ok) {
    console.error(`${file}: ${result.error}`);
    failed = true;
    continue;
  }
  derived[file] = { capabilities: describeCapabilities(result.profile) };
}

if (failed) process.exit(1);

process.stdout.write(JSON.stringify(derived));
