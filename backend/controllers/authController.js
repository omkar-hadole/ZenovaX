const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const {
    isValidEmail,
    isValidPassword,
    isValidName,
    sanitizeString,
} = require("../utils/validation");
const config = require("../config");

const crypto = require("crypto");
const { sendVerificationEmail } = require("../utils/emailService");

exports.register = async (req, res, next) => {
    try {
        const prisma = req.prisma;
        const { name, email, password } = req.body || {};

        if (!isValidName(name))
            return res
                .status(400)
                .json({ error: "Name must be at least 2 characters" });
        if (!isValidEmail(email))
            return res
                .status(400)
                .json({ error: "Email must end with @nst.rishihood.edu.in" });
        if (!isValidPassword(password))
            return res
                .status(400)
                .json({ error: "Password must be at least 6 characters" });

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser)
            return res.status(409).json({ error: "Email already registered" });

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

        // Send email (async, don't block response too long, or await if critical)
        await sendVerificationEmail(newUser.email, verificationToken);

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
        const prisma = req.prisma;
        const { email, password } = req.body || {};

        if (!isValidEmail(email))
            return res.status(400).json({ error: "Invalid email or domain" });
        if (!isValidPassword(password))
            return res.status(400).json({ error: "Invalid credentials" });

        const userRecord = await prisma.user.findUnique({ where: { email } });
        if (!userRecord)
            return res.status(401).json({ error: "Invalid credentials" });

        const isValid = await bcrypt.compare(password, userRecord.password);
        if (!isValid)
            return res.status(401).json({ error: "Invalid credentials" });

        if (!userRecord.isEmailVerified) {
            return res.status(403).json({
                error: "Email not verified. Please check your inbox.",
                needsVerification: true
            });
        }

        const { password: _, ...user } = userRecord;

        const token = jwt.sign({ userId: user.id, role: user.role }, config.jwtSecret, {
            expiresIn: "7d",
        });

        res.cookie('token', token, {
            httpOnly: true,
            secure: true,
            sameSite: 'Strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        return res.status(200).json({ user });
    } catch (error) {
        next(error);
    }
};

exports.verifyEmail = async (req, res, next) => {
    try {
        const { token } = req.body;
        const prisma = req.prisma;

        if (!token) {
            return res.status(400).json({ error: "Verification token is required" });
        }

        const user = await prisma.user.findUnique({
            where: { verificationToken: token }
        });

        if (!user) {
            return res.status(400).json({ error: "Invalid or expired verification token" });
        }

        // Check if token expired
        if (user.verificationTokenExpires && user.verificationTokenExpires < new Date()) {
            return res.status(400).json({ error: "Verification link has expired. Please request a new one." });
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

        return res.status(200).json({ message: "Email verified successfully. You can now login." });
    } catch (error) {
        next(error);
    }
};

exports.resendVerification = async (req, res, next) => {
    try {
        const { email } = req.body;
        const prisma = req.prisma;

        if (!isValidEmail(email)) {
            return res.status(400).json({ error: "Invalid email" });
        }

        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        if (user.isEmailVerified) {
            return res.status(400).json({ error: "Email is already verified" });
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
            sameSite: "Strict"
        });
        return res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
        next(error);
    }
};

