
function csrfProtection(req, res, next) {
    // 1. Safe methods (GET, HEAD, OPTIONS) do not need CSRF protection
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
    }

    // 2. Exempt public auth endpoints to avoid chicken-and-egg token boot issues
    const path = req.path.toLowerCase().replace(/\/$/, ""); // remove trailing slash
    const exemptPaths = [
        '/api/auth/login',
        '/api/auth/register',
        '/api/auth/verify-email',
        '/api/auth/resend-verification',
        '/api/auth/csrf'
    ];
    if (exemptPaths.some(p => path === p)) {
        return next();
    }

    // 3. If the user is not authenticated (no token cookie or Authorization Bearer token),
    // then CSRF is not a risk because no credentials/session can be hijacked.
    let hasSession = false;
    if (req.cookies && req.cookies.token) {
        hasSession = true;
    } else {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith("Bearer ")) {
            hasSession = true;
        }
    }

    if (!hasSession) {
        return next();
    }

    // 4. For mutating requests with active sessions, validate double submit cookie
    const csrfCookie = req.cookies ? req.cookies.csrfToken : null;
    const csrfHeader = req.headers['x-csrf-token'];

    if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
        return res.status(403).json({ error: "CSRF token validation failed" });
    }

    next();
}

module.exports = csrfProtection;
