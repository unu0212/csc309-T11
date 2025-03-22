
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const UserRepository = require("../repositories/userRepository");
const { generateResetToken } = require("../utils/tokenHelpers");
const { generateAuthToken } = require("../utils/jwtHelpers");
const { checkRateLimit } = require("../utils/rateLimit");
const { SECRET_KEY } = require("../utils/config");

class AuthService {
    
    
    async authenticateUser(utorid, password) {
        const user = await UserRepository.findUserbyUtorid(utorid);
        if (!user) {
            return { status: 401, message: "Invalid credentials." };
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return { status: 401, message: "Invalid credentials." };
        }

        //const token = generateAuthToken(user);
        const token = jwt.sign(
            { id: user.id, utorid: user.utorid, role: user.role },
            SECRET_KEY,
            { expiresIn: "7d" } // Token valid for 7 days
        );
        return { 
            status: 200, 
            data: { token, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) } 
        };
    }

    
    async requestPasswordReset(utorid, clientIp) {
        const user = await UserRepository.findUserbyUtorid(utorid);
        if (!user) {
            return { status: 404, message: "This user does not exist." };
        }

        const resetToken = generateResetToken();
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
        const isAllowed = checkRateLimit(clientIp);
        if (!isAllowed) {
            return { status: 429, message: "Too many reset requests. Try again later." };
        }
        await UserRepository.storeResetToken(user.id, resetToken, expiresAt);

        return { status: 202, data: { expiresAt, resetToken } };
    }

    
    async resetPassword(resetToken, utorid, newPassword) {
        
        const user2 = await UserRepository.getUserByResetToken(resetToken);
        if (!user2 ) return { status: 404, message: "Token not found." };

        //if(user.utorid !== utorid)return { status: 401, message: "Unautharized wrong token" };
        if (new Date(user2.expiresAt) < new Date()) {
            return { status: 410, message: "Reset token expired." };
        }
        const user = await UserRepository.findUserbyUtorid(utorid);
        if(!user || user.resetToken != resetToken){
            return { status: 401, message: "Token not found." };
        }
        if(!this._passwordValidator(newPassword)){
            return {status: 400, message: "Bad request: the password must be strong."};
        }
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await UserRepository.updateUser(user.id, { password: hashedPassword, resetToken: null, expiresAt: null });

        return { status: 200, message: "Password reset successfully." };
    }

    _passwordValidator(password){
        const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,20}$/;
        return regex.test(password)
    }
}

module.exports = new AuthService();
