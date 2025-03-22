// utils/rateLimit.js
const rateLimitStore = new Map();

function checkRateLimit(key, windowMs = 10000) {
    const now = Date.now();

    if (rateLimitStore.has(key) && now - rateLimitStore.get(key) < windowMs) {
        return false; // rate-limited
    }

    rateLimitStore.set(key, now);
    return true; // allowed
}

module.exports = { checkRateLimit };
