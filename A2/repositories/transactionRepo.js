const {PrismaClient} = require('@prisma/client');
const prisma = new PrismaClient();

class TransactionRepository {


    async createTransaction(createdBy, payload, amount) {
        const utorid = payload.utorid;
        return prisma.transaction.create({
            data: {... payload, 
                ...(amount !== undefined && { amount }),
                createdBy: createdBy,
                user: {connect: {utorid}}
            }
        });
    }

    async getTransactionById(transactionId) {
        return prisma.transaction.findUnique({ where: { id: transactionId } });
    }

    async getTransactionsByUtorid(utorid){
        const transactions = await prisma.user.findMany({
            where: {utorid},
            select: {
                id: true,
                type: true,
                spent: true,
                amount: true,
                promotionIds: true,
                remark: true,
                createdBy: true,
            }
        });

        const count = await prisma.user.count({ where:{utorid} });

        return { count, results: transactions };
    }
    async getTransactions(filters, page = 1, limit = 10, utorid) {
        const skip = (page - 1) * limit;

        // Construct filtering conditions dynamically
        let where = {};

        
        if (filters.name) {
            where.OR = [
                { utorid: { contains: filters.name, mode: 'insensitive' } },
                { user: { name: { contains: filters.name, mode: 'insensitive' }} }
            ];
        }

        if (filters.createdBy) {
            where.createdBy = filters.createdBy;
        }

        if (filters.suspicious !== undefined) {
            where.suspicious = filters.suspicious === true;
        }

        if (filters.promotionId) {
            where.promotionIds = {
                some: { id: Number(filters.promotionId) }
            };
        }

        if (filters.type) {
            where.type = filters.type;
        }

        if (filters.relatedId && filters.type) {
            where.relatedId = Number(filters.relatedId);
        }

        if (filters.amount && filters.operator && ["gte", "lte"].includes(filters.operator)) {
            where.amount = { [filters.operator]: Number(filters.amount) };
        }
        if(utorid){
            where.utorid = utorid;
            const transactions = await prisma.transaction.findMany({
                where,
                skip,
                take,
                select: {
                    id: true,
                    type: true,
                    spent: true,
                    amount: true,
                    promotionIds: true,
                    remark: true,
                    createdBy: true,
                  }
            });
        
            const count = await prisma.transaction.count({ where });
        
            return { count, results: transactions };
        }
        
        const transactions = await prisma.transaction.findMany({
            where,
            skip,
            take,
            select: {
                id: true,
                utorid: true,
                amount: true,
                type: true,
                spent: true,
                promotionIds: true,
                suspicious: true,
                remark: true,
                createdBy: true,
              }
        });
    
        const count = await prisma.transaction.count({ where });
    
        return { count, results: transactions };
    }

    async update (transactionId, update, processedBy) {
        return prisma.transaction.update({
            where: { id: transactionId },
            data: {update,
                ...(processedBy !== undefined && { processedBy })}
        });
    }
    async updateUser(id, update){
        return prisma.user.update({
            where: {id},
            data: update,
            select: { id: true, utorid: true, name: true, ...Object.keys(update).reduce((acc, key) => ({ ...acc, [key]: true }), {}) }
        });
    }
}

module.exports = new TransactionRepository();
