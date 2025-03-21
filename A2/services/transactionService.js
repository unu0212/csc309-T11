const TransactionRepository = require("../repositories/transactionRepo");
const UserRepository = require('../repositories/userRepository');

class TransactionService {

    //check for promitionId expiration. and how promotion affects points
    async createTransaction(currentUser, update){
        if(!update.type){
            return {status: 400, message: "Missing required field: type"};
        }
        if(payload.type !== 'purchase' || payload.type !== 'adjustment'){
            return {status: 400, message: "type must be purchase or adjustment"};
        }
        if(update.type === 'purchase'){
            if(currentUser.role === 'regular'){
                return {status: 403, message: "This action is not permitted, must be cashier or higher"}
            }

            const requiredFields = ['utorid', 'spent'];
            const missingFields = requiredFields.filter(field => !(field in update));
            if (missingFields.length > 0) {
                return {status: 400, message: `Missing required fields: ${missingFields.join(", ")}`};
            }

            const validPayload = this._validatePayload(update, update.type);
            if(validPayload.status !== 200){
                return {status: validPayload.status, message: validPayload.message};
            }

            const customer = await UserRepository.findUserbyUtorid(update.utorid);
            if(!customer){
                return {status: 400, message: "A user with this utorid does not exist"};
            }

            const amount = Math.round(update.spent * 4); // 1 point per $0.25 spent
            let earned = amount;
            const newTransaction = await TransactionRepository.createTransaction(currentUser.utorid, update, amount);
            
            if(currentUser.suspicious == true){
                earned -= amount;
            }
            
            const successfullyUpdated = await UserRepository.updateUserPoints(update.utorid, earned);
            if(!successfullyUpdated){
                return {status: 500, message: "was not able to update earned points"}
            }

            return {status: 201, data: { 
                utorid: newTransaction.utorid,
                type: newTransaction.type, 
                spent: newTransaction.spent, 
                earned: earned,
                remark: newTransaction.remark,
                promotionIds: newTransaction.promotionIds,
                createdBy: newTransaction.createdBy
            } }
        }

        if(update.type == 'adjustment'){
            if(currentUser.role !== 'manager' || currentUser.role !== 'superuser'){
                return {status: 403, message: "This action is not permitted, must be manager or higher"}
            }

            const requiredFields = ['utorid', 'amount', 'relatedId'];
            const missingFields = requiredFields.filter(field => !(field in update));
            if (missingFields.length > 0) {
                return {status: 400, message: `Missing required fields: ${missingFields.join(", ")}`};
            }
            const validPayload = this._validatePayload(update, update.type);
            if(validPayload.status !== 200){
                return {status: validPayload.status, message: validPayload.message};
            }

            const customer = await UserRepository.findUserbyUtorid(update.utorid);
            if(!customer){
                return {status: 400, message: "A user with this utorid does not exist"};
            }

            const transaction = await TransactionRepository.getTransactionById(relatedId);
            if(!transaction){
                return {status: 400, message: "A transaction with this id does not exist"};
            }
            const newTransaction = await TransactionRepository.createTransaction(currentUser.utorid, update);
            const successfullyUpdated = await UserRepository.updateUserPoints(update.utorid, update.amount);
            if(!successfullyUpdated){
                return {status: 500, message: "was not able to update earned points"}
            }

            return {status: 201, data: { 
                utorid: newTransaction.utorid,
                type: newTransaction.type, 
                amount: newTransaction.amount, 
                relatedId: newTransaction.relatedId,
                promotionIds: newTransaction.promotionIds,
                remark: newTransaction.remark
            } }
        } 
        
    }

     
    async createTransferTransaction(currentUser, payload, userId){
        const requiredFields = ['type', 'amount'];
            const missingFields = requiredFields.filter(field => !(field in payload));
            if (missingFields.length > 0) {
                return {status: 400, message: `Missing required fields: ${missingFields.join(", ")}`};
            }
        if(payload.type !== 'transfer'){
            return {status: 400, message: "type must be transfer"};
        }
        const validPayload = this._validatePayload(payload, payload.type);
        if(validPayload.status !== 200){
            return {status: validPayload.status, message: validPayload.message};
        }
        
        const recipient = await UserRepository.getUserbyId(userId);
        if(!recipient){
            return {status: 400, message: "user with this id does not exist for this transaction"};
        }
        if(payload.amount <= 0){
            return {status: 400, message: "amount must be positive"};
        }
        
        if(currentUser.points < payload.amount){
            return {status: 400, message: "not enough points"};
        }

        const payloadsent = { ...payload, utorid: currentUser.utorid, relatedId: userId };
        const payloadreceived = { ...payload, utorid: recipient.utorid, relatedId: currentUser.id};
        const sent = await TransactionRepository.createTransaction(currentUser.utorid, payloadsent);
        const received = await TransactionRepository.createTransaction(currentUser.utorid, payloadreceived);
        
        const sentUpdateUser = await UserRepository.updateUserPoints(currentUser.utorid, -payload.amount);
        const receivedUpdateUser = await UserRepository.updateUserPoints(recipient.utorid, payload.amount);
        if(!sentUpdateUser || !receivedUpdateUser){
            return {status: 500, message: "was not able to update earned points"}
        }
        if(!sent || !received){
            return {status: 500, message: "createTransferTransaction"};
        }

        return {status: 201, data: {
            id: sent.id,
            sender: sent.utorid,
            recipient: received.utorid,
            type: sent.type,
            sent: sent.amount,
            ...(sent.remark && { remark: sent.remark }),
            createdBy: sent.createdBy
        }};
    }

    async createRedemptionTransaction(currentUser, payload) {

        if(!payload.type){
            return {status: 400, message: "type must be included in this transaction"};
        }
        if(payload.type !== 'redemption'){
            return {status: 400, message: "type must be redemption"};
        }
        const validPayload = this._validatePayload(payload, payload.type);
        if(validPayload.status !== 200){
            return {status: validPayload.status, message: validPayload.message};
        }
        if(payload.amount <= 0){
            return {status: 400, message: "amount must be positive"};
        }
        if(currentUser.points < payload.amount){
            return {status: 400, message: "not enough points"};
        }

        const newTransaction = await TransactionRepository.createTransaction(currentUser.utorid, payload);

        return { status: 201, data: {id: newTransaction.id, 
            utorid: newTransaction.utorid, 
            type: newTransaction.type, 
            processedBy: newTransaction.processedBy,
            amount: newTransaction.amount,
            remark: newTransaction.remark,
            createdBy: newTransaction.createdBy
        } };
    }


    async getTransactions(currentUser, filter){
        if(currentUser.role !== 'manager' || currentUser.role !== 'superuser'){
            return {status: 403, message: "This action is not permitted, must be manager or higher"};
        }

        const validFilter = this._validatePayload(filter, 'getTransactions');
        if(validFilter !== 200){
            return {status: validFilter.status, message: validFilter.message};
        }

        let page = 1;
        let limit = 10;
        if (filter.page){
            page = filter.page;
        }
        if(filter.limit){
            limit = filter.limit;
        }

        const result = await TransactionRepository.getTransactions(filter, page, limit);
        return { status: 200, data: result };
    }

    async getTransaction(currentUser, transactionId){
        if(currentUser.role !== 'manager' || currentUser.role !== 'superuser'){
            return {status: 403, message: "This action is not permitted, must be manager or higher"};
        }
        const transaction = await TransactionRepository.getTransactionById(transactionId);
        if(!transaction){
            return {status: 400, message: "Transaction with this id doesn't exist"};
        }
        return {status: 200, data: { id: transaction.id, utorid: transaction.utorid, type: transaction.type,
                                    spent: transaction.spent, amount: transaction.amount, promotionIds: transaction.promotionIds,
                                    suspicious: transaction.suspicious, remark: transaction.remark, createdBy: transaction.createdBy}}
    }

    async getMyTransactions(currentUser, payload){
        const validPayload = this._validatePayload(payload, 'getMyTransactions');
        if(validPayload.status !== 200){
            return validPayload
        }
        let page = 1;
        let limit = 10;
        if (filter.page){
            page = filter.page;
        }
        if(filter.limit){
            limit = filter.limit;
        }
        const transactions = await TransactionRepository.getTransactions(payload, page, limit, currentUser.utorid);
        return  {status: 200, data: transactions};
    }

    async updateTransaction(currentUser, transactionId, update){
        if(currentUser.role !== 'manager' || currentUser.role !== 'superuser'){
            return {status: 403, message: "This action is not permitted, must be manager or higher"};
        }
        if(!update.suspicious || !update.processed){
            return {status: 400, message: "Invalid Payload"};
        }
        if(typeof update.suspicious !== 'boolean' || typeof update.processed !== 'boolean'){
            return {status: 400, message: "Invalid Payload, must be boolean"};
        }
        const transaction = TransactionRepository.getTransactionById(transactionId);
        if(!transaction){
            return {status: 400, message: "Transaction with this Id does not exist"};
        }

        if(update.suspicious){
            if(update.suspicious === true){
                const updated = await TransactionRepository.update(transactionId, update);
                await UserRepository.updateUserPoints(transaction.utorid, transaction.amount);
                return {status: 200, data: {id: updated.id, utorid: updated.utorid, type: updated.type,
                                            spent: updated.spent, amount: updated.amount, promotionIds: updated.promotionIds,
                                            suspicious: updated.suspicious, remark: update.remark, createdBy: updated.createdBy }}
            }
            else if(update.suspicious === false){
                const updated = await TransactionRepository.update(transactionId, update);
                await UserRepository.updateUserPoints(transaction.utorid, -transaction.amount);
                return {status: 200, data: {id: updated.id, utorid: updated.utorid, type: updated.type,
                    spent: updated.spent, amount: updated.amount, promotionIds: updated.promotionIds,
                    suspicious: updated.suspicious, remark: update.remark, createdBy: updated.createdBy }}
            }
        }
        if(update.processed){
            if(transaction.type !== 'redemption'){
                return {status: 400, message: "Transaction is not of type 'redemption'"};
            }
            if(update.processed === false){
                return {status: 400, message: "processed can only be true"};
            }
            if(update.processed === true && transaction.processed === true){
                return {status: 400, message: "already processed"};
            }
            if(update.processed === true && transaction.processed !== true){
                const updated = await TransactionRepository.update(transactionId, update, currentUser.utorid);
                await UserRepository.updateUserPoints(transaction.utorid, -transaction.amount)
                return {status: 200, data: {id: updated.id, utorid: updated.utorid, type: updated.type,
                                            processedBy: updated.processedBy, redeemed: updated.amount,
                                            remark: updated.remark, createdBy: updated.createdBy}}
            }

        }
    }
    // async transferPoints(senderId, receiverId, amount) {
    //     // Deduct from sender
    //     await TransactionRepository.createTransaction({
    //         utorid: senderId,
    //         type: "transfer",
    //         amount: -amount,
    //         createdBy: senderId,
    //         relatedId: receiverId,
    //     });

    //     // Add to receiver
    //     const transaction = await TransactionRepository.createTransaction({
    //         utorid: receiverId,
    //         type: "transfer",
    //         amount,
    //         createdBy: senderId,
    //         relatedId: senderId,
    //     });

    //     return { status: 201, data: transaction };
    // }

    _validatePayloadType(payload){
        for (const key in payload) {
            if(key === 'id' && typeof payload[key] !== 'number'){
                return {status: 400, message: "Bad Request: id must be number"};
            }
            if(key === 'utorid' && typeof payload[key] !== 'string'){
                return {status: 400, message: "Bad Request: utorid must be string"};
            }
            if(key === 'type'){
                if(typeof payload[key] !== 'string'){
                    return { status: 400, message: "Invalid value: 'role' must be a string" };
                }
                if (!['purchase', 'adjustment', 'redemption', 'transfer', 'event'].includes(payload[key])) {
                    return { status: 400, message: "Invalid value: 'role' must be one of 'purchase', 'adjustment', 'redemption', 'transfer', 'event'." };
                }
            }
            if(key === 'spent' && typeof payload[key] !== 'number'){
                return {status: 400, message: "Bad Request: spent must be number"};
            }
            if(key === 'amount' && typeof payload[key] !== 'number'){
                return {status: 400, message: "Bad Request: amount must be number"};
            }
            if(key === 'relatedId' && typeof payload[key] !== 'number'){
                return {status: 400, message: "Bad Request: relatedId must be number"};
            }
            if(key === 'promotionId' && typeof payload[key] !== 'number'){
                return {status: 400, message: "Bad Request: promotiondId must be number"};
            }
            if(key === 'operator' &&  (payload[key] !== 'gte' || payload[key] !== 'lte')){
                return {status: 400, message: "Bad Request: operator must be 'gte' or 'lte"};
            }
            if(key === 'promotionIds' && typeof payload[key] !== 'array'){
                return {status: 400, message: "Bad Request: promotionIds must be array"};
            }
            if(key === 'suspicious' && typeof payload[key] !== 'boolean'){
                return {status: 400, message: "Bad Request: suspicious must be boolean"};
            }
            if(key === 'remark' && typeof payload[key] !== 'string'){
                return {status: 400, message: "Bad Request: remark must be string"};
            }
            if(key === 'createdBy' && typeof payload[key] !== 'string'){
                return {status: 400, message: "Bad Request: createdBy must be string"};
            }
            if(key === 'processedBy' && typeof payload[key] !== 'string'){
                return {status: 400, message: "Bad Request: processedBy must be string"};
            }
            if(key === 'page' && typeof payload[key] !== 'number'){
                return {status: 400, message: "Bad Request: page must be number"};
            }
            if(key === 'limit' && typeof payload[key] !== 'number'){
                return {status: 400, message: "Bad Request: limit must be number"};
            }

        }
        return {status: 200, data: payload};
    }

    _validatePayload(payload, type){
        let allowedFields = new Set();
        if(type == 'purchase'){    
            allowedFields = new Set(['utorid', 'type', 'spent', 'promotionIds', 'remark']); 
            
        }
        if(type == 'adjustment'){
            allowedFields = new Set(['utorid', 'type', 'amount', 'relatedId', 'promotionIds', 'remark']);
        }

        if(type == 'transfer' || type == 'redemption'){
            allowedFields = new Set(['type', 'amount', 'remark']);
        }

        if(type == 'getTransactions'){
            allowedFields = new Set(['name', 'createdBy', 'suspicious', 'promotionId', 'type', 'relatedId', 
                                    'amount', 'operator', 'page', 'limit']);
        }
        
        if(type == 'getMyTransactions'){
            allowedFields = new Set(['promotionId', 'type', 'relatedId', 
                                    'amount', 'operator', 'page', 'limit']);
        }
        for (const key in payload) {
            
            if (!allowedFields.has(key)) {
                console.log(key, payload[key]);
                return { status: 400, message: "Bad request: Invalid payload end" };
            }
        }
        const validPayloadType = this._validatePayloadType(payload);

        if(validPayloadType.status !== 200){
            return {status: validPayloadType.status, message: validPayloadType.message};
        }
        return {status: 200, data: payload};
    }
}

module.exports = new TransactionService();
