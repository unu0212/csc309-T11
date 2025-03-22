const express = require("express");
const UserService = require("../services/userService");
const TransactionService = require("../services/transactionService");
const {jwtAuth} = require("../middleware/auth");

const router = express.Router();

router.post("/", jwtAuth, async(req, res) => {
    const {utorid, name, email} = req.body;
    if(!utorid || !name || !email){
        return res.status(400).json({message: "invalid payload creating a user"});
    }
    const result = await UserService.registerUser(utorid, name, email, req.user);
    
    return res.status(result.status).json(result.data || { message: result.message });  
})

router.get("/", jwtAuth, async(req, res) => {
    const currentUser = req.user;
    const filters = req.body;
    const result = await UserService.getUsers(filters, currentUser);
    return res.status(result.status).json(result.data || {message: result.message});
})
router.patch("/me", jwtAuth, async(req, res) => {
    const currentUser = req.user;
    const userId = currentUser.id;
    const update = req.body;
    if (Object.keys(update).length === 0) {
        return res.status(400).json({ message: "Bad request: Invalid payload" });
    }
    const result = await UserService.updateUser(userId, currentUser, update);
    return res.status(result.status).json(result.data || {message: result.message});
})

router.get("/me", jwtAuth, async(req, res) => {
    
    const result = await UserService.getUser(req.user.id, req.user);
    const statusCode = result.status || 500;
    return res.status(statusCode).json(result.data || {message: result.message});
})


router.patch("/me/password", jwtAuth, async(req, res)=> {
    const {old, new: newPassword} = req.body;
    if (!old || !newPassword) {
        return res.status(400).json({ message: "Bad request: Invalid payload for updating password" });
    }
    const userId = req.user.id;
    const result = await UserService.updatePassword(userId, old, newPassword);
    return res.status(result.status).json({message: result.message});

});

router.post("/me/transactions", jwtAuth, async(req, res) => {
    const payload = req.body;
    const result = await TransactionService.createRedemptionTransaction(res.user, payload);
    return res.status(statusCode).json(result.data || {message: result.message});
})

router.get("/me/transactions", jwtAuth, async(req, res) => {
    const payload = req.body;
    const result = await TransactionService.getMyTransactions(res.user, payload);
    return res.status(statusCode).json(result.data || {message: result.message});
})

router.get("/:userId", jwtAuth, async(req, res) => {
    const userId = parseInt(req.params.userId, 10);
    if(isNaN(userId) || userId < 0){
        return res.status(404).json({message: "Invalid id."});
    }

    const currentUser = req.user;
    const result = await UserService.getUser(userId, currentUser);
    return res.status(result.status).json(result.data || {message: result.message});
})

router.patch("/:userId", jwtAuth, async(req, res) => {
    const userId = parseInt(req.params.userId, 10);
    if(isNaN(userId) || userId < 0){
        return res.status(404).json({message: "Not found."});
    }
    const update = req.body;
    if (Object.keys(update).length === 0) {
        return res.status(400).json({ message: "Bad request: Invalid payload" });
    }
    const currentUser = req.user;
    const result = await UserService.updateUser(userId, currentUser, update);
    return res.status(result.status).json(result.data || {message: result.message});
})

router.post("/:userId/transactions", jwtAuth, async(req, res) => {
    const userId = parseInt(req.params.userId, 10);
    if(isNaN(userId) || userId < 0){
        return res.status(404).json({message: "Invalid id."});
    }
    const payload = req.body;
    const currentUser = req.user;
    const result = await TransactionService.createTransferTransaction(currentUser, payload, userId);
    return res.status(result.status).json(result.data || {message: result.message});
})

module.exports = router;
