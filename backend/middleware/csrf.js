
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
        '/api/auth/logout',
        '/api/auth/verify-email',
        '/api/auth/resend-verification',
        '/api/auth/forgot-password',
        '/api/auth/reset-password',
        '/api/auth/csrf'
    ];
    if (exemptPaths.some(p => path === p)) {
        return next();
    }

    // 3. Only a cookie-based session is a CSRF risk. A request authenticated
    // purely via an Authorization: Bearer header is immune to CSRF by
    // construction — browsers never auto-attach a custom header cross-origin
    // the way they auto-attach cookies, so there's nothing for a forged
    // cross-site request to ride on. This holds regardless of whose Bearer
    // token it is (a hypothetical ZenovaX one, or — as with Zen's ChatGPT
    // fallback — a third-party OpenAI OAuth token); treating "any Bearer
    // header present" as "authenticated ZenovaX session" was a bug that
    // caused false-positive 403s on requests that never touched a ZenovaX
    // session at all. Do not re-add a Bearer branch here without re-deriving
    // this reasoning.
    const hasSession = !!(req.cookies && req.cookies.token);

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
