import { GraphQLScalarType } from 'graphql';
import { Kind } from 'graphql/language';

// Custom scalar types
const DateTimeScalar = new GraphQLScalarType({
  name: 'DateTime',
  description: 'DateTime custom scalar type',
  serialize(value: any) {
    return value instanceof Date ? value.toISOString() : value;
  },
  parseValue(value: any) {
    return new Date(value);
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) {
      return new Date(ast.value);
    }
    return null;
  },
});

const JSONScalar = new GraphQLScalarType({
  name: 'JSON',
  description: 'JSON custom scalar type',
  serialize(value: any) {
    return value;
  },
  parseValue(value: any) {
    return value;
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) {
      return JSON.parse(ast.value);
    }
    return null;
  },
});

export const resolvers = {
  DateTime: DateTimeScalar,
  JSON: JSONScalar,

  Query: {
    // Booking queries
    booking: async (_: any, { id }: any, { services }: any) => {
      return await services.bookingService.getBookingById(id);
    },

    bookings: async (_: any, { filters, limit, offset }: any, { services }: any) => {
      return await services.bookingService.getBookings(filters, limit, offset);
    },

    upcomingBookings: async (_: any, { userId, days }: any, { services }: any) => {
      return await services.bookingService.getUpcomingBookings(userId, days);
    },

    bookingsByProperty: async (_: any, { propertyId, filters }: any, { services }: any) => {
      return await services.bookingService.getBookings({ ...filters, propertyId });
    },

    bookingConflicts: async (_: any, { bookingInput }: any, { services }: any) => {
      return await services.bookingService.checkBookingConflicts(bookingInput);
    },

    // Slot queries
    slot: async (_: any, { id }: any, { services }: any) => {
      return await services.slotService.getSlotById(id);
    },

    slots: async (_: any, { filters, limit, offset }: any, { services }: any) => {
      return await services.slotService.getSlots(filters, limit, offset);
    },

    availableSlots: async (_: any, { query }: any, { services }: any) => {
      return await services.slotService.getAvailableSlots(query);
    },

    slotAvailability: async (_: any, { query }: any, { services }: any) => {
      return await services.slotService.getSlotAvailability(query);
    },

    // Template queries
    template: async (_: any, { id }: any, { services }: any) => {
      return await services.templateService.getTemplateById(id);
    },

    templates: async (_: any, { resourceId, resourceType, status }: any, { services }: any) => {
      return await services.templateService.getTemplates(resourceId, resourceType, status);
    },

    // Calendar queries (placeholder)
    calendar: async (_: any, { id }: any, { services }: any) => {
      return null; // Placeholder
    },

    calendars: async (_: any, args: any, { services }: any) => {
      return []; // Placeholder
    },

    // Participant queries
    participant: async (_: any, { id }: any, { services }: any) => {
      return await services.participantService.getParticipantById(id);
    },

    bookingParticipants: async (_: any, { bookingId }: any, { services }: any) => {
      return await services.participantService.getBookingParticipants(bookingId);
    },

    // Statistics
    bookingStats: async (_: any, { propertyIds, dateRange }: any, { services }: any) => {
      return await services.bookingService.getBookingStats(propertyIds, dateRange);
    },

    resourceUtilization: async (_: any, { resourceId, dateRange }: any, { services }: any) => {
      return {}; // Placeholder
    },

    // Suggestions
    suggestBookingTimes: async (_: any, { query, preferences }: any, { services }: any) => {
      return await services.slotService.suggestBookingTimes(query, preferences);
    },
  },

  Mutation: {
    // Booking mutations
    createBooking: async (_: any, { input }: any, { services }: any) => {
      return await services.bookingService.createBooking(input);
    },

    updateBooking: async (_: any, { id, input }: any, { services }: any) => {
      return await services.bookingService.updateBooking(id, input);
    },

    confirmBooking: async (_: any, { id, confirmedBy }: any, { services }: any) => {
      return await services.bookingService.confirmBooking(id, confirmedBy);
    },

    cancelBooking: async (_: any, { id, reason, cancelledBy }: any, { services }: any) => {
      return await services.bookingService.cancelBooking(id, reason, cancelledBy);
    },

    rescheduleBooking: async (_: any, { id, newStartTime, newEndTime, reason, rescheduledBy }: any, { services }: any) => {
      return await services.bookingService.rescheduleBooking(id, newStartTime, newEndTime, reason, rescheduledBy);
    },

    completeBooking: async (_: any, { id, completionNotes, rating, feedback }: any, { services }: any) => {
      return await services.bookingService.completeBooking(id, completionNotes, rating, feedback);
    },

    checkInParticipant: async (_: any, { bookingId, participantId }: any, { services }: any) => {
      return await services.participantService.checkInParticipant(bookingId, participantId);
    },

    checkOutParticipant: async (_: any, { bookingId, participantId }: any, { services }: any) => {
      return await services.participantService.checkOutParticipant(bookingId, participantId);
    },

    // Bulk operations
    bulkUpdateBookings: async (_: any, { ids, updates }: any, { services }: any) => {
      const results = [];
      for (const id of ids) {
        try {
          const updated = await services.bookingService.updateBooking(id, updates);
          results.push(updated);
        } catch (error) {
          // Continue with other bookings
        }
      }
      return results;
    },

    bulkCancelBookings: async (_: any, { ids, reason, cancelledBy }: any, { services }: any) => {
      const results = [];
      for (const id of ids) {
        try {
          const cancelled = await services.bookingService.cancelBooking(id, reason, cancelledBy);
          results.push(cancelled);
        } catch (error) {
          // Continue with other bookings
        }
      }
      return results;
    },

    // Slot mutations
    createSlot: async (_: any, { input }: any, { services }: any) => {
      return await services.slotService.createSlot(input);
    },

    updateSlot: async (_: any, { id, input }: any, { services }: any) => {
      return await services.slotService.updateSlot(id, input);
    },

    blockSlot: async (_: any, { id, reason, blockedBy }: any, { services }: any) => {
      return await services.slotService.blockSlot(id, reason, blockedBy);
    },

    unblockSlot: async (_: any, { id }: any, { services }: any) => {
      return await services.slotService.unblockSlot(id);
    },

    deleteSlot: async (_: any, { id }: any, { services }: any) => {
      return await services.slotService.deleteSlot(id);
    },

    // Generate slots from template
    generateSlotsFromTemplate: async (_: any, { templateId, dateFrom, dateTo }: any, { services }: any) => {
      return await services.slotService.generateSlotsFromTemplate(templateId, dateFrom, dateTo);
    },

    // Template mutations
    createTemplate: async (_: any, { input }: any, { services }: any) => {
      return await services.templateService.createTemplate(input);
    },

    updateTemplate: async (_: any, { id, input }: any, { services }: any) => {
      return await services.templateService.updateTemplate(id, input);
    },

    activateTemplate: async (_: any, { id }: any, { services }: any) => {
      return await services.templateService.activateTemplate(id);
    },

    deactivateTemplate: async (_: any, { id }: any, { services }: any) => {
      return await services.templateService.deactivateTemplate(id);
    },

    deleteTemplate: async (_: any, { id }: any, { services }: any) => {
      return await services.templateService.deleteTemplate(id);
    },

    // Participant mutations
    addParticipant: async (_: any, { bookingId, input }: any, { services }: any) => {
      return await services.participantService.addParticipant(bookingId, input);
    },

    updateParticipant: async (_: any, { id, input }: any, { services }: any) => {
      return await services.participantService.updateParticipant(id, input);
    },

    removeParticipant: async (_: any, { id }: any, { services }: any) => {
      return await services.participantService.removeParticipant(id);
    },

    respondToInvitation: async (_: any, { id, status, responseMessage }: any, { services }: any) => {
      return await services.participantService.respondToInvitation(id, status, responseMessage);
    },

    // Calendar integration (placeholders)
    syncWithExternalCalendar: async (_: any, { calendarId }: any, { services }: any) => {
      return null; // Placeholder
    },

    exportBookingToCalendar: async (_: any, { bookingId, calendarId }: any, { services }: any) => {
      return 'calendar-event-id'; // Placeholder
    },
  },

  Subscription: {
    bookingUpdated: {
      subscribe: () => {
        return {
          [Symbol.asyncIterator]: async function* () {
            yield { bookingUpdated: null };
          }
        };
      },
    },

    slotAvailabilityChanged: {
      subscribe: () => {
        return {
          [Symbol.asyncIterator]: async function* () {
            yield { slotAvailabilityChanged: null };
          }
        };
      },
    },

    newBookingRequest: {
      subscribe: () => {
        return {
          [Symbol.asyncIterator]: async function* () {
            yield { newBookingRequest: null };
          }
        };
      },
    },
  },

  // Type resolvers for relationships
  Booking: {
    slot: async (parent: any, _: any, { services }: any) => {
      if (parent.slotId) {
        return await services.slotService.getSlotById(parent.slotId);
      }
      return null;
    },

    participants: async (parent: any, _: any, { services }: any) => {
      return await services.participantService.getBookingParticipants(parent.id);
    },

    recurringInstances: async (parent: any, _: any, { services }: any) => {
      if (parent.isRecurring) {
        return await services.bookingService.getBookings({ parentBookingId: parent.id });
      }
      return [];
    },
  },

  BookingSlot: {
    bookings: async (parent: any, _: any, { services }: any) => {
      return await services.bookingService.getBookings({ slotId: parent.id });
    },

    template: async (parent: any, _: any, { services }: any) => {
      if (parent.templateId) {
        return await services.templateService.getTemplateById(parent.templateId);
      }
      return null;
    },

    recurringInstances: async (parent: any, _: any, { services }: any) => {
      if (parent.isRecurring) {
        return await services.slotService.getSlots({ parentSlotId: parent.id });
      }
      return [];
    },
  },

  AvailabilityTemplate: {
    slots: async (parent: any, _: any, { services }: any) => {
      return await services.slotService.getSlots({ templateId: parent.id });
    },
  },

  Participant: {
    booking: async (parent: any, _: any, { services }: any) => {
      return await services.bookingService.getBookingById(parent.bookingId);
    },
  },

  Calendar: {
    slots: async (parent: any, _: any, { services }: any) => {
      return await services.slotService.getSlots({ resourceId: parent.resourceId });
    },
  },
};