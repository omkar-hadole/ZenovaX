const profileService = require("../services/profileService");
const config = require("../config");

exports.completeProfile = async (req, res, next) => {
    try {
        const updatedUser = await profileService.completeProfile(req.prisma, req.cache, req.user.id, req.body, req.file);
        return res.json({
            success: true,
            user: updatedUser,
        });
    } catch (error) {
        return next(error);
    }
};

exports.getMe = async (req, res, next) => {
    try {
        const user = await profileService.getMe(req.prisma, req.cache, req.user.id);
        return res.json({ user });
    } catch (error) {
        return next(error);
    }
};

exports.updateProfile = async (req, res, next) => {
    try {
        const updatedUser = await profileService.updateProfile(req.prisma, req.cache, req.user.id, req.body, req.file);
        return res.json({
            success: true,
            user: updatedUser,
        });
    } catch (error) {
        return next(error);
    }
};

exports.getMentors = async (req, res, next) => {
    try {
        const result = await profileService.getMentors(req.prisma, req.cache, req.user.id, req.query);
        return res.json(result);
    } catch (error) {
        return next(error);
    }
};

exports.getProfileById = async (req, res, next) => {
    try {
        const user = await profileService.getProfileById(req.prisma, req.cache, req.user.id, req.user.role, req.params.id);
        return res.json({ user });
    } catch (error) {
        return next(error);
    }
};

exports.deactivateAccount = async (req, res, next) => {
    try {
        await profileService.deactivateAccount(req.prisma, req.user.id, req.body.password);

        const isProd = config.nodeEnv === 'production';
        res.clearCookie("token", { httpOnly: true, secure: isProd, sameSite: isProd ? "None" : "Lax" });
        res.clearCookie("refreshToken", { httpOnly: true, secure: isProd, sameSite: isProd ? "None" : "Lax" });
        res.clearCookie("csrfToken", { httpOnly: false, secure: isProd, sameSite: isProd ? "None" : "Lax" });

        return res.status(200).json({ message: "Account deactivated successfully." });
    } catch (error) {
        return next(error);
    }
};
