const rateLimitMap = new Map();

function rateLimit(req, res, next) {
    const ip = req.ip; // Get user's IP address
    const now = Date.now();

    if (rateLimitMap.has(ip)) {
        const lastRequestTime = rateLimitMap.get(ip);
        const timeDiff = now - lastRequestTime;

        if (timeDiff < 60 * 1000) { // 60 seconds
            return res.status(429).json({ message: "Too many requests. Please try again later." });
        }
    }

    rateLimitMap.set(ip, now); // Store the timestamp of the request
    next();
}

module.exports = { rateLimit };
