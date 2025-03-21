const express = require("express");
const AuthService = require("../services/authService");
const { rateLimit } = require("../middleware/rateLimiter");
const router = express.Router();

// Authenticate User & Generate Token
router.post("/tokens", async (req, res) => {
    const { utorid, password } = req.body;
    if(!utorid || !password){
        return res.status(400).json({message: "invalid payload for login"});
    }
    const result = await AuthService.authenticateUser(utorid, password);
    return res.status(result.status).json(result.data || { message: result.message });
});

// Request Password Reset
router.post("/resets", rateLimit, async (req, res) => {
    const { utorid } = req.body;
    if(!utorid){
        return res.status(400).json({message: "invalid payload for reset"});
    }
    const result = await AuthService.requestPasswordReset(utorid);
    return res.status(result.status).json(result.data || { message: result.message });
});

// Reset Password
router.post("/resets/:resetToken", async (req, res) => {
    const { utorid, password } = req.body;
    if(!utorid || !password){
        return res.status(400).json({message: "invalid payload for resettoken"});
    }
    const { resetToken } = req.params;
    if(!resetToken){
        return res.status(400).json({message: "needreset token"});
    }
    const result = await AuthService.resetPassword(resetToken, utorid, password);
    return res.status(result.status).json(result.data || { message: result.message });
});

module.exports = router;