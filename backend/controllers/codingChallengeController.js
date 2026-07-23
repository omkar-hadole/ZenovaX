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

exports.getCodingQuestionsByCreator = async (req, res, next) => {
    try {
        const questions = await codingService.getCodingQuestionsByCreator(req.prisma, req.user.id);
        res.json({ success: true, questions });
    } catch (error) {
        next(error);
    }
};

exports.updateCodingQuestion = async (req, res, next) => {
    try {
        const question = await codingService.updateCodingQuestion(req.prisma, req.user.id, req.params.id, req.body);
        res.json({ success: true, question });
    } catch (error) {
        next(error);
    }
};

exports.closeCodingQuestion = async (req, res, next) => {
    try {
        const question = await codingService.closeCodingQuestion(req.prisma, req.user.id, req.params.id);
        res.json({ success: true, question });
    } catch (error) {
        next(error);
    }
};

exports.submitCodingQuestion = async (req, res, next) => {
    try {
        const { submission, results, error: runError } = await codingService.submitCodingQuestion(req.prisma, req.user.id, req.user.role, req.params.id, req.body);
        res.json({ success: true, submission, results, error: runError });
    } catch (error) {
        next(error);
    }
};

exports.getMySubmissions = async (req, res, next) => {
    try {
        const submissions = await codingService.getMySubmissions(req.prisma, req.user.id, req.user.role, req.params.id);
        res.json({ success: true, submissions });
    } catch (error) {
        next(error);
    }
};

exports.getCodingQuestionById = async (req, res, next) => {
    try {
        const question = await codingService.getCodingQuestionById(req.prisma, req.user.id, req.user.role, req.params.id);
        res.json({ success: true, question });
    } catch (error) {
        next(error);
    }
};
