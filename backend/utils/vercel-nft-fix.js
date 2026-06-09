// This file contains static require statements to force Vercel's Node File Trace (NFT)
// to bundle all parts of the 'semver' package, avoiding runtime 'Cannot find module' errors.

try {
  require('semver/index.js');
  require('semver/functions/parse.js');
  require('semver/functions/valid.js');
  require('semver/functions/clean.js');
  require('semver/functions/inc.js');
  require('semver/functions/diff.js');
  require('semver/functions/major.js');
  require('semver/functions/minor.js');
  require('semver/functions/patch.js');
  require('semver/functions/prerelease.js');
  require('semver/functions/compare.js');
  require('semver/functions/rcompare.js');
  require('semver/functions/compare-loose.js');
  require('semver/functions/compare-build.js');
  require('semver/functions/sort.js');
  require('semver/functions/rsort.js');
  require('semver/functions/gt.js');
  require('semver/functions/lt.js');
  require('semver/functions/eq.js');
  require('semver/functions/neq.js');
  require('semver/functions/gte.js');
  require('semver/functions/lte.js');
  require('semver/functions/cmp.js');
  require('semver/functions/coerce.js');
  require('semver/functions/truncate.js');
  require('semver/classes/comparator.js');
  require('semver/classes/range.js');
  require('semver/classes/semver.js');
  require('semver/functions/satisfies.js');
  require('semver/ranges/to-comparators.js');
  require('semver/ranges/max-satisfying.js');
  require('semver/ranges/min-satisfying.js');
  require('semver/ranges/min-version.js');
  require('semver/ranges/valid.js');
  require('semver/ranges/outside.js');
  require('semver/ranges/gtr.js');
  require('semver/ranges/ltr.js');
  require('semver/ranges/intersects.js');
  require('semver/ranges/simplify.js');
  require('semver/ranges/subset.js');
  require('semver/internal/re.js');
  require('semver/internal/constants.js');
  require('semver/internal/identifiers.js');
} catch (e) {
  // Ignore errors since this is only for build-time tracing
}
