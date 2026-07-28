const logger = require("./logger");

const NOTIFICATION_RETENTION_DAYS = 30;
const REFRESH_TOKEN_RETENTION_DAYS = 7;

async function cleanupOldNotifications(prisma) {
    try {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - NOTIFICATION_RETENTION_DAYS);

        const result = await prisma.notification.deleteMany({
            where: {
                isRead: true,
                createdAt: { lt: cutoff }
            }
        });

        if (result.count > 0) {
            logger.info(`Cleaned up ${result.count} old read notifications`);
        }
    } catch (err) {
        logger.error(`Notification cleanup error: ${err.message}`);
    }
}

async function cleanupExpiredRefreshTokens(prisma) {
    try {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - REFRESH_TOKEN_RETENTION_DAYS);

        const result = await prisma.refreshToken.deleteMany({
            where: {
                OR: [
                    { expiresAt: { lt: new Date() } },
                    { revoked: true, createdAt: { lt: cutoff } }
                ]
            }
        });

        if (result.count > 0) {
            logger.info(`Cleaned up ${result.count} expired/revoked refresh tokens`);
        }
    } catch (err) {
        logger.error(`Refresh token cleanup error: ${err.message}`);
    }
}

module.exports = {
    cleanupOldNotifications,
    cleanupExpiredRefreshTokens
};