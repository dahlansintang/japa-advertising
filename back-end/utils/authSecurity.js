'use strict';

// =====================================================
// 1. LOGIN RATE LIMITER
// =====================================================

const failedAttempts = new Map();

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 5 * 60 * 1000;
const MAX_TRACKED_KEYS = 10000;

function getLoginKeys(req) {
    const ip = req.ip || req.socket?.remoteAddress || 'unknown';
    const email = typeof req.body?.email === 'string'
        ? req.body.email.trim().toLowerCase().slice(0, 254)
        : '';

    return [
        `ip:${ip}`,
        ...(email ? [`email:${email}`] : [])
    ];
}

function pruneAttempts(now = Date.now()) {
    for (const [key, record] of failedAttempts.entries()) {
        if (!record || now >= record.expiresAt) {
            failedAttempts.delete(key);
        }
    }

    while (failedAttempts.size > MAX_TRACKED_KEYS) {
        const oldestKey = failedAttempts.keys().next().value;
        failedAttempts.delete(oldestKey);
    }
}

function customLoginLimiter(req, res, next) {
    const now = Date.now();
    pruneAttempts(now);

    const blocked = getLoginKeys(req)
        .map(key => failedAttempts.get(key))
        .find(record =>
            record &&
            record.count >= MAX_ATTEMPTS &&
            now < record.expiresAt
        );

    if (blocked) {
        const retryAfter = Math.max(
            1,
            Math.ceil((blocked.expiresAt - now) / 1000)
        );

        res.set('Retry-After', String(retryAfter));

        return res.status(429).json({
            status: 'error',
            message: 'Terlalu banyak percobaan login gagal. Silakan coba kembali setelah beberapa menit.',
            retry_after_seconds: retryAfter
        });
    }

    return next();
}

function recordFailedLogin(req) {
    const now = Date.now();
    pruneAttempts(now);

    for (const key of getLoginKeys(req)) {
        const previous = failedAttempts.get(key);
        const record = previous && now < previous.expiresAt
            ? {
                count: previous.count + 1,
                expiresAt: previous.expiresAt
            }
            : {
                count: 1,
                expiresAt: now + WINDOW_MS
            };

        failedAttempts.delete(key);
        failedAttempts.set(key, record);
    }

    pruneAttempts(now);
}

function resetLoginAttempts(req) {
    for (const key of getLoginKeys(req)) {
        failedAttempts.delete(key);
    }
}

// =====================================================
// 2. VALIDASI PASSWORD
// =====================================================

function isStrongPassword(value) {
    return (
        typeof value === 'string' &&
        value.length >= 8 &&
        Buffer.byteLength(value, 'utf8') <= 72 &&
        /[a-z]/.test(value) &&
        /[A-Z]/.test(value) &&
        /\d/.test(value) &&
        /[^A-Za-z0-9]/.test(value)
    );
}


module.exports = {
    customLoginLimiter,
    recordFailedLogin,
    resetLoginAttempts,
    isStrongPassword
};
