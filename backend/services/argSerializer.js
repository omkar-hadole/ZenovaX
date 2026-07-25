const serializeValue = (value, type, language) => {
  const isArr = type.endsWith('[]');
  const base = isArr ? type.slice(0, -2) : type;

  if (isArr && base.endsWith('[]')) {
    const innerBase = base.slice(0, -2);
    if (!Array.isArray(value)) {
      return language === 'python' ? '[]' : language === 'java' ? `new ${mapTypeToJava(innerBase)}[0][]{}` : '[]';
    }
    const inner = value.map(v => serializeValue(v, base, language));
    if (language === 'python') return `[${inner.join(', ')}]`;
    if (language === 'java') {
      const javaInnerType = mapTypeToJava(base);
      return `new ${javaInnerType}[]{${inner.join(', ')}}`;
    }
    return `[${inner.join(', ')}]`;
  }

  if (isArr) {
    if (!Array.isArray(value)) {
      return language === 'python' ? '[]' : language === 'java' ? `new ${mapTypeToJava(base)}[0]{}` : '[]';
    }
    const inner = value.map(v => serializeValue(v, base, language));
    if (language === 'python') return `[${inner.join(', ')}]`;
    if (language === 'java') {
      return `new ${mapTypeToJava(base)}[]{${inner.join(', ')}}`;
    }
    return `[${inner.join(', ')}]`;
  }

  switch (type) {
    case 'integer':
      return String(value);
    case 'float':
      return String(value);
    case 'string':
      if (language === 'python') return JSON.stringify(String(value));
      if (language === 'java') return `"${String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
      return JSON.stringify(String(value));
    case 'boolean':
      if (language === 'python') return value ? 'True' : 'False';
      return value ? 'true' : 'false';
    default:
      return JSON.stringify(value);
  }
};

const mapTypeToJava = (type) => {
  const map = {
    'integer': 'int', 'float': 'double', 'string': 'String', 'boolean': 'boolean',
    'integer[]': 'int[]', 'float[]': 'double[]', 'string[]': 'String[]', 'boolean[]': 'boolean[]',
    'integer[][]': 'int[][]', 'float[][]': 'double[][]', 'string[][]': 'String[][]', 'boolean[][]': 'boolean[][]',
  };
  return map[type] || 'String';
};

const serializeArgs = (functionName, params, inputs, language) => {
  const values = (params || []).map(p => {
    const val = inputs && inputs[p.name] !== undefined ? inputs[p.name] : null;
    return serializeValue(val, p.type, language);
  });
  if (language === 'python') {
    return `${functionName}(${values.join(', ')})`;
  }
  return `${functionName}(${values.join(', ')})`;
};

const buildStructuredDriverCode = (language, userCode, functionName, params, testCases) => {
  if (language === 'javascript') return null;

  const testCasesJson = JSON.stringify(testCases.map(tc => ({ inputs: tc.inputs, expected: tc.expected })));

  if (language === 'python') {
    const paramNames = (params || []).map(p => p.name).join(', ');
    return `
import sys
import json

${userCode}

def driver():
    test_cases = json.loads('''${testCasesJson}''')
    user_stdout_capture = io.StringIO()
    old_stdout = sys.stdout
    results = []
    for tc in test_cases:
        sys.stdout = user_stdout_capture
        try:
            args = tc['inputs']
            res = ${functionName}(**args)
            sys.stdout = old_stdout
            results.append(json.dumps(res))
        except Exception as e:
            sys.stdout = old_stdout
            results.append(json.dumps({"__error__": str(e)}))
    sys.stdout = old_stdout
    print(user_stdout_capture.getvalue(), end="")
    print("===LOGS_DONE===")
    print("|||".join(results))

if __name__ == "__main__":
    import io as io
    driver()
`;
  }

  if (language === 'java') {
    const javaParams = (params || []).map(p => `${mapTypeToJava(p.type)} ${p.name}`).join(', ');
    const javaCalls = testCases.map((tc, idx) => {
      const argStr = (params || []).map(p => serializeValue(tc.inputs[p.name], p.type, 'java')).join(', ');
      return `
            ${argStr};
            try {
                ${mapTypeToJava('returnType')} res = s.${functionName}(${argStr});
                results.add(String.valueOf(res));
            } catch(Exception e) {
                results.add("{\\"__error__\\":\\"" + e.getMessage() + "\\"}");
            }`;
    }).join('\n');

    return `
import java.util.*;
import java.io.*;

public class Main {
    public static void main(String[] args) {
        List<String> results = new ArrayList<>();
        PrintStream oldOut = System.out;
        ByteArrayOutputStream userOut = new ByteArrayOutputStream();
        PrintStream newOut = new PrintStream(userOut);
        Solution s = new Solution();

        ${javaCalls}

        System.out.print(userOut.toString());
        System.out.println("===LOGS_DONE===");
        System.out.print(String.join("|||", results));
    }
}

${userCode}
`;
  }

  return userCode;
};

module.exports = { serializeValue, serializeArgs, buildStructuredDriverCode, mapTypeToJava };
