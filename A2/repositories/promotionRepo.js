const {PrismaClient} = require('@prisma/client');
const prisma = new PrismaClient();

class PromotionRepository {
    createPromotion(data) {
      return prisma.promotion.create({ data });
    }
  
    findPromotions(where, skip, take, select) {
      return prisma.promotion.findMany({ where, skip, take, select });
    }
  
    countPromotions(where) {
      return prisma.promotion.count({ where });
    }
  
    findPromotionById(id, select) {
      return prisma.promotion.findUnique({ where: { id }, select });
    }
  
    updatePromotion(id, data) {
      return prisma.promotion.update({ where: { id }, data });
    }
  
    deletePromotion(id) {
      return prisma.promotion.delete({ where: { id } });
    }
  }
  
  module.exports = new PromotionRepository();