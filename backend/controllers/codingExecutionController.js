const axios = require('axios');

const PISTON_API = 'https://emkc.org/api/v2/piston/execute';

const getDriverCode = (language, userCode, testCases) => {
    if (language === 'python') {
        const inputs = testCases.map(tc => tc.input);
        // Python driver: safely loads inputs, calls solve, prints results separated by newline
        return `
import sys

${userCode}

def driver():
    inputs = ${JSON.stringify(inputs)}
    results = []
    for i in inputs:
        try:
            # Check if solve exists
            if 'solve' not in globals():
                results.append("Error: Function 'solve' not found")
                continue
                
            res = solve(i)
            results.append(str(res))
        except Exception as e:
            results.append(f"Error: {str(e)}")
    
    print("|||".join(results))

if __name__ == "__main__":
    driver()
`;
    }

    if (language === 'java') {
        const inputs = testCases.map(tc => tc.input);
        // Java drivers are trickier. Assuming user writes "class Solution { public String solve(String s) ... }"
        // We wrap it.
        return `
import java.util.*;

public class Main {
    public static void main(String[] args) {
        String[] inputs = {${inputs.map(i => `"${i}"`).join(',')}};
        List<String> results = new ArrayList<>();
        
        Solution s = new Solution();
        
        for (String input : inputs) {
            try {
                String res = s.solve(input);
                results.add(res);
            } catch (Exception e) {
                results.add("Error: " + e.getMessage());
            }
        }
        
        System.out.println(String.join("|||", results));
    }
}

${userCode}
`;
    }

    return userCode;
};

exports.executeCode = async (req, res) => {
    try {
        const { language, code, testCases } = req.body;

        if (language === 'javascript') {
            // JS processed on frontend for now, but if sent here, valid too.
            // Piston supports node.
            return res.json({ success: false, message: "JS execution should happen on client" });
        }

        const sourceContent = getDriverCode(language, code, testCases);

        // Map correct language version/name for Piston
        const pistonLang = language === 'python' ? 'python' : 'java';
        const version = language === 'python' ? '3.10.0' : '15.0.2';

        const payload = {
            language: pistonLang,
            version: version,
            files: [
                {
                    content: sourceContent
                }
            ]
        };

        const response = await axios.post(PISTON_API, payload);
        const { run } = response.data;

        if (run.stderr) {
            // Compilation/Execution error
            return res.json({
                success: true,
                error: run.stderr
            });
        }

        // Output format: val1|||val2|||val3
        const rawOutput = run.stdout.trim();
        const outputs = rawOutput.split('|||');

        const results = testCases.map((tc, index) => {
            const actual = outputs[index] ? outputs[index].replace(/\n/g, '') : 'No Output';
            return {
                input: tc.input,
                expected: tc.output,
                actual: actual,
                passed: actual.trim() === tc.output.trim()
            };
        });

        res.json({ success: true, results });

    } catch (error) {
        console.error("Execution Error:", error.message);
        res.status(500).json({ error: "Failed to execute code" });
    }
};
