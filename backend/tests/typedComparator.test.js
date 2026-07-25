const { typedCompare, FLOAT_EPSILON } = require('../services/typedComparator');

let passed = 0;
let failed = 0;

const assert = (label, actual, expected) => {
  if (actual === expected) {
    passed++;
    console.log(`  PASS: ${label}`);
  } else {
    failed++;
    console.error(`  FAIL: ${label} — expected ${expected}, got ${actual}`);
  }
};

// integer
assert('integer exact match', typedCompare(42, 42, 'integer'), true);
assert('integer string coercion', typedCompare('42', 42, 'integer'), true);
assert('integer mismatch', typedCompare(42, 43, 'integer'), false);
assert('integer negative', typedCompare(-5, -5, 'integer'), true);
assert('integer zero', typedCompare(0, 0, 'integer'), true);
assert('integer NaN', typedCompare(NaN, NaN, 'integer'), true);

// float
assert('float exact', typedCompare(3.14, 3.14, 'float'), true);
assert('float within epsilon', typedCompare(0.1 + 0.2, 0.3, 'float'), true);
assert('float at epsilon boundary', typedCompare(0.000001, 0.0, 'float'), true);
assert('float just beyond epsilon', typedCompare(0.000002, 0.0, 'float'), false);
assert('float negative', typedCompare(-1.5, -1.5, 'float'), true);
assert('float NaN', typedCompare(NaN, NaN, 'float'), true);
assert('float zero vs near-zero', typedCompare(0, 1e-7, 'float'), true);
assert('float string coercion', typedCompare('2.5', 2.5, 'float'), true);

// string
assert('string exact', typedCompare('hello', 'hello', 'string'), true);
assert('string case sensitive', typedCompare('Hello', 'hello', 'string'), false);
assert('string empty', typedCompare('', '', 'string'), true);
assert('string with space', typedCompare('a b', 'a b', 'string'), true);

// boolean
assert('boolean true', typedCompare(true, true, 'boolean'), true);
assert('boolean false', typedCompare(false, false, 'boolean'), true);
assert('boolean mismatch', typedCompare(true, false, 'boolean'), false);
assert('boolean truthy', typedCompare(1, true, 'boolean'), true);

// integer[]
assert('int array match', typedCompare([1, 2, 3], [1, 2, 3], 'integer[]'), true);
assert('int array order sensitive', typedCompare([1, 2, 3], [3, 2, 1], 'integer[]'), false);
assert('int array different length', typedCompare([1, 2], [1, 2, 3], 'integer[]'), false);
assert('int array empty', typedCompare([], [], 'integer[]'), true);
assert('int array nested coerced match', typedCompare([1, [2]], [1, [2]], 'integer[]'), true);

// float[]
assert('float array match', typedCompare([1.0, 2.0], [1.0, 2.0], 'float[]'), true);
assert('float array within epsilon', typedCompare([0.1 + 0.2], [0.3], 'float[]'), true);

// string[]
assert('string array match', typedCompare(['a', 'b'], ['a', 'b'], 'string[]'), true);
assert('string array mismatch', typedCompare(['a'], ['b'], 'string[]'), false);

// boolean[]
assert('boolean array match', typedCompare([true, false], [true, false], 'boolean[]'), true);

// integer[][]
assert('int 2d array match', typedCompare([[1, 2], [3, 4]], [[1, 2], [3, 4]], 'integer[][]'), true);
assert('int 2d array order sensitive', typedCompare([[1, 2], [3, 4]], [[2, 1], [4, 3]], 'integer[][]'), false);
assert('int 2d array empty outer', typedCompare([], [], 'integer[][]'), true);
assert('int 2d array empty inner', typedCompare([[]], [[]], 'integer[][]'), true);
assert('int 2d array different inner length', typedCompare([[1, 2], [3]], [[1, 2], [3, 4]], 'integer[][]'), false);
assert('int 2d array mismatch nested', typedCompare([[1, 2]], [[1, 3]], 'integer[][]'), false);

// float[][]
assert('float 2d array match', typedCompare([[1.0, 2.0]], [[1.0, 2.0]], 'float[][]'), true);
assert('float 2d array epsilon', typedCompare([[0.1 + 0.2]], [[0.3]], 'float[][]'), true);

// Edge cases
assert('null expected handled', typedCompare(null, null, 'integer'), true);
assert('undefined expected handled', typedCompare(undefined, undefined, 'integer'), true);
assert('negative numbers array', typedCompare([-1, -2], [-1, -2], 'integer[]'), true);
assert('mixed types — int vs string coerced', typedCompare('3', 3, 'integer'), true);

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
