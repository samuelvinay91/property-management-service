import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Payment, PaymentStatus, PaymentType } from '../entities/Payment';
import { PaymentMethod } from '../entities/PaymentMethod';
import { Subscription } from '../entities/Subscription';
import { Refund } from '../entities/Refund';
import { StripeService } from './StripeService';
import { NotificationService } from './NotificationService';

export interface CreatePaymentData {
  tenantId: string;
  propertyId: string;
  unitId?: string;
  leaseId?: string;
  type: PaymentType;
  amount: number;
  dueDate: Date;
  description?: string;
  paymentMethodId?: string;
  isRecurring?: boolean;
  frequency?: string;
}

export interface ProcessPaymentData {
  paymentId: string;
  paymentMethodId?: string;
  amount?: number;
}

export class PaymentService {
  private paymentRepository: Repository<Payment>;
  private paymentMethodRepository: Repository<PaymentMethod>;
  private subscriptionRepository: Repository<Subscription>;
  private refundRepository: Repository<Refund>;
  private stripeService: StripeService;
  private notificationService: NotificationService;

  constructor() {
    this.paymentRepository = AppDataSource.getRepository(Payment);
    this.paymentMethodRepository = AppDataSource.getRepository(PaymentMethod);
    this.subscriptionRepository = AppDataSource.getRepository(Subscription);
    this.refundRepository = AppDataSource.getRepository(Refund);
    this.stripeService = new StripeService();
    this.notificationService = new NotificationService();
  }

  async createPayment(data: CreatePaymentData): Promise<Payment> {
    const payment = this.paymentRepository.create({
      ...data,
      status: PaymentStatus.PENDING,
      paidAmount: 0,
      refundedAmount: 0,
      feeAmount: 0,
      lateFeeAmount: 0,
      currency: 'USD',
      isActive: true
    });

    const savedPayment = await this.paymentRepository.save(payment);

    if (data.isRecurring && data.paymentMethodId) {
      await this.createRecurringPayment(savedPayment, data.paymentMethodId);
    }

    await this.notificationService.sendPaymentCreatedNotification(savedPayment);

    return savedPayment;
  }

  async processPayment(data: ProcessPaymentData): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id: data.paymentId },
      relations: ['paymentMethod']
    });

    if (!payment) {
      throw new Error('Payment not found');
    }

    if (payment.status !== PaymentStatus.PENDING) {
      throw new Error('Payment is not in pending status');
    }

    const paymentMethodId = data.paymentMethodId || payment.paymentMethodId;
    if (!paymentMethodId) {
      throw new Error('No payment method specified');
    }

    const paymentMethod = await this.paymentMethodRepository.findOne({
      where: { id: paymentMethodId }
    });

    if (!paymentMethod) {
      throw new Error('Payment method not found');
    }

    try {
      payment.status = PaymentStatus.PROCESSING;
      await this.paymentRepository.save(payment);

      const amount = data.amount || payment.totalAmount;
      const stripeResult = await this.stripeService.processPayment({
        paymentMethodId: paymentMethod.stripePaymentMethodId!,
        amount: Math.round(amount * 100), // Convert to cents
        currency: payment.currency || 'USD',
        description: payment.description || `Payment for ${payment.type}`,
        metadata: {
          paymentId: payment.id,
          tenantId: payment.tenantId,
          propertyId: payment.propertyId
        }
      });

      payment.stripePaymentIntentId = stripeResult.paymentIntentId;
      payment.stripeChargeId = stripeResult.chargeId;
      payment.paidAmount = amount;
      payment.paidDate = new Date();
      payment.status = PaymentStatus.COMPLETED;
      payment.processorFee = stripeResult.processingFee;
      payment.netAmount = amount - stripeResult.processingFee;

      await this.paymentRepository.save(payment);
      await this.notificationService.sendPaymentSuccessNotification(payment);

      return payment;
    } catch (error) {
      payment.status = PaymentStatus.FAILED;
      payment.retryCount += 1;
      payment.lastRetryDate = new Date();
      
      if (payment.canRetry) {
        payment.nextRetryDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // Retry in 24 hours
      }

      await this.paymentRepository.save(payment);
      await this.notificationService.sendPaymentFailedNotification(payment, error.message);

      throw error;
    }
  }

  async createRefund(paymentId: string, amount: number, reason: string): Promise<Refund> {
    const payment = await this.paymentRepository.findOne({
      where: { id: paymentId }
    });

    if (!payment || payment.status !== PaymentStatus.COMPLETED) {
      throw new Error('Payment not found or not eligible for refund');
    }

    if (amount > payment.paidAmount - payment.refundedAmount) {
      throw new Error('Refund amount exceeds available amount');
    }

    const refund = this.refundRepository.create({
      paymentId,
      amount,
      currency: payment.currency || 'USD',
      reason: reason as any,
      status: 'PENDING' as any,
      initiatedBy: 'system' // Should be passed from context
    });

    try {
      const stripeRefund = await this.stripeService.createRefund({
        chargeId: payment.stripeChargeId!,
        amount: Math.round(amount * 100),
        reason: reason
      });

      refund.stripeRefundId = stripeRefund.id;
      refund.status = 'COMPLETED' as any;
      refund.processedAt = new Date();

      payment.refundedAmount += amount;
      if (payment.refundedAmount >= payment.paidAmount) {
        payment.status = PaymentStatus.REFUNDED;
      } else {
        payment.status = PaymentStatus.PARTIALLY_REFUNDED;
      }

      await this.paymentRepository.save(payment);
      const savedRefund = await this.refundRepository.save(refund);

      await this.notificationService.sendRefundNotification(payment, savedRefund);

      return savedRefund;
    } catch (error) {
      refund.status = 'FAILED' as any;
      refund.failureReason = error.message;
      await this.refundRepository.save(refund);
      throw error;
    }
  }

  async getPaymentsByTenant(tenantId: string, limit = 50, offset = 0): Promise<Payment[]> {
    return this.paymentRepository.find({
      where: { tenantId },
      relations: ['paymentMethod', 'refunds'],
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset
    });
  }

  async getPaymentsByProperty(propertyId: string, limit = 50, offset = 0): Promise<Payment[]> {
    return this.paymentRepository.find({
      where: { propertyId },
      relations: ['paymentMethod', 'refunds'],
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset
    });
  }

  async getOverduePayments(): Promise<Payment[]> {
    return this.paymentRepository
      .createQueryBuilder('payment')
      .where('payment.status = :status', { status: PaymentStatus.PENDING })
      .andWhere('payment.dueDate < :now', { now: new Date() })
      .orderBy('payment.dueDate', 'ASC')
      .getMany();
  }

  async calculateLateFees(): Promise<void> {
    const overduePayments = await this.getOverduePayments();

    for (const payment of overduePayments) {
      const daysPastDue = payment.daysPastDue;
      if (daysPastDue > 0 && payment.lateFeeAmount === 0) {
        // Calculate late fee (example: 5% of rent or $50, whichever is higher)
        const lateFeePercentage = 0.05;
        const minimumLateFee = 50;
        const calculatedFee = Math.max(payment.amount * lateFeePercentage, minimumLateFee);
        
        payment.lateFeeAmount = calculatedFee;
        await this.paymentRepository.save(payment);
        
        await this.notificationService.sendLateFeeNotification(payment);
      }
    }
  }

  private async createRecurringPayment(payment: Payment, paymentMethodId: string): Promise<Subscription> {
    const subscription = this.subscriptionRepository.create({
      tenantId: payment.tenantId,
      propertyId: payment.propertyId,
      landlordId: 'system', // Should be derived from property
      amount: payment.amount,
      currency: payment.currency || 'USD',
      startDate: payment.dueDate,
      nextBillingDate: this.calculateNextBillingDate(payment.dueDate, payment.frequency as any),
      paymentMethodId,
      billingInterval: payment.frequency as any,
      autoRenew: true
    });

    return this.subscriptionRepository.save(subscription);
  }

  async getPaymentById(id: string): Promise<Payment | null> {
    return this.paymentRepository.findOne({
      where: { id },
      relations: ['paymentMethod', 'subscription', 'refunds']
    });
  }

  async getAllPayments(limit = 50, offset = 0, status?: PaymentStatus): Promise<Payment[]> {
    const queryBuilder = this.paymentRepository
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.paymentMethod', 'paymentMethod')
      .leftJoinAndSelect('payment.refunds', 'refunds');

    if (status) {
      queryBuilder.where('payment.status = :status', { status });
    }

    return queryBuilder
      .orderBy('payment.createdAt', 'DESC')
      .take(limit)
      .skip(offset)
      .getMany();
  }

  async cancelPayment(id: string): Promise<Payment> {
    const payment = await this.getPaymentById(id);
    
    if (!payment) {
      throw new Error('Payment not found');
    }

    if (payment.status !== PaymentStatus.PENDING) {
      throw new Error('Only pending payments can be cancelled');
    }

    payment.status = PaymentStatus.CANCELLED;
    return this.paymentRepository.save(payment);
  }

  async retryPayment(id: string): Promise<Payment> {
    const payment = await this.getPaymentById(id);
    
    if (!payment) {
      throw new Error('Payment not found');
    }

    if (!payment.canRetry) {
      throw new Error('Payment cannot be retried');
    }

    return this.processPayment({ paymentId: id });
  }

  async getRefundById(id: string): Promise<Refund | null> {
    return this.refundRepository.findOne({
      where: { id },
      relations: ['payment']
    });
  }

  async getRefundsByPayment(paymentId: string): Promise<Refund[]> {
    return this.refundRepository.find({
      where: { paymentId },
      order: { createdAt: 'DESC' }
    });
  }

  private calculateNextBillingDate(startDate: Date, frequency: string): Date {
    const nextDate = new Date(startDate);
    
    switch (frequency) {
      case 'WEEKLY':
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case 'MONTHLY':
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case 'QUARTERLY':
        nextDate.setMonth(nextDate.getMonth() + 3);
        break;
      case 'ANNUALLY':
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        break;
      default:
        nextDate.setMonth(nextDate.getMonth() + 1);
    }
    
    return nextDate;
  }
}