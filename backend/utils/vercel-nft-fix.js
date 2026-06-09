// Vercel NFT fix - ensure semver submodules are traced for bullmq on Vercel's serverless runtime.
// Without this, Vercel's file tracing may omit semver/functions/* files, causing:
// "Cannot find module './functions/truncate'" at runtime.
require('semver/functions/truncate');
require('semver/functions/parse');
require('semver/functions/valid');
require('semver/functions/major');
require('semver/functions/minor');
require('semver/functions/patch');
require('semver/functions/compare');
require('semver/functions/satisfies');
require('semver/functions/coerce');
require('semver/functions/diff');
require('semver/functions/gt');
require('semver/functions/lt');
require('semver/functions/eq');
require('semver/functions/rcompare');
require('semver/classes/semver');
require('semver/classes/comparator');
require('semver/classes/range');
require('semver/internal/re');
require('semver/internal/constants');
require('semver/ranges/to-comparators');
require('semver/ranges/min-version');
require('semver/ranges/valid');
