const express = require("express");
const {
  isValidEmail,
  isValidPassword,
  isValidName,
} = require("../utils/validation");

const router = express.Router();

router.post("/register", async (req, res) => {
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

    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.trim(),
        password: password.trim(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.status(201).json({ user: newUser });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const prisma = req.prisma;
    const { email, password } = req.body || {};

    if (!isValidEmail(email))
      return res.status(400).json({ error: "Invalid email or domain" });
    if (!isValidPassword(password))
      return res.status(400).json({ error: "Invalid credentials" });

    const userRecord = await prisma.user.findUnique({ where: { email } });
    if (!userRecord || userRecord.password !== password) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const { password: _, ...user } = userRecord;
    return res.status(200).json({ user });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;