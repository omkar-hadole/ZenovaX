const reportService = require("../services/reportService");

const createReport = async (req, res, next) => {
    try {
        const report = await reportService.createReport(req.prisma, req.user.id, req.body);
        return res.status(201).json({ message: "Report submitted successfully", report });
    } catch (error) {
        return next(error);
    }
};

const getReportsForMentor = async (req, res, next) => {
    try {
        const reports = await reportService.getReportsForMentor(req.prisma, req.user.id);
        return res.json({ reports });
    } catch (error) {
        return next(error);
    }
};

module.exports = {
    createReport,
    getReportsForMentor
};
