const bcrypt = require('bcrypt');
const UserRepository = require('../repositories/userRepository');
const { generateResetToken } = require("../utils/tokenHelpers");

class UserService {

    async registerUser(utorid, name, email, currentUser) {
        if (!["cashier", "manager", "superuser"].includes(currentUser.role)) {
            return { status: 403, message: "Forbidden: Only Cashiers or higher can register users." };
        }
        if(typeof utorid !== 'string' || typeof name !== 'string' || typeof email !== 'string'){
            return {status: 400, message: "invalid payload for registering user must be string."};
        }
        const regex = /^[a-zA-Z0-9]{8}$/;
        if (!regex.test(utorid)){
            return {status: 400, message: "This is an invalid utorid must be alphanumeric with 8chars."}
        }
        if(!(name.length >= 1 && name.length <= 50)){
            return {status: 400, message: "This is an invalid name must be <50chars"};
        }
        const isValidUofTEmail = this._isValidUofTEmail(email);
        if(!isValidUofTEmail){
            return {status: 400, message: "This is an invalid email, must be Uoft email."}
        }
        const existingUser = await UserRepository.findUserbyUtorid(utorid);
        const emailExists = await UserRepository.findUserbyEmail(email);
        if (existingUser || emailExists) {
            return { status: 409, message: "User with this utorId or email exists." };
        }

        
        const resetToken = generateResetToken();
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        const newUser = await UserRepository.createUser({
            utorid,
            name,
            email,
            verified: false,
            role: "regular",
            password: '',
            resetToken,
            expiresAt,
        });

        return { status: 201, data: { 
            id: newUser.id, 
            utorid, 
            name, 
            email, 
            verified: false,
            expiresAt,
            resetToken } };
    }
    
    async getUsers(filters, currentUser) {
        
        if (currentUser.role !== 'manager' && currentUser.role !== 'superuser') {
            return { status: 403, message: "Forbidden: You do not have permission to view users." };
        }
        const validationResult = await this._validatePayload(0, currentUser, filters, 'get');
        if (validationResult.status !== 200){
            return validationResult;
        }
        let page = 1;
        let limit = 10;
        if (filters.page){
            page = filters.page;
        }
        if(filters.limit){
            limit = filters.limit;
        }
        
        const result = await UserRepository.findAllUsers(filters, page, limit);
        return { status: 200, data: result };
    }

    async getUser(userId, currentUser){
        if(currentUser.role === 'manager' || currentUser.role === 'superuser' ||
        currentUser.id === userId){
            const user = await UserRepository.findUserbyId_allInfo(userId);
            if(!user){
                return {status: 404, message: "User with this Id is not found."};
            }
            return {status: 200, data: user};
        }

        if(currentUser.role === 'cashier'){
            const user = await UserRepository.findUserbyId_lower(userId);
            if(!user){
                return {status: 404, message: "User with this Id is not found."};
            }
            return {status: 200, data: user};
        }

        if (currentUser.role === 'regular'){
            return {status: 403, message: "Forbidden: You do not have permission for this action."};
        }
    }

    async updateUser(userId, currentUser, update){
        const existsUser = await UserRepository.findUserbyId_lower(userId);
        if(!existsUser){
            return {status: 404, message: "User with this Id is not found."};
        }
        if(currentUser.id !== userId){
            if (currentUser.role === 'regular' || currentUser.role === 'cashier'){
                return {status: 403, message: "Forbidden: You do not have permission for this action."};
            }
        }
        //Validating the payload
        const validationResult = await this._validatePayload(userId, currentUser, update, 'patch');
        if (validationResult.status !== 200){
            return validationResult;
        }
        //let updatedUser;
        if(currentUser.id === userId){
            const updatedUser = await UserRepository.updateMyInfo(userId, update);
            
            return { status: 200, data: updatedUser };
            //return { status: 200, data: await UserRepository.updateMyInfo(userId, update) };
        }
        const updatedUser = await UserRepository.updateUser(userId, update);
        console.log(update);
        return { status: 200, data: updatedUser };
        

        //return {status: 200, data: updatedUser};
    }

    async updatePassword(userId, oldpass, newPass){
        if(typeof oldpass!== 'string' || typeof newPass !== 'string'){
            return {status: 400, message: "Invalid payload passwords must be string"};
        }
        const user = await UserRepository.getUserbyId(userId);
        if(!user){
            return {status: 404, message: "User with this Id is not found."};
        }
        
        const passCorrect = await bcrypt.compare(oldpass, user.password);
        if (!passCorrect){
            return {status: 403, message: "Forbidden, password incorrect."};
        }

        if(!this._passwordValidator(newPass)){
            return {status: 400, message: "Bad request: password must be strong"};
        }

        const hashedPass = await bcrypt.hash(newPass, 10);

        await UserRepository.updateUser(userId, {password: hashedPass});
        return {status: 200, message: "The password has been successfully updated." };
    }

    // Helper function to check if the payload is valid for Patch requests.
    async _validatePayload(userId, currentUser, payload, type){
        let allowedFields = new Set();
        let updateUser;
        if(type == 'patch'){    
            if (currentUser.id === userId){
                allowedFields = new Set(['name', 'email', 'birthday', 'avatar']); 
            }
            else if (currentUser.role === 'manager' || currentUser.role === 'superuser'){
                allowedFields = new Set(['email', 'verified', 'suspicious', 'role']);
            }
            updateUser = await UserRepository.getUserbyId(userId);
        }
        if(type == 'get'){
            allowedFields = new Set(['name', 'role', 'verified', 'activated', 'page', 'limit']);
        }

        for (const key in payload) {
            
            if (!allowedFields.has(key)) {
                console.log(key, payload[key]);
                return { status: 400, message: "Bad request: Invalid payload end" };
            }
    
            if (key === 'name' && typeof payload[key] !== 'string') {
                return { status: 401, message: "Invalid data type: 'name' must be a string." };
            }
            if (key === 'email' && (typeof payload[key] !== 'string' || payload[key] !== null)) {
                return { status: 402, message: "Invalid data type: 'email' must be a string." };
            }
            if (key === 'email' && payload[key] !== null){
                const isValidUofTEmail = this._isValidUofTEmail(payload[key]);
                if(!isValidUofTEmail){
                    return {status: 403, message: "This is an invalid email, must be Uoft email."};
                }   
            }
            
            if (key === 'birthday' && !/^\d{4}-\d{2}-\d{2}$/.test(payload[key])) {
                return { status: 400, message: "Invalid data format: 'birthday' must be in YYYY-MM-DD format." };
            }
            if (key === 'avatar' && typeof payload[key] !== 'string') {
                return { status: 400, message: "Invalid data type: 'avatar' must be a string (URL or file path)." };
            }
            if (key === 'verified' && typeof payload[key] !== 'boolean') {
                return { status: 405, message: "Invalid data type: 'verified' must be a boolean." };
            }
            if (key === 'verified' && payload[key] !== true) {
                return { status: 406, message: "Invalid data type: 'verified' must be set to true." };
            }
            if (key === 'suspicious' && (typeof payload[key] !== 'boolean' || payload[key] !== null)) {
                return { status: 407, message: "Invalid data type: 'suspicious' must be a boolean." };
            }
            if (key === 'activated' && typeof payload[key] !== 'boolean') {
                return { status: 400, message: "Invalid data type: 'activated' must be a boolean." };
            }
            if( key === 'role'){
                if(typeof payload[key] !== 'string'){
                    return { status: 400, message: "Invalid value: 'role' must be a string" };
                }
                if (!['regular', 'cashier', 'manager', 'superuser'].includes(payload[key])) {
                    return { status: 400, message: "Invalid value: 'role' must be one of 'regular', 'cashier', 'manager', or 'superuser'." };
                }
                if (payload[key] === 'cashier' && type === 'patch' && updateUser.suspicious !== false ) {
                    return { status: 409, message: "If role is set to 'cashier', 'suspicious' must be false." };
                }
                if (currentUser.role === 'manager' && type === 'patch' && !['regular', 'cashier'].includes(payload[key]) ) {
                    return { status: 410, message: "Managers can only assign roles 'regular' or 'cashier'." };
                }
                
            }
            if (key === 'page' && (typeof payload[key] !== 'number' || !(Number.isInteger(page)) || (page <= 0))) {
                return { status: 400, message: "Invalid data type: 'page' must be a number." };
            }
            if (key === 'limit' && typeof payload[key] !== 'number' && !Number.isInteger(limit) && limit <= 0) {
                return { status: 400, message: "Invalid data type: 'limit' must be a number." };
            }
            
        }

        return {status: 200};
    }

    _passwordValidator(password){
        const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,20}$/;
        return regex.test(password)
    }

    _isValidUofTEmail(email) {
        const uoftEmailRegex = /^[a-zA-Z0-9._%+-]+@mail\.utoronto\.ca$/i;
        return uoftEmailRegex.test(email);
    }
}

module.exports = new UserService();