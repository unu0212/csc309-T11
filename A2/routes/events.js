const express = require("express");
const router = express.Router();
const { jwtAuth } = require("../middleware/auth");
const EventService = require("../services/eventService");
const TransactionService = require("../services/transactionService");

// router.post("/", jwtAuth, async (req, res) => {
//     const payload = req.body;
//     const result = await TransactionService.createTransaction(req.user, payload);
//     return res.status(result.status).json(result.data || { message: result.message });
// })
router.post("/", jwtAuth, async (req, res) => {
    const currentUser = req.user; // make sure this is from req
    const payload = req.body;
  
    const result = await EventService.createEvent(currentUser, payload); // don't wrap args in object
  
    return res.status(result.status).json(result.data || { message: result.message });
  });

router.get("/", jwtAuth, async (req, res) => {
    const currentUser = req.user;
    const {
      name,
      location,
      started,
      ended,
      showFull,
      page,
      limit,
      published
    } = req.query;
  
    const filters = {
      name,
      location,
      started,
      ended,
      showFull,
      page,
      limit
    };
  
    // Only managers can use 'published' filter
    if (["manager", "superuser"].includes(currentUser.role) && published !== undefined) {
      filters.published = published;
    }
  
    const result = await EventService.getEvents(filters, currentUser);
  
    return res.status(result.status).json(result.data || { message: result.message });
});

router.get("/:eventId", jwtAuth, async (req, res) => {
    const eventId = parseInt(req.params.eventId, 10);
    const currentUser = req.user;
  
    if (isNaN(eventId)) {
      return res.status(400).json({ message: "Invalid eventId" });
    }
  
    const result = await EventService.getEventById(eventId, currentUser);
  
    return res.status(result.status).json(result.data || { message: result.message });
});

router.patch("/:eventId", jwtAuth, async (req, res) => {
    const eventId = parseInt(req.params.eventId, 10);
    const currentUser = req.user;
    const payload = req.body;
  
    if (isNaN(eventId)) {
      return res.status(400).json({ message: "Invalid eventId" });
    }
  
    const result = await EventService.updateEvent(eventId, payload, currentUser);
    return res.status(result.status).json(result.data || { message: result.message });
  });

router.delete("/:eventId", jwtAuth, async (req, res) => {
    const eventId = parseInt(req.params.eventId, 10);
    const currentUser = req.user;
  
    if (isNaN(eventId)) {
      return res.status(400).json({ message: "Invalid eventId" });
    }
  
    const result = await EventService.deleteEvent(eventId, currentUser);
    return result.status === 204
      ? res.status(204).send()
      : res.status(result.status).json({ message: result.message });
});


// /:eventId/organizers/

router.post("/:eventId/organizers", jwtAuth, async (req, res) => {
    const eventId = parseInt(req.params.eventId, 10);
    const { utorid } = req.body;
    const currentUser = req.user;
  
    if (isNaN(eventId)) {
      return res.status(400).json({ message: "Invalid eventId" });
    }
  
    if (!utorid) {
      return res.status(400).json({ message: "Missing required field: utorid" });
    }
  
    const result = await EventService.addOrganizer(currentUser, eventId, utorid);
    return res.status(result.status).json(result.data || { message: result.message });
  });

router.delete("/:eventId/organizers/:userId", jwtAuth, async (req, res) => {
  const eventId = parseInt(req.params.eventId, 10);
  const userId = parseInt(req.params.userId, 10);
  const currentUser = req.user;

  if (isNaN(eventId) || isNaN(userId)) {
    return res.status(400).json({ message: "Invalid eventId or userId" });
  }

  const result = await EventService.removeOrganizer(eventId, userId, currentUser);
  if (result.status === 204) {
    return res.status(204).send();
  }

  return res.status(result.status).json({ message: result.message });
});

//route /:eventId/guests
router.post("/:eventId/guests", jwtAuth, async (req, res) => {
    const eventId = parseInt(req.params.eventId, 10);
    const { utorid } = req.body;
    const currentUser = req.user;
  
    if (isNaN(eventId)) {
      return res.status(400).json({ message: "Invalid eventId" });
    }
  
    if (!utorid) {
      return res.status(400).json({ message: "Missing required field: utorid" });
    }
  
    const result = await EventService.addGuest(currentUser, eventId, utorid );
    return res.status(result.status).json(result.data || { message: result.message });
  });

router.delete("/:eventId/guests/:userId", jwtAuth, async (req, res) => {
    const eventId = parseInt(req.params.eventId, 10);
    const userId = parseInt(req.params.userId, 10);
    const currentUser = req.user;
  
    if (isNaN(eventId) || isNaN(userId)) {
      return res.status(400).json({ message: "Invalid eventId or userId" });
    }
  
    const result = await EventService.removeGuest(eventId, userId, currentUser);
    if (result.status === 204) {
      return res.status(204).send();
    }
  
    return res.status(result.status).json({ message: result.message });
  });

//  /:eventId/guests/me

router.post("/:eventId/guests/me", jwtAuth, async (req, res) => {
    const eventId = parseInt(req.params.eventId, 10);
    const currentUser = req.user;
  
    if (isNaN(eventId)) {
      return res.status(400).json({ message: "Invalid eventId" });
    }
  
    const result = await EventService.addSelfAsGuest(currentUser, eventId);
    return res.status(result.status).json(result.data || { message: result.message });
  });

router.delete("/:eventId/guests/me", jwtAuth, async (req, res) => {
    const eventId = parseInt(req.params.eventId, 10);
    const currentUser = req.user;
  
    if (isNaN(eventId)) {
      return res.status(400).json({ message: "Invalid eventId" });
    }
  
    const result = await EventService.removeSelfAsGuest(eventId, currentUser);
    if (result.status === 204) {
      return res.status(204).send();
    }
  
    return res.status(result.status).json({ message: result.message });
  });

router.post("/:eventId/transactions", jwtAuth, async (req, res) => {
    const eventId = parseInt(req.params.eventId, 10);
    const currentUser = req.user;
    const payload = req.body;
  
    if (isNaN(eventId)) {
      return res.status(400).json({ message: "Invalid eventId" });
    }
  
    const result = await EventService.createEventTransaction(currentUser, eventId, payload);
  
    return res.status(result.status).json(result.data || { message: result.message });
  });

module.exports = router;