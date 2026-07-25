const { typedCompare } = require('./typedComparator');
const { serializeArgs, buildStructuredDriverCode } = require('./argSerializer');
const { generateStarterCode } = require('./starterCodeGenerator');

const SUPPORTED_TYPES = [
  'integer', 'float', 'string', 'boolean',
  'integer[]', 'float[]', 'string[]', 'boolean[]',
  'integer[][]', 'float[][]', 'string[][]', 'boolean[][]',
];

const SUPPORTED_TYPES_SET = new Set(SUPPORTED_TYPES);

const isValidType = (type) => SUPPORTED_TYPES_SET.has(type);

const isValidParameter = (param) => {
  return param && typeof param.name === 'string' && param.name.trim() &&
         typeof param.type === 'string' && isValidType(param.type);
};

const validateFunctionSignature = (functionName, params, returnType) => {
  const errors = [];
  if (!functionName || typeof functionName !== 'string' || !functionName.trim()) {
    errors.push('functionName is required');
  } else if (!/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(functionName)) {
    errors.push('functionName must be a valid identifier');
  }
  if (!Array.isArray(params) || params.length === 0) {
    errors.push('At least one parameter is required');
  } else {
    params.forEach((p, i) => {
      if (!isValidParameter(p)) {
        errors.push(`Parameter ${i + 1} (${p.name || 'unnamed'}): invalid name or unsupported type "${p.type}"`);
      }
    });
  }
  if (!returnType || !isValidType(returnType)) {
    errors.push(`returnType is required and must be one of: ${SUPPORTED_TYPES.join(', ')}`);
  }
  return errors;
};

const validateStructuredTestCases = (testCases, params, returnType) => {
  const errors = [];
  if (!Array.isArray(testCases) || testCases.length === 0) {
    errors.push('At least one test case is required');
    return errors;
  }
  testCases.forEach((tc, i) => {
    if (!tc.inputs || typeof tc.inputs !== 'object') {
      errors.push(`Test case ${i + 1}: inputs object is required`);
    } else {
      params.forEach(p => {
        if (!(p.name in tc.inputs)) {
          errors.push(`Test case ${i + 1}: missing parameter "${p.name}" in inputs`);
        }
      });
    }
  });
  return errors;
};

const computeStructuredTestResults = (language, code, functionName, params, returnType, testCases) => {
  const results = testCases.map(tc => {
    const inputs = tc.inputs || {};
    const expected = tc.expected;
    return { inputs, expected, passed: false, actual: null, error: null };
  });
  return results;
};

module.exports = {
  SUPPORTED_TYPES,
  isValidType,
  isValidParameter,
  validateFunctionSignature,
  validateStructuredTestCases,
  typedCompare,
  serializeArgs,
  buildStructuredDriverCode,
  generateStarterCode,
  computeStructuredTestResults,
};
