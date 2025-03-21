const express = require("express");
const TransactionService = require("../services/transactionService");
const { jwtAuth } = require("../middlewares/auth");

const router = express.Router();

router.post("/", jwtAuth, async (req, res) => {
    const payload = req.body;
    const result = await TransactionService.createTransaction(res.user, payload);
    return res.status(result.status).json(result.data || { message: result.message });
})

router.get("/", jwtAuth, async (req, res) => {
    const payload = req.body;
    const result = await TransactionService.getTransactions(res.user, payload);
    return res.status(result.status).json(result.data || { message: result.message });
})

router.get("/:transactionId", jwtAuth, async (req, res) =>{
    const transactionId = parseInt(req.params.transactionId, 10);
    if(isNaN(transactionId) || transactionId < 0){
        return res.status(404).json({message: "Invalid id."});
    }
    const result = await TransactionService.getTransaction(res.user, transactionId);
    return res.status(result.status).json(result.data || { message: result.message });
})

router.patch("/:transactionId/suspicious", jwtAuth, async (req, res) =>{
    const transactionId = parseInt(req.params.transactionId, 10);
    if(isNaN(transactionId) || transactionId < 0){
        return res.status(404).json({message: "Invalid id."});
    }
    const suspicious = req.body;
    const result = await TransactionService.updateTransaction(res.user, transactionId, suspicious );
    return res.status(result.status).json(result.data || { message: result.message });
})

router.patch("/:transactionId/processed", jwtAuth, async (req, res) =>{
    const transactionId = parseInt(req.params.transactionId, 10);
    if(isNaN(transactionId) || transactionId < 0){
        return res.status(404).json({message: "Invalid id."});
    }
    const processed = req.body;
    const result = await TransactionService.updateTransaction(res.user, transactionId, processed );
    return res.status(result.status).json(result.data || { message: result.message });
})
module.exports = router;
