const {PrismaClient} = require('@prisma/client');
const prisma = new PrismaClient();

class EventRepository {

    async getEventbyId(id){
        return prisma.event.findUnique({
            where: { id },
            select: {
              id: true,
              name: true,
              description: true,
              location: true,
              startTime: true,
              endTime: true,
              capacity: true,
              pointsRemain: true,
              pointsAwarded: true,
              published: true,
              organizers: {
                select: { id: true, utorid: true, name: true }
              },
              guests: {
                select: { id: true, utorid: true, name: true }
              }
            }
          });
    }

    async createEvent(data){
        return prisma.event.create({data})
    }

    async connectOrganizer(eventId, utorid) {
        return prisma.event.update({
          where: { id: eventId },
          data: {
            organizers: {
              connect: { utorid }
            }
          },
          select: {
            id: true,
            name: true,
            location: true,
            organizers: {
              select: {
                id: true,
                utorid: true,
                name: true
              }
            }
          }
        });
      }

      async connectGuest(eventId, utorid) {
        return prisma.event.update({
          where: { id: eventId },
          data: {
            guests: {
              connect: { utorid }
            }
          },
          select: {
            id: true,
            name: true,
            location: true,
            guests: {
              select: {
                utorid: true
              }
            }
          }
        });
      }

      async updatePoints(id, newRemain, newAwarded) {
        return prisma.event.update({
          where: { id },
          data: {
            pointsRemain: newRemain,
            pointsAwarded: newAwarded
          }
        });
      }

      async findEventsWithGuestCounts(where, skip, take) {
        const events = await prisma.event.findMany({
          where,
          skip,
          take,
          orderBy: { startTime: "asc" },
          select: {
            id: true,
            name: true,
            location: true,
            startTime: true,
            endTime: true,
            capacity: true,
            guests: { select: { id: true } }
          }
        });
      
        const results = events.map(e => ({
          ...e,
          numGuests: e.guests.length
        }));
      
        const count = results.length;
      
        return { count, results };
      }

      async updateEvent(eventId, data) {
        return prisma.event.update({
          where: { id: eventId },
          data,
          select: {
            id: true,
            name: true,
            location: true
          }
        });
      }

      async deleteEventById(eventId) {
        return prisma.event.delete({
          where: { id: eventId }
        });
      }

      async disconnectOrganizer(eventId, userId) {
        return prisma.event.update({
          where: { id: eventId },
          data: {
            organizers: {
              disconnect: { id: userId }
            }
          }
        });
      }
      
      async disconnectGuest(eventId, userId) {
        return prisma.event.update({
          where: { id: eventId },
          data: {
            guests: {
              disconnect: { id: userId }
            }
          }
        });
      }
      
}

module.exports = new EventRepository();