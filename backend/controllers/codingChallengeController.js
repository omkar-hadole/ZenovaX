const codingService = require("../services/codingService");

exports.createCodingQuestion = async (req, res, next) => {
    try {
        const codingQuestion = await codingService.createCodingQuestion(req.prisma, req.user.id, req.body);
        res.status(201).json({ success: true, codingQuestion });
    } catch (error) {
        next(error);
    }
};

exports.launchCodingQuestion = async (req, res, next) => {
    try {
        const question = await codingService.launchCodingQuestion(req.prisma, req.user.id, req.params.id);
        res.json({ success: true, message: 'Coding question launched successfully', question });
    } catch (error) {
        next(error);
    }
};

exports.getCodingQuestionsBySession = async (req, res, next) => {
    try {
        const questions = await codingService.getCodingQuestionsBySession(req.prisma, req.user.id, req.params.sessionId);
        res.json({ success: true, questions });
    } catch (error) {
        next(error);
    }
};

exports.submitCodingQuestion = async (req, res, next) => {
    try {
        const submission = await codingService.submitCodingQuestion(req.prisma, req.user.id, req.params.id, req.body);
        res.json({ success: true, submission });
    } catch (error) {
        next(error);
    }
};

exports.getCodingQuestionById = async (req, res, next) => {
    try {
        const question = await codingService.getCodingQuestionById(req.prisma, req.user.id, req.params.id);
        res.json({ success: true, question });
    } catch (error) {
        next(error);
    }
};
