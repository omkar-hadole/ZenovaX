const FLOAT_EPSILON = 1e-6;

const isArrayType = (t) => t.endsWith('[]');
const baseTypeOf = (t) => isArrayType(t) ? t.slice(0, -2) : t;

const deepEqual = (a, b, elementType) => {
  if (!Array.isArray(a) || !Array.isArray(b)) return false;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (!typedCompare(a[i], b[i], elementType)) return false;
  }
  return true;
};

const typedCompare = (expected, actual, returnType) => {
  const bothArrays = Array.isArray(expected) && Array.isArray(actual);

  if (bothArrays) {
    if (expected.length !== actual.length) return false;
    const innerType = isArrayType(returnType) ? baseTypeOf(returnType) : returnType;
    return expected.every((_, i) => typedCompare(expected[i], actual[i], innerType));
  }

  const isArr = isArrayType(returnType);
  const base = baseTypeOf(returnType);

  if (isArr) {
    if (base.endsWith('[]')) {
      return deepEqual(expected, actual, base);
    }
    if (!Array.isArray(expected) || !Array.isArray(actual)) return false;
    if (expected.length !== actual.length) return false;
    for (let i = 0; i < expected.length; i++) {
      if (!typedCompare(expected[i], actual[i], base)) return false;
    }
    return true;
  }

  switch (returnType) {
    case 'integer': {
      const en = Number(expected);
      const an = Number(actual);
      if (Number.isNaN(en) && Number.isNaN(an)) return true;
      return en === an;
    }
    case 'float': {
      const ef = Number(expected);
      const af = Number(actual);
      if (Number.isNaN(ef) && Number.isNaN(af)) return true;
      return Math.abs(ef - af) <= FLOAT_EPSILON;
    }
    case 'string':
      return String(expected) === String(actual);
    case 'boolean':
      return Boolean(expected) === Boolean(actual);
    default:
      return String(expected).trim() === String(actual).trim();
  }
};

module.exports = { typedCompare, FLOAT_EPSILON };
