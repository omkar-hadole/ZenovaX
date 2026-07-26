const authService = require("../services/authService");
const { ForbiddenError } = require("../utils/errors");
const crypto = require("crypto");
const config = require("../config");

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
        const { rememberMe } = req.body;
        const { user, accessToken, refreshToken } = await authService.login(req.prisma, {
            ...req.body,
            userAgent: req.headers['user-agent'] || null
        });

        const csrfToken = crypto.randomBytes(32).toString('hex');

        const isProd = config.nodeEnv === 'production';
        const refreshTokenMaxAge = rememberMe
            ? 30 * 24 * 60 * 60 * 1000
            : 7 * 24 * 60 * 60 * 1000;

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
            maxAge: refreshTokenMaxAge
        });

        res.cookie('csrfToken', csrfToken, {
            httpOnly: false,
            secure: isProd,
            sameSite: isProd ? 'None' : 'Lax',
            maxAge: refreshTokenMaxAge
        });

        return res.status(200).json({ user, csrfToken });
    } catch (error) {
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
        const { refreshToken } = req.cookies || {};
        if (refreshToken) {
            await req.prisma.refreshToken.deleteMany({
                where: { token: refreshToken }
            });
        }

        const isProd = config.nodeEnv === 'production';
        res.clearCookie("token", {
            httpOnly: true,
            secure: isProd,
            sameSite: isProd ? "None" : "Lax"
        });
        res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: isProd,
            sameSite: isProd ? "None" : "Lax"
        });
        res.clearCookie("csrfToken", {
            httpOnly: false,
            secure: isProd,
            sameSite: isProd ? "None" : "Lax"
        });
        return res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
        next(error);
    }
};

exports.getCsrfToken = async (req, res, next) => {
    try {
        let csrfToken = req.cookies ? req.cookies.csrfToken : null;
        if (!csrfToken) {
            csrfToken = crypto.randomBytes(32).toString('hex');
            const isProd = config.nodeEnv === 'production';
            res.cookie('csrfToken', csrfToken, {
                httpOnly: false,
                secure: isProd,
                sameSite: isProd ? 'None' : 'Lax',
                maxAge: 7 * 24 * 60 * 60 * 1000
            });
        }
        return res.status(200).json({ csrfToken });
    } catch (error) {
        next(error);
    }
};

exports.refresh = async (req, res, next) => {
    try {
        const { refreshToken } = req.cookies || {};
        if (!refreshToken) {
            return res.status(401).json({ error: "Refresh token missing" });
        }

        const dbToken = await req.prisma.refreshToken.findUnique({
            where: { token: refreshToken },
            include: { user: true }
        });

        if (!dbToken || dbToken.revoked || dbToken.expiresAt < new Date()) {
            const isProd = config.nodeEnv === 'production';
            res.clearCookie("refreshToken", {
                httpOnly: true,
                secure: isProd,
                sameSite: isProd ? "None" : "Lax"
            });
            res.clearCookie("token", {
                httpOnly: true,
                secure: isProd,
                sameSite: isProd ? "None" : "Lax"
            });
            return res.status(401).json({ error: "Invalid or expired refresh token" });
        }

        const originalDuration = dbToken.expiresAt.getTime() - dbToken.createdAt.getTime();
        const isRememberMe = originalDuration > 20 * 24 * 60 * 60 * 1000;

        await req.prisma.refreshToken.delete({
            where: { id: dbToken.id }
        });

        const { accessToken, refreshToken: newRefreshToken } = await authService.generateTokens(
            req.prisma,
            dbToken.userId,
            dbToken.user.role,
            isRememberMe,
            req.headers['user-agent'] || null
        );

        const isProd = config.nodeEnv === 'production';
        const refreshTokenMaxAge = isRememberMe
            ? 30 * 24 * 60 * 60 * 1000
            : 7 * 24 * 60 * 60 * 1000;

        res.cookie('token', accessToken, {
            httpOnly: true,
            secure: isProd,
            sameSite: isProd ? 'None' : 'Lax',
            maxAge: 15 * 60 * 1000
        });

        res.cookie('refreshToken', newRefreshToken, {
            httpOnly: true,
            secure: isProd,
            sameSite: isProd ? 'None' : 'Lax',
            maxAge: refreshTokenMaxAge
        });

        const existingCsrf = req.cookies?.csrfToken || crypto.randomBytes(32).toString('hex');
        res.cookie('csrfToken', existingCsrf, {
            httpOnly: false,
            secure: isProd,
            sameSite: isProd ? 'None' : 'Lax',
            maxAge: refreshTokenMaxAge
        });

        return res.status(200).json({ success: true, csrfToken: existingCsrf });
    } catch (error) {
        next(error);
    }
};

exports.forgotPassword = async (req, res, next) => {
    try {
        await authService.forgotPassword(req.prisma, req.body.email);
        return res.status(200).json({ message: "If this email exists, a reset link has been sent." });
    } catch (error) {
        next(error);
    }
};

exports.resetPassword = async (req, res, next) => {
    try {
        const { token, password } = req.body;
        await authService.resetPassword(req.prisma, token, password);
        return res.status(200).json({ message: "Password has been successfully reset." });
    } catch (error) {
        next(error);
    }
};

exports.changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;
        await authService.changePassword(req.prisma, req.user.id, currentPassword, newPassword);
        return res.status(200).json({ message: "Password changed successfully." });
    } catch (error) {
        next(error);
    }
};

exports.getSessions = async (req, res, next) => {
    try {
        const currentToken = req.cookies?.refreshToken;
        const sessions = await authService.getSessions(req.prisma, req.user.id, currentToken);
        return res.status(200).json({ sessions });
    } catch (error) {
        next(error);
    }
};

exports.revokeSession = async (req, res, next) => {
    try {
        const { id } = req.params;
        const currentToken = req.cookies?.refreshToken;
        const tokenRecord = await authService.revokeSession(req.prisma, req.user.id, id);
        if (!tokenRecord) {
            return res.status(404).json({ error: "Session not found" });
        }

        if (currentToken && tokenRecord.token === currentToken) {
            const isProd = config.nodeEnv === 'production';
            res.clearCookie("token", { httpOnly: true, secure: isProd, sameSite: isProd ? "None" : "Lax" });
            res.clearCookie("refreshToken", { httpOnly: true, secure: isProd, sameSite: isProd ? "None" : "Lax" });
            res.clearCookie("csrfToken", { httpOnly: false, secure: isProd, sameSite: isProd ? "None" : "Lax" });
            return res.status(200).json({ message: "Session revoked", currentSessionRevoked: true });
        }

        return res.status(200).json({ message: "Session revoked" });
    } catch (error) {
        next(error);
    }
};

exports.revokeAllSessions = async (req, res, next) => {
    try {
        const currentToken = req.cookies?.refreshToken;
        const count = await authService.revokeAllSessions(req.prisma, req.user.id, currentToken);
        return res.status(200).json({ message: `${count} session(s) revoked` });
    } catch (error) {
        next(error);
    }
};