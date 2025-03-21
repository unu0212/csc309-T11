const express = require("express");
const AuthService = require("../services/authService");
const { rateLimit } = require("../middleware/rateLimiter");
const router = express.Router();

// Authenticate User & Generate Token
router.post("/tokens", async (req, res) => {
    const { utorid, password } = req.body;
    const result = await AuthService.authenticateUser(utorid, password);
    return res.status(result.status).json(result.data || { message: result.message });
});

// Request Password Reset
router.post("/resets", rateLimit, async (req, res) => {
    const { utorid } = req.body;
    const result = await AuthService.requestPasswordReset(utorid);
    return res.status(result.status).json(result.data || { message: result.message });
});

// Reset Password
router.post("/resets/:resetToken", async (req, res) => {
    const { utorid, password } = req.body;
    const { resetToken } = req.params;
    const result = await AuthService.resetPassword(resetToken, utorid, password);
    return res.status(result.status).json(result.data || { message: result.message });
});

module.exports = router;