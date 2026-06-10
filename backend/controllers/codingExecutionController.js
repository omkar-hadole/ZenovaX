const codingService = require("../services/codingService");

exports.executeCode = async (req, res, next) => {
    try {
        const result = await codingService.executeCode(req.body);
        if (result.error) {
            return res.json({ success: true, error: result.error });
        }
        return res.json({ success: true, results: result.results, logs: result.logs });
    } catch (error) {
        next(error);
    }
};
