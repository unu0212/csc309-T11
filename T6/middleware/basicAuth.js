const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const basicAuth = async (req, res, next) => { 
    const authHeader = req.headers['authorization']; 
    if (!authHeader) { 
        req.user = null;
        return next();
    }

    // TODO:
    // 1. Parse authHeader to extract the username and password.
    // 2. Check the database for the user with matching username and password.
    // 3. If found, set req.user to it and allow the next middleware to run.
    // 4. If not, immediate respond with status code 401 and this JSON data: { message: "Invalid credentials" } 
    const baseCred = authHeader.split(" ")[1];
    const credentials = Buffer.from(baseCred, 'base64').toString('utf-8');
    const [username, password] = credentials.split(":");

    if (!username || !password) {
        return res.status(401).json({message: "Invalid credentails"});
    }
    const user = await prisma.user.findUnique({where: {username: username}});
    //const pass = await prisma.user.findUnique({where: {password: password}});
    if (!user || user.password !== password){
        return res.status(401).json({message: "Invalid credentials"});
    }
    req.user = user;
    return next();

}; 

module.exports = basicAuth;