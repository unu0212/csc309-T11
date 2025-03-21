

const jwt = require('jsonwebtoken');

const { SECRET_KEY } = require("./config");


// Generate JWT Token (for authentication)
function generateAuthToken(user) {
    return jwt.sign(
        { id: user.id, utorid: user.utorid},
        SECRET_KEY,
        { expiresIn: "7d" } 
    );
}

// Verify JWT Token
function verifyToken(token) {
    try {
        return jwt.verify(token, SECRET_KEY);
    } catch (error) {
        return null;
    }
}

module.exports = { generateAuthToken, verifyToken };

