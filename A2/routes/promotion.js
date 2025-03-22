const express = require("express");
const router = express.Router();
const { jwtAuth } = require("../middleware/auth");
const PromotionService = require("../services/promotionService");

router.post("/", jwtAuth, async (req, res) => {
  const result = await PromotionService.createPromotion(req.user, req.body);
  res.status(result.status).json(result.data || { message: result.message });
});

router.get("/", jwtAuth, async (req, res) => {
  const result = await PromotionService.getPromotions(req.query, req.user);
  res.status(result.status).json(result.data || { message: result.message });
});

router.get("/:promotionId", jwtAuth, async (req, res) => {
  const promotionId = parseInt(req.params.promotionId);
  const result = await PromotionService.getPromotionById(promotionId, req.user);
  res.status(result.status).json(result.data || { message: result.message });
});

router.patch("/:promotionId", jwtAuth, async (req, res) => {
  const promotionId = parseInt(req.params.promotionId);
  const result = await PromotionService.updatePromotion(req.user, promotionId, req.body);
  res.status(result.status).json(result.data || { message: result.message });
});

router.delete("/:promotionId", jwtAuth, async (req, res) => {
  const promotionId = parseInt(req.params.promotionId);
  const result = await PromotionService.deletePromotion(promotionId, req.user);
  return result.status === 204
    ? res.status(204).send()
    : res.status(result.status).json({ message: result.message });
});

module.exports = router;
