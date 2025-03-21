
const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../utils/config"); 
const UserRepository = require("../repositories/userRepository");

const jwtAuth = async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: "Unauthorized: No token provided." });
    }

    jwt.verify(token, SECRET_KEY, async (err, data) => {
        if (err) {
            return res.status(401).json({ message: "Unauthorized: Invalid or expired token." });
        }

        try {
            const user = await UserRepository.findUserbyUtorid(data.utorid);
            if (!user) {
                return res.status(401).json({ message: "Unauthorized: User not found." });
            }

            req.user = user;
            const lastLoginThreshold = 24 * 60 * 60 * 1000; 
            if (!user.lastLogin || new Date() - new Date(user.lastLogin) > lastLoginThreshold) {
                await UserRepository.updateUser(user.id, { lastLogin: new Date() });
            }
            next();
        } catch (error) {
            return res.status(500).json({ message: "Internal server error." });
        }
    });
};

module.exports = { jwtAuth };
