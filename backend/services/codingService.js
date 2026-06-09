const axios = require('axios');
const logger = require('../utils/logger');
const { AppError, BadRequestError, NotFoundError, ForbiddenError } = require("../utils/errors");
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

const PISTON_API = 'https://emkc.org/api/v2/piston/execute';

const getDriverCode = (language, userCode, testCases) => {
    if (language === 'python') {
        const inputs = testCases.map(tc => tc.input);
        return `
import sys

${userCode}

def driver():
    inputs = ${JSON.stringify(inputs)}
    results = []
    for i in inputs:
        try:
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
        return `
import java.util.*;

public class Main {
    public static void main(String[] args) {
        String[] inputs = {${inputs.map(i => JSON.stringify(i)).join(',')}};
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

const executeLocally = async (language, sourceContent) => {
    const tempDir = path.join(__dirname, '../temp');
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }
    const uniqueId = Date.now() + '_' + Math.random().toString(36).substring(2, 9);
    
    if (language === 'python') {
        const filePath = path.join(tempDir, `solution_${uniqueId}.py`);
        await fs.promises.writeFile(filePath, sourceContent);
        try {
            const { stdout, stderr } = await execAsync(`python3 "${filePath}"`, { timeout: 5000 });
            return { stdout: stdout || '', stderr: stderr || '' };
        } catch (error) {
            if (error.killed) {
                return { stdout: '', stderr: "Execution timed out (infinite loop or taking too long)." };
            }
            return { stdout: error.stdout || '', stderr: error.stderr || error.message || '' };
        } finally {
            try {
                await fs.promises.unlink(filePath);
            } catch (e) {
                logger.error(`Failed to delete temp file ${filePath}:`, e);
            }
        }
    }

    if (language === 'java') {
        const executionDir = path.join(tempDir, `java_${uniqueId}`);
        await fs.promises.mkdir(executionDir, { recursive: true });
        
        const filePath = path.join(executionDir, 'Main.java');
        await fs.promises.writeFile(filePath, sourceContent);
        try {
            await execAsync(`javac Main.java`, { cwd: executionDir, timeout: 5000 });
            const { stdout, stderr } = await execAsync(`java Main`, { cwd: executionDir, timeout: 5000 });
            return { stdout: stdout || '', stderr: stderr || '' };
        } catch (error) {
            if (error.killed) {
                return { stdout: '', stderr: "Execution timed out (infinite loop or taking too long)." };
            }
            return { stdout: error.stdout || '', stderr: error.stderr || error.message || '' };
        } finally {
            try {
                await fs.promises.rm(executionDir, { recursive: true, force: true });
            } catch (e) {
                logger.error(`Failed to delete java run folder ${executionDir}:`, e);
            }
        }
    }

    throw new Error(`Unsupported language for local execution: ${language}`);
};

exports.executeCode = async ({ language, code, testCases }) => {
    if (!code || typeof code !== 'string' || code.length > 10000) {
        throw new BadRequestError("Code must be a string and under 10,000 characters");
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
    
    let run;
    try {
        const { stdout, stderr } = await executeLocally(language, sourceContent);
        run = { stdout, stderr };
    } catch (err) {
        throw new AppError(`Code execution failed: ${err.message}`, 500);
    }

    if (run.stderr) {
        return { error: run.stderr };
    }

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

    return { results };
};
