import { Repository } from 'typeorm';
import { Booking, BookingStatus, BookingType, BookingPriority } from '../entities/Booking';
import { BookingSlot, SlotStatus } from '../entities/BookingSlot';
import { Participant, ParticipantStatus } from '../entities/Participant';
import { getRepository, runInTransaction } from '../config/database';
import { Logger } from '../utils/logger';
import { addHours, isBefore, isAfter } from 'date-fns';

const logger = new Logger('BookingService');

export class BookingService {
  private bookingRepo: Repository<Booking>;
  private slotRepo: Repository<BookingSlot>;
  private participantRepo: Repository<Participant>;

  constructor() {
    this.bookingRepo = getRepository(Booking);
    this.slotRepo = getRepository(BookingSlot);
    this.participantRepo = getRepository(Participant);
  }

  async createBooking(data: any): Promise<Booking> {
    try {
      return await runInTransaction(async (manager) => {
        // Validate booking time
        await this.validateBookingTime(data.startTime, data.endTime, data.propertyId);

        // Check for conflicts
        const conflicts = await this.checkBookingConflicts(data);
        if (conflicts.length > 0) {
          throw new Error(`Booking conflicts detected: ${conflicts.map(c => c.message).join(', ')}`);
        }

        // Create booking
        const booking = this.bookingRepo.create({
          ...data,
          status: data.requiresConfirmation ? BookingStatus.PENDING : BookingStatus.CONFIRMED,
          duration: this.calculateDuration(data.startTime, data.endTime),
          createdAt: new Date(),
          updatedAt: new Date()
        });

        const savedBooking = await manager.save(booking);

        // Add participants if provided
        if (data.participants && data.participants.length > 0) {
          const participants = data.participants.map((p: any) => 
            this.participantRepo.create({
              ...p,
              bookingId: savedBooking.id,
              status: ParticipantStatus.INVITED,
              createdAt: new Date(),
              updatedAt: new Date()
            })
          );
          await manager.save(participants);
        }

        // Reserve slot if specified
        if (data.slotId) {
          const slot = await manager.findOne(BookingSlot, { where: { id: data.slotId } });
          if (slot) {
            slot.bookedCount += 1;
            if (slot.bookedCount >= slot.capacity) {
              slot.status = SlotStatus.BOOKED;
            }
            await manager.save(slot);
          }
        }

        logger.info('Booking created successfully', { bookingId: savedBooking.id });
        return savedBooking;
      });
    } catch (error) {
      logger.error('Failed to create booking', { error: error.message, data });
      throw error;
    }
  }

  async getBookingById(id: string): Promise<Booking | null> {
    try {
      return await this.bookingRepo.findOne({
        where: { id },
        relations: ['participants', 'slot']
      });
    } catch (error) {
      logger.error('Failed to get booking', { error: error.message, id });
      throw error;
    }
  }

  async getBookings(filters?: any, limit: number = 50, offset: number = 0): Promise<Booking[]> {
    try {
      const where: any = {};
      
      if (filters) {
        if (filters.type) where.type = filters.type;
        if (filters.status) where.status = filters.status;
        if (filters.priority) where.priority = filters.priority;
        if (filters.propertyId) where.propertyId = filters.propertyId;
        if (filters.unitId) where.unitId = filters.unitId;
        if (filters.requestedBy) where.requestedBy = filters.requestedBy;
        if (filters.assignedTo) where.assignedTo = filters.assignedTo;
        if (filters.isRecurring !== undefined) where.isRecurring = filters.isRecurring;
      }

      return await this.bookingRepo.find({
        where,
        relations: ['participants', 'slot'],
        order: { startTime: 'ASC' },
        take: limit,
        skip: offset
      });
    } catch (error) {
      logger.error('Failed to get bookings', { error: error.message, filters });
      throw error;
    }
  }

  async updateBooking(id: string, data: any): Promise<Booking> {
    try {
      const booking = await this.bookingRepo.findOne({ where: { id } });
      if (!booking) {
        throw new Error('Booking not found');
      }

      // Validate time changes
      if (data.startTime || data.endTime) {
        const startTime = data.startTime || booking.startTime;
        const endTime = data.endTime || booking.endTime;
        await this.validateBookingTime(startTime, endTime, booking.propertyId, id);
        
        if (data.startTime || data.endTime) {
          data.duration = this.calculateDuration(startTime, endTime);
        }
      }

      Object.assign(booking, data, { updatedAt: new Date() });
      const updatedBooking = await this.bookingRepo.save(booking);
      
      logger.info('Booking updated', { bookingId: id });
      return updatedBooking;
    } catch (error) {
      logger.error('Failed to update booking', { error: error.message, id });
      throw error;
    }
  }

  async confirmBooking(id: string, confirmedBy: string): Promise<Booking> {
    try {
      const booking = await this.bookingRepo.findOne({ where: { id } });
      if (!booking) {
        throw new Error('Booking not found');
      }

      booking.status = BookingStatus.CONFIRMED;
      booking.confirmedAt = new Date();
      booking.confirmedBy = confirmedBy;
      booking.updatedAt = new Date();

      const updatedBooking = await this.bookingRepo.save(booking);
      logger.info('Booking confirmed', { bookingId: id, confirmedBy });
      return updatedBooking;
    } catch (error) {
      logger.error('Failed to confirm booking', { error: error.message, id });
      throw error;
    }
  }

  async cancelBooking(id: string, reason: string, cancelledBy: string): Promise<Booking> {
    try {
      return await runInTransaction(async (manager) => {
        const booking = await manager.findOne(Booking, { where: { id } });
        if (!booking) {
          throw new Error('Booking not found');
        }

        booking.status = BookingStatus.CANCELLED;
        booking.cancellationReason = reason;
        booking.cancelledAt = new Date();
        booking.cancelledBy = cancelledBy;
        booking.updatedAt = new Date();

        const updatedBooking = await manager.save(booking);

        // Free up slot if reserved
        if (booking.slotId) {
          const slot = await manager.findOne(BookingSlot, { where: { id: booking.slotId } });
          if (slot && slot.bookedCount > 0) {
            slot.bookedCount -= 1;
            if (slot.status === SlotStatus.BOOKED && slot.bookedCount < slot.capacity) {
              slot.status = SlotStatus.AVAILABLE;
            }
            await manager.save(slot);
          }
        }

        logger.info('Booking cancelled', { bookingId: id, reason, cancelledBy });
        return updatedBooking;
      });
    } catch (error) {
      logger.error('Failed to cancel booking', { error: error.message, id });
      throw error;
    }
  }

  async rescheduleBooking(id: string, newStartTime: Date, newEndTime: Date, reason: string, rescheduledBy: string): Promise<Booking> {
    try {
      const booking = await this.bookingRepo.findOne({ where: { id } });
      if (!booking) {
        throw new Error('Booking not found');
      }

      if (!booking.allowRescheduling) {
        throw new Error('This booking does not allow rescheduling');
      }

      // Validate new time
      await this.validateBookingTime(newStartTime, newEndTime, booking.propertyId, id);

      // Check for conflicts at new time
      const conflicts = await this.checkBookingConflicts({
        ...booking,
        startTime: newStartTime,
        endTime: newEndTime
      }, id);

      if (conflicts.length > 0) {
        throw new Error(`Rescheduling conflicts detected: ${conflicts.map(c => c.message).join(', ')}`);
      }

      booking.startTime = newStartTime;
      booking.endTime = newEndTime;
      booking.duration = this.calculateDuration(newStartTime, newEndTime);
      booking.status = BookingStatus.RESCHEDULED;
      booking.updatedAt = new Date();

      const updatedBooking = await this.bookingRepo.save(booking);
      logger.info('Booking rescheduled', { bookingId: id, newStartTime, newEndTime, rescheduledBy });
      return updatedBooking;
    } catch (error) {
      logger.error('Failed to reschedule booking', { error: error.message, id });
      throw error;
    }
  }

  async completeBooking(id: string, completionNotes?: string, rating?: number, feedback?: string): Promise<Booking> {
    try {
      const booking = await this.bookingRepo.findOne({ where: { id } });
      if (!booking) {
        throw new Error('Booking not found');
      }

      booking.status = BookingStatus.COMPLETED;
      booking.completedAt = new Date();
      booking.completionNotes = completionNotes;
      booking.rating = rating;
      booking.feedback = feedback;
      booking.updatedAt = new Date();

      const updatedBooking = await this.bookingRepo.save(booking);
      logger.info('Booking completed', { bookingId: id, rating });
      return updatedBooking;
    } catch (error) {
      logger.error('Failed to complete booking', { error: error.message, id });
      throw error;
    }
  }

  async getUpcomingBookings(userId?: string, days: number = 7): Promise<Booking[]> {
    try {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + days);

      const where: any = {
        startTime: {
          gte: startDate,
          lte: endDate
        },
        status: BookingStatus.CONFIRMED
      };

      if (userId) {
        // This would need to be expanded based on user role
        where.requestedBy = userId;
      }

      return await this.bookingRepo.find({
        where,
        relations: ['participants', 'slot'],
        order: { startTime: 'ASC' }
      });
    } catch (error) {
      logger.error('Failed to get upcoming bookings', { error: error.message, userId });
      throw error;
    }
  }

  async checkBookingConflicts(bookingData: any, excludeBookingId?: string): Promise<any[]> {
    try {
      const conflicts: any[] = [];

      // Check for time conflicts with existing bookings
      const conflictingBookings = await this.bookingRepo
        .createQueryBuilder('booking')
        .where('booking.propertyId = :propertyId', { propertyId: bookingData.propertyId })
        .andWhere('booking.status IN (:...statuses)', { 
          statuses: [BookingStatus.CONFIRMED, BookingStatus.PENDING] 
        })
        .andWhere('booking.startTime < :endTime', { endTime: bookingData.endTime })
        .andWhere('booking.endTime > :startTime', { startTime: bookingData.startTime })
        .andWhere(excludeBookingId ? 'booking.id != :excludeId' : '1=1', 
          excludeBookingId ? { excludeId: excludeBookingId } : {})
        .getMany();

      for (const conflictingBooking of conflictingBookings) {
        conflicts.push({
          conflictType: 'TIME_OVERLAP',
          conflictingBooking,
          message: `Time conflict with existing booking: ${conflictingBooking.title}`,
          suggestions: []
        });
      }

      // Check if assigned resource is available
      if (bookingData.assignedTo) {
        const resourceConflicts = await this.bookingRepo
          .createQueryBuilder('booking')
          .where('booking.assignedTo = :assignedTo', { assignedTo: bookingData.assignedTo })
          .andWhere('booking.status IN (:...statuses)', { 
            statuses: [BookingStatus.CONFIRMED, BookingStatus.PENDING] 
          })
          .andWhere('booking.startTime < :endTime', { endTime: bookingData.endTime })
          .andWhere('booking.endTime > :startTime', { startTime: bookingData.startTime })
          .andWhere(excludeBookingId ? 'booking.id != :excludeId' : '1=1', 
            excludeBookingId ? { excludeId: excludeBookingId } : {})
          .getMany();

        for (const resourceConflict of resourceConflicts) {
          conflicts.push({
            conflictType: 'RESOURCE_UNAVAILABLE',
            conflictingBooking: resourceConflict,
            message: `Assigned resource is not available during this time`,
            suggestions: []
          });
        }
      }

      return conflicts;
    } catch (error) {
      logger.error('Failed to check booking conflicts', { error: error.message });
      throw error;
    }
  }

  private async validateBookingTime(startTime: Date, endTime: Date, propertyId: string, excludeBookingId?: string): Promise<void> {
    if (isBefore(endTime, startTime)) {
      throw new Error('End time must be after start time');
    }

    if (isBefore(startTime, new Date())) {
      throw new Error('Cannot book in the past');
    }

    const duration = this.calculateDuration(startTime, endTime);
    if (duration < 15) {
      throw new Error('Minimum booking duration is 15 minutes');
    }

    if (duration > 24 * 60) {
      throw new Error('Maximum booking duration is 24 hours');
    }
  }

  private calculateDuration(startTime: Date, endTime: Date): number {
    return Math.floor((endTime.getTime() - startTime.getTime()) / (1000 * 60));
  }

  async getBookingStats(propertyIds?: string[], dateRange?: any): Promise<any> {
    try {
      const query = this.bookingRepo.createQueryBuilder('booking');
      
      if (propertyIds && propertyIds.length > 0) {
        query.andWhere('booking.propertyId IN (:...propertyIds)', { propertyIds });
      }

      if (dateRange) {
        if (dateRange.startDate) {
          query.andWhere('booking.startTime >= :startDate', { startDate: dateRange.startDate });
        }
        if (dateRange.endDate) {
          query.andWhere('booking.startTime <= :endDate', { endDate: dateRange.endDate });
        }
      }

      const totalBookings = await query.getCount();
      const confirmedBookings = await query.clone().andWhere('booking.status = :status', { status: BookingStatus.CONFIRMED }).getCount();
      const pendingBookings = await query.clone().andWhere('booking.status = :status', { status: BookingStatus.PENDING }).getCount();
      const cancelledBookings = await query.clone().andWhere('booking.status = :status', { status: BookingStatus.CANCELLED }).getCount();
      const completedBookings = await query.clone().andWhere('booking.status = :status', { status: BookingStatus.COMPLETED }).getCount();
      const noShowBookings = await query.clone().andWhere('booking.status = :status', { status: BookingStatus.NO_SHOW }).getCount();

      return {
        totalBookings,
        confirmedBookings,
        pendingBookings,
        cancelledBookings,
        completedBookings,
        noShowBookings,
        averageRating: 0,
        bookingsByType: [],
        bookingsByStatus: [],
        monthlyTrend: [],
        popularTimeSlots: [],
        averageDuration: 0,
        cancellationRate: totalBookings > 0 ? (cancelledBookings / totalBookings) * 100 : 0,
        noShowRate: totalBookings > 0 ? (noShowBookings / totalBookings) * 100 : 0
      };
    } catch (error) {
      logger.error('Failed to get booking stats', { error: error.message });
      throw error;
    }
  }
}