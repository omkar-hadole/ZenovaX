const codingService = require("../services/codingService");

exports.executeCode = async (req, res, next) => {
    try {
        const result = await codingService.executeCode(req.prisma, req.user.id, req.user.role, req.body);
        if (result.error) {
            return res.json({ success: true, error: result.error });
        }
        return res.json({ success: true, results: result.results, logs: result.logs, message: result.message });
    } catch (error) {
        next(error);
    }
};
