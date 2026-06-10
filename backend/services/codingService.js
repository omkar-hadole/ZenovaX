const axios = require('axios');
const logger = require('../utils/logger');
const { AppError, BadRequestError, NotFoundError, ForbiddenError } = require("../utils/errors");


const getDriverCode = (language, userCode, testCases) => {
    if (language === 'python') {
        const inputs = testCases.map(tc => tc.input);
        return `
import sys
import io

${userCode}

def driver():
    user_stdout = io.StringIO()
    old_stdout = sys.stdout
    
    inputs = ${JSON.stringify(inputs)}
    results = []
    for i in inputs:
        sys.stdout = user_stdout
        try:
            if 'solve' not in globals():
                sys.stdout = old_stdout
                results.append("Error: Function 'solve' not found")
                continue
                
            res = solve(i)
            sys.stdout = old_stdout
            results.append(str(res))
        except Exception as e:
            sys.stdout = old_stdout
            results.append(f"Error: {str(e)}")
            
    sys.stdout = old_stdout
    print(user_stdout.getvalue(), end="")
    print("===LOGS_DONE===")
    print("|||".join(results))

if __name__ == "__main__":
    driver()
`;
    }

    if (language === 'java') {
        const inputs = testCases.map(tc => tc.input);
        return `
import java.util.*;
import java.io.*;

public class Main {
    public static void main(String[] args) {
        String[] inputs = {${inputs.map(i => JSON.stringify(i)).join(',')}};
        List<String> results = new ArrayList<>();
        
        PrintStream oldOut = System.out;
        ByteArrayOutputStream userOut = new ByteArrayOutputStream();
        PrintStream newOut = new PrintStream(userOut);
        
        Solution s = new Solution();
        
        for (String input : inputs) {
            System.setOut(newOut);
            try {
                String res = s.solve(input);
                System.setOut(oldOut);
                results.add(res);
            } catch (Exception e) {
                System.setOut(oldOut);
                results.add("Error: " + e.getMessage());
            }
        }
        
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

exports.createCodingQuestion = async (prisma, userId, { title, description, testCases, difficulty, sessionId }) => {
    if (!sessionId || !title || !description) {
        throw new BadRequestError('Missing required fields');
    }

    const session = await prisma.session.findUnique({
        where: { id: sessionId },
        select: { mentorId: true }
    });

    if (!session) {
        throw new NotFoundError('Session not found');
    }

    if (session.mentorId !== userId) {
        throw new ForbiddenError('Unauthorized to add questions to this session');
    }

    // Ensure testCases is stringified if it comes as object
    let testCasesString = testCases;
    if (typeof testCases === 'object') {
        testCasesString = JSON.stringify(testCases);
    }

    return await prisma.codingQuestion.create({
        data: {
            title,
            description,
            testCases: testCasesString,
            difficulty: difficulty || 'MEDIUM',
            sessionId,
            creatorId: userId,
            status: 'DRAFT'
        }
    });
};

exports.launchCodingQuestion = async (prisma, userId, id) => {
    const question = await prisma.codingQuestion.findUnique({
        where: { id }
    });

    if (!question) {
        throw new NotFoundError('Question not found');
    }

    if (question.creatorId !== userId) {
        throw new ForbiddenError('Unauthorized');
    }

    return await prisma.codingQuestion.update({
        where: { id },
        data: { status: 'LIVE' }
    });
};

exports.getCodingQuestionsBySession = async (prisma, userId, sessionId) => {
    const questions = await prisma.codingQuestion.findMany({
        where: { sessionId },
        orderBy: { createdAt: 'desc' },
        include: {
            submissions: {
                where: { userId, status: 'PASSED' },
                select: { id: true }
            }
        }
    });

    return questions.map(q => ({
        ...q,
        isSolved: q.submissions.length > 0
    }));
};

exports.submitCodingQuestion = async (prisma, userId, id, { code, language, status }) => {
    return await prisma.codingSubmission.create({
        data: {
            userId,
            codingQuestionId: id,
            code,
            language,
            status // 'PASSED' or 'FAILED'
        }
    });
};

exports.getCodingQuestionById = async (prisma, userId, id) => {
    const question = await prisma.codingQuestion.findUnique({
        where: { id },
        include: {
            submissions: {
                where: { userId, status: 'PASSED' },
                select: { id: true }
            }
        }
    });

    if (!question) {
        throw new NotFoundError('Question not found');
    }

    return {
        ...question,
        isSolved: question.submissions.length > 0
    };
};

const executePiston = async (language, sourceCode, input = '') => {
    if (sourceCode.length > 10000) {
        throw new BadRequestError('Code exceeds maximum length of 10,000 characters');
    }

    try {
        const resp = await axios.post(
            process.env.PISTON_API_URL || 'https://emkc.org/api/v2/piston/execute',
            {
                language: language.toLowerCase(),
                version: '*',
                files: [{ name: 'solution', content: sourceCode }],
                stdin: input || '',
            },
            { timeout: 10000 }
        );
        return { 
            stdout: resp.data.run.stdout, 
            stderr: resp.data.run.stderr, 
            exitCode: resp.data.run.code 
        };
    } catch (error) {
        logger.error('Piston API execution failed:', error.message || error);
        throw new AppError('Code execution service unavailable', 503);
    }
};

exports.executeCode = async ({ language, code, testCases }) => {
    if (!code || typeof code !== 'string') {
        throw new BadRequestError("Code must be a string");
    }
    if (code.length > 10000) {
        throw new BadRequestError('Code exceeds maximum length of 10,000 characters');
    }

    if (!Array.isArray(testCases) || testCases.length === 0 || testCases.length > 10) {
        throw new BadRequestError("Test cases must be an array with a maximum of 10 items");
    }

    for (let i = 0; i < testCases.length; i++) {
        const tc = testCases[i];
        if (!tc || typeof tc.input !== 'string' || tc.input.length > 500) {
            throw new BadRequestError(`Test case ${i + 1} input must be a string under 500 characters`);
        }
    }

    if (language === 'javascript') {
        return { success: false, message: "JS execution should happen on client" };
    }

    const sourceContent = getDriverCode(language, code, testCases);
    
    const run = await executePiston(language, sourceContent);

    if (run.stderr) {
        return { error: run.stderr };
    }

    const rawOutput = run.stdout;
    let logs = '';
    let resultsOutput = rawOutput;
    
    if (rawOutput.includes('===LOGS_DONE===')) {
        const parts = rawOutput.split('===LOGS_DONE===');
        logs = parts[0].trim();
        resultsOutput = parts[1].trim();
    }

    const outputs = resultsOutput.split('|||');

    const results = testCases.map((tc, index) => {
        const actual = outputs[index] ? outputs[index].replace(/\n/g, '') : 'No Output';
        return {
            input: tc.input,
            expected: tc.output,
            actual: actual,
            passed: actual.trim() === tc.output.trim()
        };
    });

    return { results, logs };
};
