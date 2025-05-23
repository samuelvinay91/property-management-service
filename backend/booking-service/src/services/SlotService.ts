import { Repository } from 'typeorm';
import { BookingSlot, SlotStatus, SlotType } from '../entities/BookingSlot';
import { AvailabilityTemplate } from '../entities/AvailabilityTemplate';
import { getRepository } from '../config/database';
import { Logger } from '../utils/logger';
import { addMinutes, startOfDay, endOfDay, eachDayOfInterval, format, parse } from 'date-fns';

const logger = new Logger('SlotService');

export class SlotService {
  private slotRepo: Repository<BookingSlot>;
  private templateRepo: Repository<AvailabilityTemplate>;

  constructor() {
    this.slotRepo = getRepository(BookingSlot);
    this.templateRepo = getRepository(AvailabilityTemplate);
  }

  async createSlot(data: any): Promise<BookingSlot> {
    try {
      const slot = this.slotRepo.create({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const savedSlot = await this.slotRepo.save(slot);
      logger.info('Slot created', { slotId: savedSlot.id });
      return savedSlot;
    } catch (error) {
      logger.error('Failed to create slot', { error: error.message });
      throw error;
    }
  }

  async getSlotById(id: string): Promise<BookingSlot | null> {
    try {
      return await this.slotRepo.findOne({
        where: { id },
        relations: ['bookings', 'template']
      });
    } catch (error) {
      logger.error('Failed to get slot', { error: error.message, id });
      throw error;
    }
  }

  async getSlots(filters?: any, limit: number = 100, offset: number = 0): Promise<BookingSlot[]> {
    try {
      const where: any = {};
      
      if (filters) {
        if (filters.status) where.status = filters.status;
        if (filters.type) where.type = filters.type;
        if (filters.resourceId) where.resourceId = filters.resourceId;
        if (filters.resourceType) where.resourceType = filters.resourceType;
        if (filters.propertyId) where.propertyId = filters.propertyId;
        if (filters.unitId) where.unitId = filters.unitId;
        if (filters.isBookable !== undefined) where.isBookable = filters.isBookable;
      }

      return await this.slotRepo.find({
        where,
        relations: ['bookings'],
        order: { startTime: 'ASC' },
        take: limit,
        skip: offset
      });
    } catch (error) {
      logger.error('Failed to get slots', { error: error.message, filters });
      throw error;
    }
  }

  async getAvailableSlots(query: any): Promise<BookingSlot[]> {
    try {
      const queryBuilder = this.slotRepo.createQueryBuilder('slot')
        .where('slot.startTime >= :dateFrom', { dateFrom: query.dateFrom })
        .andWhere('slot.endTime <= :dateTo', { dateTo: query.dateTo })
        .andWhere('slot.status = :status', { status: SlotStatus.AVAILABLE })
        .andWhere('slot.isBookable = :isBookable', { isBookable: true })
        .andWhere('slot.bookedCount < slot.capacity');

      if (query.resourceId) {
        queryBuilder.andWhere('slot.resourceId = :resourceId', { resourceId: query.resourceId });
      }

      if (query.resourceType) {
        queryBuilder.andWhere('slot.resourceType = :resourceType', { resourceType: query.resourceType });
      }

      if (query.propertyId) {
        queryBuilder.andWhere('slot.propertyId = :propertyId', { propertyId: query.propertyId });
      }

      if (query.unitId) {
        queryBuilder.andWhere('slot.unitId = :unitId', { unitId: query.unitId });
      }

      if (query.duration) {
        queryBuilder.andWhere('slot.duration >= :duration', { duration: query.duration });
      }

      if (query.bookingType) {
        queryBuilder.andWhere('slot.allowedBookingTypes IS NULL OR :bookingType = ANY(slot.allowedBookingTypes)', 
          { bookingType: query.bookingType });
      }

      return await queryBuilder
        .orderBy('slot.startTime', 'ASC')
        .getMany();
    } catch (error) {
      logger.error('Failed to get available slots', { error: error.message, query });
      throw error;
    }
  }

  async updateSlot(id: string, data: any): Promise<BookingSlot> {
    try {
      const slot = await this.slotRepo.findOne({ where: { id } });
      if (!slot) {
        throw new Error('Slot not found');
      }

      Object.assign(slot, data, { updatedAt: new Date() });
      const updatedSlot = await this.slotRepo.save(slot);
      
      logger.info('Slot updated', { slotId: id });
      return updatedSlot;
    } catch (error) {
      logger.error('Failed to update slot', { error: error.message, id });
      throw error;
    }
  }

  async blockSlot(id: string, reason: string, blockedBy: string): Promise<BookingSlot> {
    try {
      const slot = await this.slotRepo.findOne({ where: { id } });
      if (!slot) {
        throw new Error('Slot not found');
      }

      slot.status = SlotStatus.BLOCKED;
      slot.blockedReason = reason;
      slot.blockedBy = blockedBy;
      slot.blockedAt = new Date();
      slot.isBookable = false;
      slot.updatedAt = new Date();

      const updatedSlot = await this.slotRepo.save(slot);
      logger.info('Slot blocked', { slotId: id, reason, blockedBy });
      return updatedSlot;
    } catch (error) {
      logger.error('Failed to block slot', { error: error.message, id });
      throw error;
    }
  }

  async unblockSlot(id: string): Promise<BookingSlot> {
    try {
      const slot = await this.slotRepo.findOne({ where: { id } });
      if (!slot) {
        throw new Error('Slot not found');
      }

      slot.status = SlotStatus.AVAILABLE;
      slot.blockedReason = null;
      slot.blockedBy = null;
      slot.blockedAt = null;
      slot.isBookable = true;
      slot.updatedAt = new Date();

      const updatedSlot = await this.slotRepo.save(slot);
      logger.info('Slot unblocked', { slotId: id });
      return updatedSlot;
    } catch (error) {
      logger.error('Failed to unblock slot', { error: error.message, id });
      throw error;
    }
  }

  async deleteSlot(id: string): Promise<boolean> {
    try {
      const slot = await this.slotRepo.findOne({ 
        where: { id },
        relations: ['bookings']
      });
      
      if (!slot) {
        throw new Error('Slot not found');
      }

      if (slot.bookings && slot.bookings.length > 0) {
        throw new Error('Cannot delete slot with existing bookings');
      }

      await this.slotRepo.remove(slot);
      logger.info('Slot deleted', { slotId: id });
      return true;
    } catch (error) {
      logger.error('Failed to delete slot', { error: error.message, id });
      throw error;
    }
  }

  async generateSlotsFromTemplate(templateId: string, dateFrom: Date, dateTo: Date): Promise<BookingSlot[]> {
    try {
      const template = await this.templateRepo.findOne({ where: { id: templateId } });
      if (!template) {
        throw new Error('Template not found');
      }

      if (!template.isCurrentlyActive) {
        throw new Error('Template is not currently active');
      }

      const generatedSlots: BookingSlot[] = [];
      const days = eachDayOfInterval({ start: dateFrom, end: dateTo });

      for (const day of days) {
        const dayOfWeek = day.getDay(); // 0 = Sunday, 1 = Monday, etc.
        const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][dayOfWeek];
        
        const daySchedule = template.weeklySchedule?.[dayName];
        if (!daySchedule || !daySchedule.isAvailable) {
          continue;
        }

        // Check for holiday overrides
        const dateStr = format(day, 'yyyy-MM-dd');
        const holidayOverride = template.holidayOverrides?.find(h => h.date === dateStr);
        if (holidayOverride && !holidayOverride.isAvailable) {
          continue;
        }

        // Check for special dates
        const specialDate = template.specialDates?.find(s => s.date === dateStr);
        const timeSlots = specialDate?.timeSlots || holidayOverride?.timeSlots || daySchedule.timeSlots;

        if (!timeSlots || timeSlots.length === 0) {
          continue;
        }

        for (const timeSlot of timeSlots) {
          const slots = await this.generateSlotsForTimeSlot(day, timeSlot, template);
          generatedSlots.push(...slots);
        }
      }

      // Save all generated slots
      const savedSlots = await this.slotRepo.save(generatedSlots);
      logger.info('Slots generated from template', { 
        templateId, 
        dateFrom, 
        dateTo, 
        slotsCount: savedSlots.length 
      });
      
      return savedSlots;
    } catch (error) {
      logger.error('Failed to generate slots from template', { error: error.message, templateId });
      throw error;
    }
  }

  private async generateSlotsForTimeSlot(day: Date, timeSlot: any, template: AvailabilityTemplate): Promise<BookingSlot[]> {
    const slots: BookingSlot[] = [];
    
    const startTime = parse(timeSlot.startTime, 'HH:mm', day);
    const endTime = parse(timeSlot.endTime, 'HH:mm', day);
    const slotDuration = timeSlot.slotDuration || template.defaultSlotDuration;
    const breakDuration = timeSlot.breakDuration || template.defaultBreakDuration;

    let currentTime = startTime;
    
    while (currentTime < endTime) {
      const slotEndTime = addMinutes(currentTime, slotDuration);
      
      if (slotEndTime > endTime) {
        break;
      }

      const slot = this.slotRepo.create({
        startTime: currentTime,
        endTime: slotEndTime,
        duration: slotDuration,
        status: SlotStatus.AVAILABLE,
        type: SlotType.REGULAR,
        resourceId: template.resourceId,
        resourceType: template.resourceType,
        propertyId: template.propertyId,
        capacity: timeSlot.capacity || template.defaultCapacity,
        bookedCount: 0,
        isBookable: timeSlot.isBookable !== false,
        requiresApproval: template.requiresApproval,
        allowedBookingTypes: timeSlot.allowedBookingTypes || template.defaultBookingTypes,
        cost: timeSlot.cost || template.defaultCost,
        currency: template.defaultCurrency,
        templateId: template.id,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      slots.push(slot);
      
      // Move to next slot with break time
      currentTime = addMinutes(slotEndTime, breakDuration);
    }

    return slots;
  }

  async getSlotAvailability(query: any): Promise<any[]> {
    try {
      const slots = await this.getAvailableSlots(query);
      const availabilityPeriods: any[] = [];

      // Group slots by time periods
      const slotsByDate = new Map<string, BookingSlot[]>();
      
      for (const slot of slots) {
        const dateKey = format(slot.startTime, 'yyyy-MM-dd');
        if (!slotsByDate.has(dateKey)) {
          slotsByDate.set(dateKey, []);
        }
        slotsByDate.get(dateKey)!.push(slot);
      }

      // Create availability periods
      for (const [date, daySlots] of slotsByDate) {
        const sortedSlots = daySlots.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
        
        availabilityPeriods.push({
          startTime: sortedSlots[0].startTime,
          endTime: sortedSlots[sortedSlots.length - 1].endTime,
          isAvailable: true,
          slots: sortedSlots,
          capacity: sortedSlots.reduce((sum, slot) => sum + slot.capacity, 0),
          bookedCount: sortedSlots.reduce((sum, slot) => sum + slot.bookedCount, 0)
        });
      }

      return availabilityPeriods.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
    } catch (error) {
      logger.error('Failed to get slot availability', { error: error.message, query });
      throw error;
    }
  }

  async suggestBookingTimes(query: any, preferences?: any): Promise<any[]> {
    try {
      const availableSlots = await this.getAvailableSlots(query);
      const suggestions: any[] = [];

      for (const slot of availableSlots) {
        const score = this.calculateSuggestionScore(slot, preferences);
        
        suggestions.push({
          startTime: slot.startTime,
          endTime: slot.endTime,
          slot,
          score,
          reason: this.generateSuggestionReason(slot, score)
        });
      }

      // Sort by score (highest first) and return top suggestions
      return suggestions
        .sort((a, b) => b.score - a.score)
        .slice(0, preferences?.maxSuggestions || 10);
    } catch (error) {
      logger.error('Failed to suggest booking times', { error: error.message, query });
      throw error;
    }
  }

  private calculateSuggestionScore(slot: BookingSlot, preferences?: any): number {
    let score = 100; // Base score

    // Prefer slots with higher capacity
    if (slot.capacity > 1) {
      score += slot.capacity * 5;
    }

    // Prefer earlier time slots
    const hour = slot.startTime.getHours();
    if (hour >= 9 && hour <= 17) {
      score += 20; // Business hours bonus
    }

    // Apply preference-based scoring
    if (preferences) {
      if (preferences.preferredTimeRanges) {
        for (const range of preferences.preferredTimeRanges) {
          if (hour >= range.start && hour <= range.end) {
            score += 30;
          }
        }
      }

      if (preferences.avoidWeekends && (slot.startTime.getDay() === 0 || slot.startTime.getDay() === 6)) {
        score -= 20;
      }
    }

    // Penalize if slot is almost full
    if (slot.bookedCount / slot.capacity > 0.8) {
      score -= 15;
    }

    return Math.max(0, score);
  }

  private generateSuggestionReason(slot: BookingSlot, score: number): string {
    if (score >= 120) {
      return 'Highly recommended - optimal time and availability';
    } else if (score >= 100) {
      return 'Good option - available during business hours';
    } else if (score >= 80) {
      return 'Alternative option - still available';
    } else {
      return 'Limited availability';
    }
  }
}