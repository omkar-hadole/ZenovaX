const bcrypt = require("bcryptjs");
const { SignJWT, jwtVerify } = require("jose");
const crypto = require("crypto");
const { sendVerificationEmail } = require("../utils/emailService");
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
        throw new BadRequestError("Email must end with @nst.rishihood.edu.in");
    }
    if (!isValidPassword(password)) {
        throw new BadRequestError("Password must be at least 6 characters");
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
