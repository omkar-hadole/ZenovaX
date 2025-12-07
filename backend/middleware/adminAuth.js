const adminAuth = async (req, res, next) => {
    try {
        const prisma = req.prisma;

        if (!req.user || !req.user.id) {
            return res.status(401).json({ error: "Unauthorized: No user found" });
        }

        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: { role: true }
        });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        if (user.role !== "ADMIN") {
            return res.status(403).json({ error: "Access denied: Admins only" });
        }

        next();
    } catch (error) {
        console.error("Admin Auth Error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

module.exports = adminAuth;
