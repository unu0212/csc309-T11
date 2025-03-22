const TransactionRepository = require("../repositories/transactionRepo");
const UserRepository = require('../repositories/userRepository');
const EventRepository = require('../repositories/eventRepo');

class EventService {

    async createEvent(currentUser, payload){
        const requiredFields = ['name', 'description', 'location', 'startTime', 'endTime', 'points'];
        const missingFields = requiredFields.filter(field => !(field in payload));
        if (missingFields.length > 0) {
            return {status: 400, message: `Missing required fields: ${missingFields.join(", ")}`};
        }
        const now = new Date();
        if (new Date(payload.startTime) >= new Date(payload.endTime)) {
            return { status: 400, message: "endTime must be after startTime." };
        }
        if (new Date(payload.startTime) <= now) {
            return { status: 400, message: "endTime must be after startTime." };
        }
        if(!["manager", "superuser"].includes(currentUser.role)){
            return {status: 403, message: "unauthorized to create event, manager or higher"};
        }

        const validationResult = this._validatePayload(payload);
        if(validationResult !== 200) return validationResult;

        const newEvent = await EventRepository.createEvent(payload);
        return {status: 201, 
            data: {id: newEvent.id,
                    name: newEvent.name,
                    description: newEvent.description,
                    location: newEvent.location,
                    startTime: newEvent.startTime,
                    endTime: newEvent.endTime,
                    capacity: newEvent.capacity,
                    pointsRemain: newEvent.pointsRemain,
                    pointsAwarded: newEvent.pointsAwarded,
                    published: newEvent.published,
                    organizers: newEvent.organizers,
                    guests: newEvent.guests
            }}
        
    }

    async addOrganizer(currentUser, eventId, utorid){
        if (!["manager", "superuser"].includes(currentUser.role)) {
            return { status: 403, message: "Only managers or higher can add organizers." };
          }
        
          const event = await EventRepository.getEventbyId(eventId);
          if (!event) return { status: 404, message: "Event not found." };
        
          const now = new Date();
          if (new Date(event.endTime) <= now) {
            return { status: 410, message: "Event has already ended cant add organizer" };
          }
        
          const user = await UserRepository.findUserbyUtorid(utorid);
          if (!user) {
            return { status: 404, message: "User not found." };
          }
        
          const isGuest = event.guests.some(g => g.utorid === utorid);
          if (isGuest) {
            return { status: 400, message: "User is already a guest. Remove guest before adding as organizer." };
          }
          const updated = await EventRepository.connectOrganizer(eventId, utorid);
        return { status: 201, data: updated };
    }

    async addGuest(currentUser, eventId, utorid) {
        if(!utorid) return {status: 400, message: "invalid payload include utorid"}
        const event = await EventRepository.getEventbyId(eventId);
        if (!event) return { status: 404, message: "Event not found." };
      
        const isManager = ["manager", "superuser"].includes(currentUser.role);
        const isOrganizer = event.organizers.some(o => o.id === currentUser.id);
      
        if (!isManager && !isOrganizer) {
          return { status: 403, message: "Only managers or event organizers can add guests." };
        }
      
        if (!event.published && !isManager) {
          return { status: 404, message: "Event is not visible yet." };
        }
      
        const user = await UserRepository.findUserbyUtorid(utorid);
        if (!user) return { status: 404, message: "User not found." };
      
        const isAlreadyGuest = event.guests.some(g => g.utorid === utorid);
        if (isAlreadyGuest) {
          return { status: 200, data: this._formatGuestResponse(event, user) };
        }
      
        const isAlreadyOrganizer = event.organizers.some(o => o.utorid === utorid);
        if (isAlreadyOrganizer) {
          return {
            status: 400,
            message: "User is already an organizer. Remove organizer role before adding as guest."
          };
        }
      
        const updated = await EventRepository.connectGuest(eventId, utorid);
      
        return { status: 201, data: this._formatGuestResponse(updated, user) };
      }

    async addSelfAsGuest(currentUser, eventId) {
        const event = await EventRepository.getEventbyId(eventId);
        if (!event || !event.published) {
          return { status: 404, message: "Event not found or not visible." };
        }
      
        const now = new Date();
        if (new Date(event.endTime) <= now) {
          return { status: 410, message: "Event has already ended." };
        }
      
        const isAlreadyGuest = event.guests.some(g => g.id === currentUser.id);
        if (isAlreadyGuest) {
          return { status: 400, message: "User is already on the guest list." };
        }
      
        const guestCount = event.guests.length;
        if (event.capacity !== null && guestCount >= event.capacity) {
          return { status: 410, message: "Event is full." };
        }
      
        const updated = await EventRepository.connectGuest(eventId, currentUser.utorid);
      
        return {
          status: 201,
          data: {
            id: updated.id,
            name: updated.name,
            location: updated.location,
            guestAdded: {
              id: currentUser.id,
              utorid: currentUser.utorid,
              name: currentUser.name
            },
            numGuests: guestCount + 1
          }
        };
      }

    async createEventTransaction(currentUser, eventId, payload) {
        const event = await EventRepository.getEventbyId(eventId);
        if (!event) return { status: 404, message: "Event not found." };
      
        const isManager = ["manager", "superuser"].includes(currentUser.role);
        const isOrganizer = event.organizers.some(o => o.id === currentUser.id);
      
        if (!isManager && !isOrganizer) {
          return { status: 403, message: "Not authorized to create event transactions." };
        }
      
        const { type, utorid, amount, remark } = payload;
      
        if (type !== "event" || !amount || amount <= 0 || !Number.isInteger(amount)) {
          return { status: 400, message: "Invalid payload." };
        }
      
        const remaining = event.pointsRemain;
        if (utorid) {
          // Single guest reward
          const user = await UserRepository.findUserbyUtorid(utorid);
          if (!user) return { status: 404, message: "User not found." };
      
          const isGuest = event.guests.some(g => g.utorid === utorid);
          if (!isGuest) {
            return { status: 400, message: "User is not a guest of the event." };
          }
      
          if (amount > remaining) {
            return { status: 400, message: "Not enough remaining points." };
          }
      
          const transaction = await TransactionRepository.createTransaction(currentUser.utorid,{
            utorid,
            type: "event",
            amount,
            remark: remark || "",
            relatedId: eventId
          });
      
          await EventRepository.updatePoints(eventId, event.pointsRemain - amount, event.pointsAwarded + amount);
      
          return {
            status: 201,
            data: {
              id: transaction.id,
              recipient: utorid,
              awarded: amount,
              type: "event",
              relatedId: eventId,
              remark: transaction.remark,
              createdBy: transaction.createdBy
            }
          };
        }
      
        // Award to all guests
        const guests = event.guests;
        const totalCost = guests.length * amount;
      
        if (totalCost > remaining) {
          return { status: 400, message: "Not enough remaining points to award all guests." };
        }
      
        const transactions = [];
      
        for (const guest of guests) {
          const tx = await TransactionRepository.createTransaction({
            utorid: guest.utorid,
            type: "event",
            amount,
            remark: remark || "",
            createdBy: currentUser.utorid,
            relatedId: eventId
          });
          transactions.push({
            id: tx.id,
            recipient: guest.utorid,
            awarded: amount,
            type: "event",
            relatedId: eventId,
            remark: tx.remark,
            createdBy: tx.createdBy
          });
        }
      
        await EventRepository.updatePoints(eventId, remaining - totalCost, event.pointsAwarded + totalCost);
      
        return {
          status: 201,
          data: transactions
        };
    }

    async getEvents(filters = {}, currentUser) {
        const where = {};
        const now = new Date();
      
        // Reject both started and ended together
        if (filters.started !== undefined && filters.ended !== undefined) {
          return { status: 400, message: "Cannot specify both 'started' and 'ended' together." };
        }
      
        // published filter (managers only)
        const isManager = ["manager", "superuser"].includes(currentUser.role);
        if (!isManager) {
          where.published = true;
        } else if (filters.published !== undefined) {
          where.published = filters.published === "true";
        }
      
        // name filter
        if (filters.name) {
          where.name = { contains: filters.name, mode: "insensitive" };
        }
      
        // location filter
        if (filters.location) {
          where.location = { contains: filters.location, mode: "insensitive" };
        }
      
        // started filter
        if (filters.started !== undefined) {
          where.startTime = filters.started === "true"
            ? { lte: now }
            : { gt: now };
        }
      
        // ended filter
        if (filters.ended !== undefined) {
          where.endTime = filters.ended === "true"
            ? { lte: now }
            : { gt: now };
        }
      
        // pagination
        const page = parseInt(filters.page, 10) || 1;
        const limit = parseInt(filters.limit, 10) || 10;
        const skip = (page - 1) * limit;
      
        const { count, results } = await EventRepository.findEventsWithGuestCounts(where, skip, limit);
      
        // showFull=false (default)
        const filtered = filters.showFull === "true"
          ? results
          : results.filter(e => e.capacity === null || e.numGuests < e.capacity);
      
        return {
          status: 200,
          data: {
            count: filtered.length,
            results: filtered.map(event => {
              const base = {
                id: event.id,
                name: event.name,
                location: event.location,
                startTime: event.startTime,
                endTime: event.endTime,
                capacity: event.capacity,
                numGuests: event.numGuests
              };
              if (isManager) {
                return {
                  ...base,
                  pointsRemain: event.pointsRemain,
                  pointsAwarded: event.pointsAwarded,
                  published: event.published
                };
              }
              return base;
            })
          }
        };
    }

    async getEventById(eventId, currentUser) {
        const event = await EventRepository.getEventbyId(eventId);
        if (!event || (!event.published && !this._isManagerOrOrganizer(event, currentUser))) {
          return { status: 404, message: "Event not found." };
        }
      
        const numGuests = event.guests.length;
        const base = {
          id: event.id,
          name: event.name,
          description: event.description,
          location: event.location,
          startTime: event.startTime,
          endTime: event.endTime,
          capacity: event.capacity,
          organizers: event.organizers.map(o => ({
            id: o.id,
            utorid: o.utorid,
            name: o.name
          })),
          numGuests
        };
      
        // Manager or organizer sees full data
        if (this._isManagerOrOrganizer(event, currentUser)) {
          return {
            status: 200,
            data: {
              ...base,
              pointsRemain: event.pointsRemain,
              pointsAwarded: event.pointsAwarded,
              published: event.published,
              guests: event.guests.map(g => ({
                id: g.id,
                utorid: g.utorid,
                name: g.name
              }))
            }
          };
        }
      
        // Regular users see limited fields
        return { status: 200, data: base };
    }
      

    async updateEvent(eventId, payload, currentUser) {
        const event = await EventRepository.getEventbyId(eventId);
        if (!event) return { status: 404, message: "Event not found." };

        const now = new Date();
        const isManager = ["manager", "superuser"].includes(currentUser.role);
        const isOrganizer = event.organizers.some(o => o.id === currentUser.id);

        if (!isManager && !isOrganizer) {
            return { status: 403, message: "Only managers or organizers can update events." };
        }

        const hasStarted = new Date(event.startTime) <= now;
        const hasEnded = new Date(event.endTime) <= now;

        // Cannot update start/end if they're in the past
        if (payload.startTime && new Date(payload.startTime) < now) {
            return { status: 400, message: "Start time cannot be in the past." };
        }

        if (payload.endTime && new Date(payload.endTime) < now) {
            return { status: 400, message: "End time cannot be in the past." };
        }

        if (payload.startTime && payload.endTime) {
            if (new Date(payload.endTime) <= new Date(payload.startTime)) {
            return { status: 400, message: "endTime must be after startTime." };
            }
        }

        // Cannot change fixed fields after start
        const blockedFields = ["name", "description", "location", "startTime", "capacity"];
        if (hasStarted && blockedFields.some(field => field in payload)) {
            return {
            status: 400,
            message: "Cannot update name, description, location, startTime, or capacity after event has started."
            };
        }

        if (hasEnded && "endTime" in payload) {
            return { status: 400, message: "Cannot update endTime after event has ended." };
        }

        // Validate capacity
        if ("capacity" in payload) {
            const guestCount = event.guests.length;
            if (payload.capacity !== null && payload.capacity < guestCount) {
            return { status: 400, message: "New capacity is less than number of confirmed guests." };
            }
        }

        // Validate points
        if ("points" in payload) {
            if (!isManager) {
            return { status: 403, message: "Only managers can update points." };
            }

            const newRemaining = payload.points - event.pointsAwarded;
            if (newRemaining < 0) {
            return {
                status: 400,
                message: "New point total is less than points already awarded."
            };
            }

            payload.pointsRemain = newRemaining;
    }



        // Validate published field
        if ("published" in payload) {
            if (!isManager) {
            return { status: 403, message: "Only managers can publish events." };
            }
            if (payload.published !== true) {
            return { status: 400, message: "Cannot unpublish an event once published." };
            }
        }

        const updated = await EventRepository.updateEvent(eventId, payload);

        const response = {
            id: updated.id,
            name: updated.name,
            location: updated.location,
            ...Object.fromEntries(
            Object.entries(payload).filter(([key]) =>
                ["description", "startTime", "endTime", "capacity", "pointsRemain", "published"].includes(key)
            )
            )
        };

        return { status: 200, data: response };
    }

    async deleteEvent(eventId, currentUser) {
        const isManager = ["manager", "superuser"].includes(currentUser.role);
        if (!isManager) {
          return { status: 403, message: "Only managers can delete events." };
        }
      
        const event = await EventRepository.getEventbyId(eventId);
        if (!event) return { status: 404, message: "Event not found." };
      
        if (event.published) {
          return { status: 400, message: "Cannot delete an event that is already published." };
        }
      
        await EventRepository.deleteEventById(eventId);
        return { status: 204 };
    }

    async removeOrganizer(eventId, userId, currentUser) {
        const isManager = ["manager", "superuser"].includes(currentUser.role);
        if (!isManager) {
          return { status: 403, message: "Only managers can remove organizers." };
        }
      
        const event = await EventRepository.getEventbyId(eventId);
        if (!event) return { status: 404, message: "Event not found." };
      
        const isOrganizer = event.organizers.some(o => o.id === userId);
        if (!isOrganizer) {
          return { status: 404, message: "User is not an organizer of this event." };
        }
      
        await EventRepository.disconnectOrganizer(eventId, userId);
        return { status: 204 };
    }

    async removeGuest(eventId, userId, currentUser) {
        const isManager = ["manager", "superuser"].includes(currentUser.role);
        if (!isManager) {
          return { status: 403, message: "Only managers can remove guests." };
        }
      
        const event = await EventRepository.getEventbyId(eventId);
        if (!event) return { status: 404, message: "Event not found." };
      
        const isGuest = event.guests.some(g => g.id === userId);
        if (!isGuest) {
          return { status: 404, message: "User is not a guest of this event." };
        }
      
        await EventRepository.disconnectGuest(eventId, userId);
        return { status: 204 };
    }

    async removeSelfAsGuest(eventId, currentUser) {
        const event = await EventRepository.getEventbyId(eventId);
        if (!event || !event.published) {
          return { status: 404, message: "Event not found." };
        }
      
        const now = new Date();
        if (new Date(event.endTime) <= now) {
          return { status: 410, message: "Event has already ended." };
        }
      
        const isGuest = event.guests.some(g => g.id === currentUser.id);
        if (!isGuest) {
          return { status: 404, message: "You are not on the guest list." };
        }
      
        await EventRepository.disconnectGuest(eventId, currentUser.id);
        return { status: 204 };
    }

    _isManagerOrOrganizer(event, user) {
        const isManager = ["manager", "superuser"].includes(user.role);
        const isOrganizer = event.organizers.some(o => o.id === user.id);
        return isManager || isOrganizer;
    }
     
    _formatGuestResponse(event, guest) {
        return {
          id: event.id,
          name: event.name,
          location: event.location,
          guestAdded: {
            id: guest.id,
            utorid: guest.utorid,
            name: guest.name
          },
          numGuests: event.guests.length + 1 // this assumes guest was not already counted in `.guests`
        };
    }

}

module.exports = new EventService();