const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const {
    isValidEmail,
    isValidPassword,
    isValidName,
    sanitizeString,
} = require("../utils/validation");
const config = require("../config");

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

        const newUser = await prisma.user.create({
            data: {
                name: sanitizeString(name),
                email: email.trim(),
                password: hashedPassword,
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isProfileComplete: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        const token = jwt.sign({ userId: newUser.id }, config.jwtSecret, {
            expiresIn: "7d",
        });

        return res.status(201).json({ token, user: newUser });
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

        const { password: _, ...user } = userRecord;

        const token = jwt.sign({ userId: user.id }, config.jwtSecret, {
            expiresIn: "7d",
        });

        return res.status(200).json({ token, user });
    } catch (error) {
        next(error);
    }
};
