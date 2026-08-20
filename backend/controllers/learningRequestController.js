const learningRequestService = require("../services/learningRequestService");

exports.listLearningRequests = async (req, res, next) => {
    try {
        const { requests, pagination } = await learningRequestService.listLearningRequests(
            req.prisma, req.cache, req.user.id, req.user.role, req.query
        );
        return res.json({ requests, pagination });
    } catch (error) {
        return next(error);
    }
};

exports.getLearningRequestById = async (req, res, next) => {
    try {
        const request = await learningRequestService.getLearningRequestById(req.prisma, req.cache, req.user.id, req.params.id);
        return res.json({ request });
    } catch (error) {
        return next(error);
    }
};

exports.createLearningRequest = async (req, res, next) => {
    try {
        const request = await learningRequestService.createLearningRequest(req.prisma, req.cache, req.user.id, req.body);
        return res.status(201).json({
            success: true,
            message: "Learning request created",
            request
        });
    } catch (error) {
        return next(error);
    }
};

exports.addInterest = async (req, res, next) => {
    try {
        const result = await learningRequestService.addInterest(req.prisma, req.cache, req.user.id, req.params.id);
        return res.json({ success: result.success });
    } catch (error) {
        return next(error);
    }
};

exports.removeInterest = async (req, res, next) => {
    try {
        const result = await learningRequestService.removeInterest(req.prisma, req.cache, req.user.id, req.params.id);
        return res.json({ success: result.success });
    } catch (error) {
        return next(error);
    }
};

exports.closeRequest = async (req, res, next) => {
    try {
        const result = await learningRequestService.closeRequest(req.prisma, req.cache, req.user.id, req.user.role, req.params.id);
        return res.json({ success: result.success });
    } catch (error) {
        return next(error);
    }
};

exports.getLearnerDemand = async (req, res, next) => {
    try {
        const { requests, pagination } = await learningRequestService.getLearnerDemand(
            req.prisma, req.cache, req.user.id, req.query
        );
        return res.json({ requests, pagination });
    } catch (error) {
        return next(error);
    }
};