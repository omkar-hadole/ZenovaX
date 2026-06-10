module.exports = {
  env: {
    node: true,
    commonjs: true,
    es2021: true
  },
  extends: "eslint:recommended",
  parserOptions: {
    ecmaVersion: 12
  },
  rules: {
    "no-unused-vars": ["error", { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_" }],
    "no-undef": "error",
    "no-empty": "warn",
    "no-console": "off"
  }
};
