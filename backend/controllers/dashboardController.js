const dashboardService = require("../services/dashboardService");

exports.getDashboardData = async (req, res, next) => {
    try {
        const result = await dashboardService.getDashboardData(req.prisma, req.cache, req.user.id);
        return res.json(result);
    } catch (error) {
        return next(error);
    }
};
