const {PrismaClient} = require('@prisma/client');
const prisma = new PrismaClient();

class UserRepository {

    async getUserbyId(id){
        return prisma.user.findUnique({where: {id}});
    }
    
    async getUserByResetToken(utorid, resetToken){
        return prisma.user.findUnique({ where: {utorid, resetToken } });
    }

    async findUserbyId_lower(id){
        return prisma.user.findUnique({
            where: {id},
            select: {
                id: true,
                utorid: true,
                name: true,
                points: true,
                verified: true,
                promotions: true
            }
        });
    }
    async findUserbyId_allInfo(id){
        return prisma.user.findUnique({
            where: {id},
            select: {
                id: true,
                utorid: true,
                name: true,
                email: true,
                birthday: true,
                role: true,
                points: true,
                createdAt: true,
                lastLogin: true,
                verified: true,
                avatarUrl: true,
                promotions: true
            }
        });
    }

    async findUserbyUtorid(utorid){
        return prisma.user.findUnique({where: {utorid}});
    }

    async findUserbyEmail (email){
        return prisma.user.findUnique({where: {email}});
    }

    async findAllUsers(filters, page = 1, limit = 10) {
        const skip = (page - 1) * limit;

        // Construct filtering conditions dynamically
        let where = {};

        if (filters.name) {
            where.OR = [
                { utorid: { contains: filters.name, mode: 'insensitive' } },
                { name: { contains: filters.name, mode: 'insensitive' } }
            ];
        }

        if (filters.role) {
            where.role = filters.role;
        }

        if (filters.verified !== undefined) {
            where.verified = filters.verified;
        }

        if (filters.activated !== undefined) {
            where.lastLogin = filters.activated ? { not: null } : null;
        }

        // Retrieve users with filters and pagination
        const users = await prisma.user.findMany({
            where,
            skip,
            take: limit,
            select: {
                id: true, 
                utorid: true,
                email: true, 
                birthday: true,
                role: true,
                points: true,
                createdAt: true,
                lastLogin: true,
                verified: true,
                avatarUrl: true
            }
        });

        // Count total users matching the filters (for pagination)
        const count = await prisma.user.count({ where });

        return { count, results: users };
    }

    async createUser(data){
        return prisma.user.create({data})
    }

    async updateUser(id, update){
        return prisma.user.update({
            where: {id},
            data: update,
            select: { id: true, utorid: true, name: true, ...Object.keys(update).reduce((acc, key) => ({ ...acc, [key]: true }), {}) }
        });
    }

    async updateUserPoints(utorid, points){
        return prisma.user.update({
            where: {utorid},
            data: {points: { increment: points }},
            select: {points: true}
        })
    }



    async updateMyInfo(id, update){
        return prisma.user.update({
            where: {id},
            data: update, 
            select: {
                id: true, 
                utorid: true,
                name: true, 
                email: true,
                birthday: true,
                role: true,
                points: true,
                createdAt: true,
                lastLogin: true,
                verified: true,
                avatarUrl: true
            }
        });
    }

    async storeResetToken(userId, resetToken, expiresAt) {
        return prisma.user.update({
            where: { id: userId },
            data: { resetToken, expiresAt },
        });
    }

    async checkPassword(id, pass){
        return prisma.user.findUnique({
            where: {id,
            password: pass}
        });
    }
    async updateUserpassword(id, new_pass){
        return prisma.user.update({
            where: {id: id},
            data: {password: new_pass }
        });
    }
}

module.exports = new UserRepository();