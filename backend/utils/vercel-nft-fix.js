// Vercel NFT fix — tell Vercel's file tracer to include semver subpath modules used by bullmq.
// Wrapped in try/catch so a missing subpath does not crash the entire serverless function.
const semverModules = [
  'semver/functions/truncate', 'semver/functions/parse', 'semver/functions/valid',
  'semver/functions/major', 'semver/functions/minor', 'semver/functions/patch',
  'semver/functions/compare', 'semver/functions/satisfies', 'semver/functions/coerce',
  'semver/functions/diff', 'semver/functions/gt', 'semver/functions/lt',
  'semver/functions/eq', 'semver/functions/rcompare', 'semver/functions/sort',
  'semver/functions/inc', 'semver/functions/clean',
  'semver/classes/semver', 'semver/classes/comparator', 'semver/classes/range',
  'semver/internal/re', 'semver/internal/constants', 'semver/internal/identifiers',
  'semver/ranges/to-comparators', 'semver/ranges/min-version', 'semver/ranges/valid',
  'semver/ranges/simplify',
];
for (const mod of semverModules) {
  try { require(mod); } catch (_) {}
}
