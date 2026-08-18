const profileService = require("../services/profileService");
const authService = require("../services/authService");
const config = require("../config");

exports.completeProfile = async (req, res, next) => {
    try {
        const updatedUser = await profileService.completeProfile(req.prisma, req.cache, req.user.id, req.body, req.file);

        // The access token carries the role minted at login. Completing the
        // profile changes LEARNER -> MENTOR in the DB, so re-issue the tokens
        // when the role changes — otherwise role-gated routes (authorize)
        // keep 403-ing from the stale JWT for the rest of its 15-minute life.
        if (updatedUser.role !== req.user.role) {
            const { accessToken, refreshToken } = await authService.generateTokens(
                req.prisma,
                updatedUser.id,
                updatedUser.role,
                false,
                req.headers['user-agent'] || null
            );
            const isProd = config.nodeEnv === 'production';
            res.cookie('token', accessToken, {
                httpOnly: true,
                secure: isProd,
                sameSite: isProd ? 'None' : 'Lax',
                maxAge: 15 * 60 * 1000
            });
            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: isProd,
                sameSite: isProd ? 'None' : 'Lax',
                maxAge: 7 * 24 * 60 * 60 * 1000
            });
        }

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
