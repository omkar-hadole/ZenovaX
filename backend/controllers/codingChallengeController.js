// Use req.prisma injected from middleware
const logger = require("../utils/logger");

exports.createCodingQuestion = async (req, res) => {
    try {
        const { title, description, testCases, difficulty, sessionId } = req.body;

        if (!sessionId || !title || !description) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const session = await req.prisma.session.findUnique({
            where: { id: sessionId },
            select: { mentorId: true }
        });

        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        if (session.mentorId !== req.user.id) {
            return res.status(403).json({ error: 'Unauthorized to add questions to this session' });
        }

        // Ensure testCases is stringified if it comes as object
        let testCasesString = testCases;
        if (typeof testCases === 'object') {
            testCasesString = JSON.stringify(testCases);
        }

        const codingQuestion = await req.prisma.codingQuestion.create({
            data: {
                title,
                description,
                testCases: testCasesString,
                difficulty: difficulty || 'MEDIUM',
                sessionId,
                creatorId: req.user.id,
                status: 'DRAFT'
            }
        });

        res.status(201).json({ success: true, codingQuestion });
    } catch (error) {
        logger.error('Create Coding Question Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// Launch a coding question (make it LIVE)
exports.launchCodingQuestion = async (req, res) => {
    try {
        const { id } = req.params;

        const question = await req.prisma.codingQuestion.findUnique({
            where: { id }
        });

        if (!question) {
            return res.status(404).json({ error: 'Question not found' });
        }

        if (question.creatorId !== req.user.id) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const updated = await req.prisma.codingQuestion.update({
            where: { id },
            data: { status: 'LIVE' }
        });

        res.json({ success: true, message: 'Coding question launched successfully', question: updated });
    } catch (error) {
        logger.error('Launch Coding Question Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// Get coding questions for a session (Optional, for managing list)
exports.getCodingQuestionsBySession = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const userId = req.user.id;

        const questions = await req.prisma.codingQuestion.findMany({
            where: { sessionId },
            orderBy: { createdAt: 'desc' },
            include: {
                submissions: {
                    where: { userId, status: 'PASSED' },
                    select: { id: true }
                }
            }
        });

        const formattedQuestions = questions.map(q => ({
            ...q,
            isSolved: q.submissions.length > 0
        }));

        res.json({ success: true, questions: formattedQuestions });
    } catch (error) {
        logger.error('Get Coding Questions Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.submitCodingQuestion = async (req, res) => {
    try {
        const { id } = req.params;
        const { code, language, status } = req.body;
        const userId = req.user.id;

        // Create submission record
        const submission = await req.prisma.codingSubmission.create({
            data: {
                userId,
                codingQuestionId: id,
                code,
                language,
                status // 'PASSED' or 'FAILED'
            }
        });

        res.json({ success: true, submission });
    } catch (error) {
        logger.error('Submit Coding Question Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// Get single coding question by ID
exports.getCodingQuestionById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const question = await req.prisma.codingQuestion.findUnique({
            where: { id },
            include: {
                submissions: {
                    where: { userId, status: 'PASSED' },
                    select: { id: true }
                }
            }
        });

        if (!question) {
            return res.status(404).json({ error: 'Question not found' });
        }

        const questionWithStatus = {
            ...question,
            isSolved: question.submissions.length > 0
        };

        res.json({ success: true, question: questionWithStatus });
    } catch (error) {
        logger.error('Get Coding Question Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
