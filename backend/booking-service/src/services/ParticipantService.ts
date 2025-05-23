import { Repository } from 'typeorm';
import { Participant, ParticipantStatus } from '../entities/Participant';
import { Booking } from '../entities/Booking';
import { getRepository } from '../config/database';
import { Logger } from '../utils/logger';

const logger = new Logger('ParticipantService');

export class ParticipantService {
  private participantRepo: Repository<Participant>;
  private bookingRepo: Repository<Booking>;

  constructor() {
    this.participantRepo = getRepository(Participant);
    this.bookingRepo = getRepository(Booking);
  }

  async addParticipant(bookingId: string, data: any): Promise<Participant> {
    try {
      const booking = await this.bookingRepo.findOne({ where: { id: bookingId } });
      if (!booking) {
        throw new Error('Booking not found');
      }

      const participant = this.participantRepo.create({
        ...data,
        bookingId,
        status: ParticipantStatus.INVITED,
        invitedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const savedParticipant = await this.participantRepo.save(participant);
      logger.info('Participant added', { participantId: savedParticipant.id, bookingId });
      return savedParticipant;
    } catch (error) {
      logger.error('Failed to add participant', { error: error.message, bookingId });
      throw error;
    }
  }

  async getParticipantById(id: string): Promise<Participant | null> {
    try {
      return await this.participantRepo.findOne({
        where: { id },
        relations: ['booking']
      });
    } catch (error) {
      logger.error('Failed to get participant', { error: error.message, id });
      throw error;
    }
  }

  async getBookingParticipants(bookingId: string): Promise<Participant[]> {
    try {
      return await this.participantRepo.find({
        where: { bookingId },
        order: { createdAt: 'ASC' }
      });
    } catch (error) {
      logger.error('Failed to get booking participants', { error: error.message, bookingId });
      throw error;
    }
  }

  async updateParticipant(id: string, data: any): Promise<Participant> {
    try {
      const participant = await this.participantRepo.findOne({ where: { id } });
      if (!participant) {
        throw new Error('Participant not found');
      }

      // Track status changes
      if (data.status && data.status !== participant.status) {
        data.respondedAt = new Date();
      }

      Object.assign(participant, data, { updatedAt: new Date() });
      const updatedParticipant = await this.participantRepo.save(participant);
      
      logger.info('Participant updated', { participantId: id });
      return updatedParticipant;
    } catch (error) {
      logger.error('Failed to update participant', { error: error.message, id });
      throw error;
    }
  }

  async removeParticipant(id: string): Promise<boolean> {
    try {
      const participant = await this.participantRepo.findOne({ where: { id } });
      if (!participant) {
        throw new Error('Participant not found');
      }

      await this.participantRepo.remove(participant);
      logger.info('Participant removed', { participantId: id });
      return true;
    } catch (error) {
      logger.error('Failed to remove participant', { error: error.message, id });
      throw error;
    }
  }

  async respondToInvitation(id: string, status: ParticipantStatus, responseMessage?: string): Promise<Participant> {
    try {
      const participant = await this.participantRepo.findOne({ where: { id } });
      if (!participant) {
        throw new Error('Participant not found');
      }

      participant.status = status;
      participant.responseMessage = responseMessage;
      participant.respondedAt = new Date();
      participant.updatedAt = new Date();

      const updatedParticipant = await this.participantRepo.save(participant);
      logger.info('Participant responded to invitation', { participantId: id, status });
      return updatedParticipant;
    } catch (error) {
      logger.error('Failed to respond to invitation', { error: error.message, id });
      throw error;
    }
  }

  async checkInParticipant(bookingId: string, participantId: string): Promise<Participant> {
    try {
      const participant = await this.participantRepo.findOne({ 
        where: { id: participantId, bookingId } 
      });
      
      if (!participant) {
        throw new Error('Participant not found');
      }

      participant.status = ParticipantStatus.ATTENDED;
      participant.checkedInAt = new Date();
      participant.updatedAt = new Date();

      const updatedParticipant = await this.participantRepo.save(participant);
      logger.info('Participant checked in', { participantId, bookingId });
      return updatedParticipant;
    } catch (error) {
      logger.error('Failed to check in participant', { error: error.message, participantId, bookingId });
      throw error;
    }
  }

  async checkOutParticipant(bookingId: string, participantId: string): Promise<Participant> {
    try {
      const participant = await this.participantRepo.findOne({ 
        where: { id: participantId, bookingId } 
      });
      
      if (!participant) {
        throw new Error('Participant not found');
      }

      participant.checkedOutAt = new Date();
      participant.updatedAt = new Date();

      const updatedParticipant = await this.participantRepo.save(participant);
      logger.info('Participant checked out', { participantId, bookingId });
      return updatedParticipant;
    } catch (error) {
      logger.error('Failed to check out participant', { error: error.message, participantId, bookingId });
      throw error;
    }
  }
}