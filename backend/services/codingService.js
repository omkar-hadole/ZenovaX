const logger = require('../utils/logger');
const codeRunner = require('./codeRunner');
const { validateFunctionSignature } = require('./questionTypeEngine');
const { BadRequestError, NotFoundError, ForbiddenError, ConflictError } = require('../utils/errors');

// A test case is "hidden" (its input/output shouldn't be shipped to a
// non-creator before they submit) if it's explicitly flagged `isHidden`, or
// — for older rows created before that flag existed — if it falls outside
// the first 2 cases, matching the app's existing "first 2 are the visible
// examples" convention.
const isTestCaseHidden = (tc, index) =>
    tc && typeof tc.isHidden === 'boolean' ? tc.isHidden : index >= 2;

const redactHiddenTestCases = (testCasesArray) =>
    testCasesArray.map((tc, index) => {
        if (!isTestCaseHidden(tc, index)) {
            return { ...tc, isHidden: false };
        }
        return { input: 'Hidden', output: 'Hidden', isHidden: true };
    });

// Same idea, applied to *execution results* (run/submit) rather than the raw
// test cases: a non-privileged viewer never sees the real input/expected/actual
// for a hidden case, only whether it passed.
const redactHiddenResults = (results, testCases, isPrivileged) => {
    if (!results || isPrivileged) return results;
    return results.map((r, index) => (
        isTestCaseHidden(testCases[index], index)
            ? { input: 'Hidden', output: 'Hidden', expected: 'Hidden', actual: r.passed ? 'Hidden' : 'Wrong Answer', passed: r.passed, isHidden: true }
            : { ...r, isHidden: false }
    ));
};

const isStructuredTestCaseHidden = (tc, index) =>
    tc && typeof tc.isHidden === 'boolean' ? tc.isHidden : index >= 2;

const redactHiddenStructuredTestCases = (testCasesArray) =>
    testCasesArray.map((tc, index) => {
        if (!isStructuredTestCaseHidden(tc, index)) {
            return { ...tc, isHidden: false };
        }
        const redactedInputs = {};
        if (tc.inputs) {
            Object.keys(tc.inputs).forEach(k => { redactedInputs[k] = 'Hidden'; });
        }
        return { inputs: redactedInputs, expected: 'Hidden', isHidden: true };
    });

const redactHiddenStructuredResults = (results, testCases, isPrivileged) => {
    if (!results || isPrivileged) return results;
    return results.map((r, index) => {
        if (!isStructuredTestCaseHidden(testCases[index], index)) {
            return { ...r, isHidden: false };
        }
        const redactedInputs = {};
        if (r.inputs) {
            Object.keys(r.inputs).forEach(k => { redactedInputs[k] = 'Hidden'; });
        }
        return {
            inputs: redactedInputs,
            expected: 'Hidden',
            actual: r.passed ? 'Hidden' : 'Wrong Answer',
            passed: r.passed,
            isHidden: true
        };
    });
};

const parseTestCases = (raw) => {
    if (Array.isArray(raw)) return raw;
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
};

// Confirms the requesting user may view/run/submit this coding question, and
// (when `requireLive` is set) that the question is currently LIVE. The
// creator and ADMINs bypass both the booking and the LIVE-status check —
// everyone else must be CONFIRMED/COMPLETED on the owning session.
const assertCanAccessCodingQuestion = async (prisma, userId, userRole, id, { requireLive = false } = {}) => {
    const question = await prisma.codingQuestion.findUnique({
        where: { id },
        include: { session: { select: { id: true, title: true, mentorId: true } } }
    });

    if (!question) {
        throw new NotFoundError('Question not found');
    }

    const isCreator = question.creatorId === userId;
    const isPrivileged = isCreator || userRole === 'ADMIN';

    if (!isPrivileged) {
        const booking = await prisma.booking.findFirst({
            where: {
                userId,
                sessionId: question.sessionId,
                status: { in: ['CONFIRMED', 'COMPLETED'] }
            },
            select: { id: true }
        });
        if (!booking) {
            throw new ForbiddenError('You are not booked into this session');
        }

        if (requireLive && question.status !== 'LIVE') {
            throw new ForbiddenError('This question is not currently live');
        }
    }

    return { question, isCreator, isPrivileged };
};

const ALLOWED_LANGUAGES = ['javascript', 'python', 'java'];

// Both `allowedLanguages` (array) and `starterCode`/`referenceSolution` (map
// keyed by language) travel as JSON @db.Text columns, same convention as
// `testCases`. `undefined` (field omitted) is left alone so partial updates
// don't clobber existing values; `null`/`[]` explicitly clears it.
const stringifyOrNull = (value) => {
    if (value === undefined) return undefined;
    if (value === null) return null;
    return typeof value === 'string' ? value : JSON.stringify(value);
};

const buildAuthoringFields = ({ allowedLanguages, starterCode, referenceSolution, timeLimitMinutes, points }) => {
    if (Array.isArray(allowedLanguages)) {
        if (allowedLanguages.length === 0 || !allowedLanguages.every(l => ALLOWED_LANGUAGES.includes(l))) {
            throw new BadRequestError(`allowedLanguages must be a non-empty subset of ${ALLOWED_LANGUAGES.join(', ')}`);
        }
    }
    return {
        allowedLanguages: stringifyOrNull(allowedLanguages),
        starterCode: stringifyOrNull(starterCode),
        referenceSolution: stringifyOrNull(referenceSolution),
        timeLimitMinutes: timeLimitMinutes === undefined ? undefined : (timeLimitMinutes === null || timeLimitMinutes === '' ? null : Number(timeLimitMinutes)),
        points: points === undefined ? undefined : (points === null || points === '' ? 100 : Number(points))
    };
};

exports.createCodingQuestion = async (prisma, userId, payload) => {
    const { title, description, testCases, difficulty, sessionId, questionType, functionName, parameters, returnType, structuredTestCases } = payload;
    if (!sessionId || !title || !description) {
        throw new BadRequestError('Missing required fields');
    }

    const isStructured = questionType === 'structured';

    if (isStructured) {
        const sigErrors = validateFunctionSignature(functionName, parameters, returnType);
        if (sigErrors.length > 0) {
            throw new BadRequestError(`Invalid function signature: ${sigErrors.join('; ')}`);
        }
        if (!Array.isArray(structuredTestCases) || structuredTestCases.length === 0) {
            throw new BadRequestError('Structured test cases are required');
        }
    } else {
        if (!testCases || (Array.isArray(testCases) && testCases.length === 0)) {
            throw new BadRequestError('At least one test case is required');
        }
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

    let testCasesString;
    if (!isStructured && testCases !== undefined) {
        testCasesString = typeof testCases === 'object' ? JSON.stringify(testCases) : testCases;
    } else if (!isStructured) {
        testCasesString = '[]';
    }

    const structuredTestCasesString = isStructured && structuredTestCases
        ? (typeof structuredTestCases === 'object' ? JSON.stringify(structuredTestCases) : structuredTestCases)
        : undefined;

    return await prisma.codingQuestion.create({
        data: {
            title,
            description,
            testCases: testCasesString || '[]',
            difficulty: difficulty || 'MEDIUM',
            sessionId,
            creatorId: userId,
            status: 'DRAFT',
            questionType: isStructured ? 'structured' : 'legacy',
            functionName: isStructured ? functionName : undefined,
            parameters: isStructured ? JSON.stringify(parameters) : undefined,
            returnType: isStructured ? returnType : undefined,
            structuredTestCases: structuredTestCasesString,
            ...buildAuthoringFields(payload)
        }
    });
};

exports.getCodingQuestionsByCreator = async (prisma, userId) => {
    const questions = await prisma.codingQuestion.findMany({
        where: { creatorId: userId },
        orderBy: { createdAt: 'desc' },
        include: {
            session: { select: { id: true, title: true } },
        }
    });

    const questionIds = questions.map(q => q.id);
    const distinctPairs = questionIds.length > 0
        ? await prisma.codingSubmission.groupBy({
            by: ['codingQuestionId', 'userId'],
            where: { codingQuestionId: { in: questionIds } },
        })
        : [];

    const uniqueUserCount = {};
    distinctPairs.forEach(s => {
        uniqueUserCount[s.codingQuestionId] = (uniqueUserCount[s.codingQuestionId] || 0) + 1;
    });

    return questions.map(q => ({
        ...q,
        submissionCount: uniqueUserCount[q.id] || 0,
    }));
};

exports.updateCodingQuestion = async (prisma, userId, id, payload) => {
    const existing = await prisma.codingQuestion.findUnique({ where: { id } });
    if (!existing) {
        throw new NotFoundError('Question not found');
    }
    if (existing.creatorId !== userId) {
        throw new ForbiddenError('Unauthorized');
    }
    if (existing.status === 'CLOSED') {
        throw new ConflictError('A closed question can no longer be edited — create a new one instead');
    }

    const { title, description, testCases, difficulty, sessionId, questionType, functionName, parameters, returnType, structuredTestCases } = payload;
    let testCasesString;
    if (testCases !== undefined) {
        testCasesString = typeof testCases === 'object' ? JSON.stringify(testCases) : testCases;
    }

    let structuredTestCasesString;
    if (structuredTestCases !== undefined) {
        structuredTestCasesString = typeof structuredTestCases === 'object' ? JSON.stringify(structuredTestCases) : structuredTestCases;
    }

    return await prisma.codingQuestion.update({
        where: { id },
        data: {
            ...(title !== undefined && { title }),
            ...(description !== undefined && { description }),
            ...(testCasesString !== undefined && { testCases: testCasesString }),
            ...(difficulty !== undefined && { difficulty }),
            ...(sessionId !== undefined && { sessionId }),
            ...(questionType !== undefined && { questionType }),
            ...(functionName !== undefined && { functionName }),
            ...(parameters !== undefined && { parameters: typeof parameters === 'object' ? JSON.stringify(parameters) : parameters }),
            ...(returnType !== undefined && { returnType }),
            ...(structuredTestCasesString !== undefined && { structuredTestCases: structuredTestCasesString }),
            ...buildAuthoringFields(payload)
        }
    });
};

exports.closeCodingQuestion = async (prisma, userId, id) => {
    const existing = await prisma.codingQuestion.findUnique({ where: { id } });
    if (!existing) {
        throw new NotFoundError('Question not found');
    }
    if (existing.creatorId !== userId) {
        throw new ForbiddenError('Unauthorized');
    }
    if (existing.status === 'CLOSED') {
        throw new ConflictError('Question is already closed');
    }

    return await prisma.codingQuestion.update({
        where: { id },
        data: { status: 'CLOSED' }
    });
};

exports.launchCodingQuestion = async (prisma, userId, id) => {
    const question = await prisma.codingQuestion.findUnique({
        where: { id },
        include: { session: { select: { id: true, title: true } } }
    });

    if (!question) {
        throw new NotFoundError('Question not found');
    }

    if (question.creatorId !== userId) {
        throw new ForbiddenError('Unauthorized');
    }

    const launched = await prisma.codingQuestion.update({
        where: { id },
        data: { status: 'LIVE' }
    });

    // Best-effort: notify registered learners the coding question is live. A
    // failure here shouldn't fail the launch itself, since it's already live.
    try {
        const bookings = await prisma.booking.findMany({
            where: { sessionId: question.sessionId, status: 'CONFIRMED' },
            select: { userId: true }
        });
        if (bookings.length > 0) {
            await prisma.notification.createMany({
                data: bookings.map(({ userId: learnerId }) => ({
                    userId: learnerId,
                    type: 'CODING_QUESTION_LAUNCHED',
                    title: 'Coding challenge is live',
                    message: `"${question.title}" is now live for "${question.session.title}".`,
                    link: `/sessions/${question.sessionId}`
                }))
            });
        }
    } catch (notifyError) {
        logger.error('Failed to notify learners of coding question launch:', notifyError);
    }

    return launched;
};

exports.getCodingQuestionsBySession = async (prisma, userId, userRole, sessionId) => {
    const session = await prisma.session.findUnique({
        where: { id: sessionId },
        select: { mentorId: true }
    });

    if (!session) {
        throw new NotFoundError('Session not found');
    }

    const isPrivileged = session.mentorId === userId || userRole === 'ADMIN';

    // Non-privileged users must be booked into the session before they can
    // list its coding questions (which still exposes exercise titles/examples).
    if (!isPrivileged) {
        const booking = await prisma.booking.findFirst({
            where: {
                userId,
                sessionId,
                status: { in: ['CONFIRMED', 'COMPLETED'] }
            },
            select: { id: true }
        });
        if (!booking) {
            throw new ForbiddenError('You are not booked into this session');
        }
    }

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

    return questions.map(q => {
        const isStructured = q.questionType === 'structured';
        // Never ship hidden test cases, the reference solution, or starter code
        // to a non-privileged caller.
        const { referenceSolution: _ref, starterCode: _sc, ...rest } = q;

        if (isPrivileged) {
            return { ...rest, isSolved: q.submissions.length > 0 };
        }

        let testCases = q.testCases;
        let structuredTestCases = q.structuredTestCases;
        if (isStructured) {
            structuredTestCases = JSON.stringify(redactHiddenStructuredTestCases(parseTestCases(q.structuredTestCases)));
        } else {
            testCases = JSON.stringify(redactHiddenTestCases(parseTestCases(q.testCases)));
        }

        return {
            ...rest,
            testCases,
            structuredTestCases,
            isSolved: q.submissions.length > 0
        };
    });
};

exports.submitCodingQuestion = async (prisma, userId, userRole, id, { code, language }) => {
    if (!code || typeof code !== 'string') {
        throw new BadRequestError('Code is required');
    }
    if (!['javascript', 'python', 'java'].includes(language)) {
        throw new BadRequestError('Unsupported language');
    }

    const { question, isPrivileged } = await assertCanAccessCodingQuestion(prisma, userId, userRole, id, { requireLive: true });

    const isStructured = question.questionType === 'structured';

    let submission;
    if (isStructured) {
        const structuredTestCases = parseTestCases(question.structuredTestCases);
        if (structuredTestCases.length === 0) {
            throw new BadRequestError('This question has no test cases configured');
        }

        let parameters;
        try {
            parameters = typeof question.parameters === 'string' ? JSON.parse(question.parameters) : question.parameters;
        } catch {
            throw new BadRequestError('Invalid parameters configuration');
        }

        const { results, error } = await codeRunner.runStructuredTestCases(
            language, code, structuredTestCases, question.functionName, parameters, question.returnType
        );
        const status = !error && results && results.length > 0 && results.every(r => r.passed)
            ? 'PASSED'
            : 'FAILED';

        submission = await prisma.codingSubmission.create({
            data: {
                userId,
                codingQuestionId: id,
                language,
                status
            }
        });

        return { submission, results: redactHiddenStructuredResults(results, structuredTestCases, isPrivileged), error };
    }

    const testCases = parseTestCases(question.testCases);
    if (testCases.length === 0) {
        throw new BadRequestError('This question has no test cases configured');
    }

    const { results, error } = await codeRunner.runTestCases(language, code, testCases);
    const status = !error && results && results.length > 0 && results.every(r => r.passed)
        ? 'PASSED'
        : 'FAILED';

    submission = await prisma.codingSubmission.create({
        data: {
            userId,
            codingQuestionId: id,
            language,
            status
        }
    });

    return { submission, results: redactHiddenResults(results, testCases, isPrivileged), error };
};

exports.getMySubmissions = async (prisma, userId, userRole, id) => {
    // Self-scoped (userId is always the requester's own), but still gated on
    // booking/LIVE status so a stranger can't probe a question's existence.
    await assertCanAccessCodingQuestion(prisma, userId, userRole, id, { requireLive: true });

    return await prisma.codingSubmission.findMany({
        where: { userId, codingQuestionId: id },
        orderBy: { createdAt: 'desc' },
        select: { id: true, language: true, status: true, createdAt: true }
    });
};

exports.getCodingQuestionById = async (prisma, userId, userRole, id) => {
    const { question, isPrivileged } = await assertCanAccessCodingQuestion(prisma, userId, userRole, id, { requireLive: true });

    const submissions = await prisma.codingSubmission.findMany({
        where: { userId, codingQuestionId: id, status: 'PASSED' },
        select: { id: true }
    });

    const isStructured = question.questionType === 'structured';

    let visibleTestCases;
    if (isStructured) {
        const structuredTestCases = parseTestCases(question.structuredTestCases);
        visibleTestCases = isPrivileged ? structuredTestCases : redactHiddenStructuredTestCases(structuredTestCases);
    } else {
        const testCases = parseTestCases(question.testCases);
        visibleTestCases = isPrivileged ? testCases : redactHiddenTestCases(testCases);
    }

    const response = {
        ...question,
        testCases: !isStructured ? JSON.stringify(visibleTestCases) : question.testCases,
        structuredTestCases: isStructured ? JSON.stringify(visibleTestCases) : question.structuredTestCases,
        referenceSolution: isPrivileged ? question.referenceSolution : undefined,
        isSolved: submissions.length > 0
    };

    if (isStructured) {
        response.functionName = question.functionName;
        response.parameters = typeof question.parameters === 'string' ? JSON.parse(question.parameters) : question.parameters;
        response.returnType = question.returnType;
    }

    return response;
};

exports.executeCode = async (prisma, userId, userRole, { language, code, testCases, structuredTestCases, codingQuestionId }) => {
    if (!codingQuestionId) {
        throw new BadRequestError('codingQuestionId is required');
    }

    // Confirms the requester is booked into the session (or is the creator/an
    // admin) and that the question is currently LIVE, before letting them
    // spend a Piston execution on it.
    const { question, isPrivileged } = await assertCanAccessCodingQuestion(prisma, userId, userRole, codingQuestionId, { requireLive: true });

    if (language === 'javascript') {
        return { success: false, message: 'JS execution should happen on client' };
    }

    const isStructured = question.questionType === 'structured' || (structuredTestCases && question.functionName);

    if (isStructured) {
        let parameters;
        try {
            parameters = typeof question.parameters === 'string' ? JSON.parse(question.parameters) : question.parameters;
        } catch {
            throw new BadRequestError('Invalid parameters configuration');
        }

        const stcs = structuredTestCases || parseTestCases(question.structuredTestCases);
        const { results, logs, error } = await codeRunner.runStructuredTestCases(
            language, code, stcs, question.functionName, parameters, question.returnType
        );
        if (error || !results) {
            return { results, logs, error };
        }
        return { results: redactHiddenStructuredResults(results, stcs, isPrivileged), logs };
    }

    const { results, logs, error } = await codeRunner.runTestCases(language, code, testCases);
    if (error || !results) {
        return { results, logs, error };
    }

    // Non-creators never see the real input/expected/actual for a hidden
    // test case in the raw API response, even though the client only ever
    // *displays* a redacted version — this closes the devtools-network-tab
    // leak of the un-redacted values.
    return { results: redactHiddenResults(results, testCases, isPrivileged), logs };
};
