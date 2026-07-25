const { mapTypeToJava } = require('./argSerializer');

const typeComment = (type) => {
  switch (type) {
    case 'integer': return 'int';
    case 'float': return 'float';
    case 'string': return 'string';
    case 'boolean': return 'bool';
    default: return type;
  }
};

const generateStarterCode = (functionName, params, returnType, language) => {
  const paramNames = (params || []).map(p => p.name).join(', ');
  const paramStr = (params || []).map(p => `${p.name}`).join(', ');

  if (language === 'javascript') {
    const jsParams = (params || []).map(p => p.name).join(', ');
    let comment = (params || []).map(p => `// @param {${typeComment(p.type)}} ${p.name}`).join('\n');
    if (returnType) comment += `\n// @returns {${typeComment(returnType)}}`;
    return `/**\n${comment}\n */\nfunction ${functionName}(${jsParams}) {\n  // Your code here\n  \n}`;
  }

  if (language === 'python') {
    const pyParams = (params || []).map(p => p.name).join(', ');
    let comment = (params || []).map(p => `    # @param ${p.name}: ${typeComment(p.type)}`).join('\n');
    if (returnType) comment += `\n    # @returns ${typeComment(returnType)}`;
    return `def ${functionName}(${pyParams}):\n${comment}\n    pass`;
  }

  if (language === 'java') {
    const jParams = (params || []).map(p => `${mapTypeToJava(p.type)} ${p.name}`).join(', ');
    const jReturn = mapTypeToJava(returnType || 'void');
    let comment = (params || []).map(p => ` * @param ${p.name} ${typeComment(p.type)}`).join('\n');
    if (returnType) comment += `\n * @return ${typeComment(returnType)}`;
    return `/**\n${comment}\n */\nclass Solution {\n    public static ${jReturn} ${functionName}(${jParams}) {\n        // Your code here\n        ${returnType === 'void' ? '' : 'return null;'}\n    }\n}`;
  }

  return '';
};

module.exports = { generateStarterCode };
