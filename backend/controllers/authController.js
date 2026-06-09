const authService = require("../services/authService");
const { ForbiddenError } = require("../utils/errors");

exports.register = async (req, res, next) => {
    try {
        const newUser = await authService.register(req.prisma, req.body);
        return res.status(201).json({
            message: "Registration successful. Please check your email to verify your account.",
            user: newUser
        });
    } catch (error) {
        next(error);
    }
};

exports.login = async (req, res, next) => {
    try {
        const { user, token } = await authService.login(req.prisma, req.body);

        res.cookie('token', token, {
            httpOnly: true,
            secure: true,
            sameSite: 'None',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        return res.status(200).json({ user });
    } catch (error) {
        // Special case: frontend checks for needsVerification flag in some places
        if (error instanceof ForbiddenError && error.message.includes("verified")) {
            return res.status(403).json({
                error: error.message,
                needsVerification: true
            });
        }
        next(error);
    }
};

exports.verifyEmail = async (req, res, next) => {
    try {
        await authService.verifyEmail(req.prisma, req.body.token);
        return res.status(200).json({ message: "Email verified successfully. You can now login." });
    } catch (error) {
        next(error);
    }
};

exports.resendVerification = async (req, res, next) => {
    try {
        await authService.resendVerification(req.prisma, req.body.email);
        return res.status(200).json({ message: "Verification email resent successfully." });
    } catch (error) {
        next(error);
    }
};

exports.logout = async (req, res, next) => {
    try {
        res.clearCookie("token", {
            httpOnly: true,
            secure: true,
            sameSite: "None"
        });
        return res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
        next(error);
    }
};
