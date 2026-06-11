const bcrypt = require("bcryptjs");
const { SignJWT } = require("jose");
const crypto = require("crypto");
const { sendVerificationEmail, sendPasswordResetEmail } = require("../utils/emailService");
const {
    isValidEmail,
    isValidPassword,
    isValidName,
    sanitizeString,
} = require("../utils/validation");
const config = require("../config");
const { BadRequestError, ConflictError, UnauthorizedError, ForbiddenError, NotFoundError } = require("../utils/errors");

exports.register = async (prisma, { name, email, password } = {}) => {
    if (!isValidName(name)) {
        throw new BadRequestError("Name must be at least 2 characters");
    }
    if (!isValidEmail(email)) {
        throw new BadRequestError("Only @nst.rishihood.edu.in email addresses are allowed to register.");
    }
    if (!isValidPassword(password)) {
        throw new BadRequestError("Password must be at least 8 characters and contain at least one number or special character.");
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
        throw new ConflictError("Email already registered");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const newUser = await prisma.user.create({
        data: {
            name: sanitizeString(name),
            email: email.trim(),
            password: hashedPassword,
            isEmailVerified: false,
            verificationToken,
            verificationTokenExpires
        },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isProfileComplete: true,
            isEmailVerified: true
        },
    });

    // Send email
    await sendVerificationEmail(newUser.email, verificationToken);

    return newUser;
};

exports.login = async (prisma, { email, password } = {}) => {
    if (!isValidEmail(email)) {
        throw new BadRequestError("Invalid email or domain");
    }
    if (!isValidPassword(password)) {
        throw new BadRequestError("Invalid credentials");
    }

    const userRecord = await prisma.user.findUnique({ where: { email } });
    if (!userRecord) {
        throw new UnauthorizedError("Invalid credentials");
    }

    const isValid = await bcrypt.compare(password, userRecord.password);
    if (!isValid) {
        throw new UnauthorizedError("Invalid credentials");
    }

    if (!userRecord.isEmailVerified) {
        throw new ForbiddenError("Email not verified. Please check your inbox.");
    }

    const { password: _, ...user } = userRecord;

    const { accessToken, refreshToken } = await exports.generateTokens(prisma, user.id, user.role);

    return { user, accessToken, refreshToken };
};

exports.generateTokens = async (prisma, userId, userRole) => {
    const secret = new TextEncoder().encode(config.jwtSecret);
    const accessToken = await new SignJWT({ userId, role: userRole })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("15m")
        .sign(secret);

    const refreshToken = crypto.randomBytes(64).toString('hex');

    await prisma.refreshToken.create({
        data: {
            token: refreshToken,
            userId,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
    });

    return { accessToken, refreshToken };
};

exports.verifyEmail = async (prisma, token) => {
    if (!token) {
        throw new BadRequestError("Verification token is required");
    }

    const user = await prisma.user.findUnique({
        where: { verificationToken: token }
    });

    if (!user) {
        throw new BadRequestError("Invalid or expired verification token");
    }

    // Check if token expired
    if (user.verificationTokenExpires && user.verificationTokenExpires < new Date()) {
        throw new BadRequestError("Verification link has expired. Please request a new one.");
    }

    await prisma.user.update({
        where: { id: user.id },
        data: {
            isEmailVerified: true,
            verificationToken: null,
            verificationTokenExpires: null,
            verifiedAt: new Date()
        }
    });

    return { success: true };
};

exports.resendVerification = async (prisma, email) => {
    if (!isValidEmail(email)) {
        throw new BadRequestError("Invalid email");
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
        throw new NotFoundError("User not found");
    }

    if (user.isEmailVerified) {
        throw new BadRequestError("Email is already verified");
    }

    // Generate new token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.user.update({
        where: { id: user.id },
        data: {
            verificationToken,
            verificationTokenExpires
        }
    });

    await sendVerificationEmail(user.email, verificationToken);

    return { success: true };
};

exports.forgotPassword = async (prisma, email) => {
    if (!isValidEmail(email)) {
        throw new BadRequestError("Invalid email");
    }

    const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() }
    });

    // Always return success even if user not found (prevents email enumeration)
    if (!user) return { success: true };

    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
        where: { id: user.id },
        data: { passwordResetToken: token, passwordResetExpiry: expiry }
    });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

    await sendPasswordResetEmail(user.email, user.name, resetUrl);
    return { success: true };
};

exports.resetPassword = async (prisma, token, newPassword) => {
    if (!token) {
        throw new BadRequestError("Token is required");
    }
    if (!isValidPassword(newPassword)) {
        throw new BadRequestError("Password must be at least 8 characters and contain at least one number or special character.");
    }

    const user = await prisma.user.findUnique({
        where: { passwordResetToken: token }
    });

    if (!user || !user.passwordResetExpiry || user.passwordResetExpiry < new Date()) {
        throw new BadRequestError("Reset token is invalid or has expired");
    }

    const hash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
        where: { id: user.id },
        data: {
            password: hash,
            passwordResetToken: null,
            passwordResetExpiry: null
        }
    });

    // Revoke ALL existing refresh tokens for this user (security: prevent stale token usage)
    await prisma.refreshToken.updateMany({
        where: { userId: user.id },
        data: { revoked: true }
    });

    return { success: true };
};
