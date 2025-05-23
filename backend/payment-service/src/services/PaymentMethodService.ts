import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { PaymentMethod, PaymentMethodType, PaymentMethodStatus } from '../entities/PaymentMethod';
import { StripeService } from './StripeService';

export interface CreatePaymentMethodData {
  userId: string;
  type: PaymentMethodType;
  nickname: string;
  stripePaymentMethodId?: string;
  isDefault?: boolean;
}

export interface UpdatePaymentMethodData {
  nickname?: string;
  isDefault?: boolean;
}

export class PaymentMethodService {
  private paymentMethodRepository: Repository<PaymentMethod>;
  private stripeService: StripeService;

  constructor() {
    this.paymentMethodRepository = AppDataSource.getRepository(PaymentMethod);
    this.stripeService = new StripeService();
  }

  async createPaymentMethod(data: CreatePaymentMethodData): Promise<PaymentMethod> {
    // If setting as default, unset other default payment methods
    if (data.isDefault) {
      await this.paymentMethodRepository.update(
        { userId: data.userId, isDefault: true },
        { isDefault: false }
      );
    }

    const paymentMethod = this.paymentMethodRepository.create({
      ...data,
      status: PaymentMethodStatus.ACTIVE,
      isVerified: false,
      isDefault: data.isDefault || false
    });

    return this.paymentMethodRepository.save(paymentMethod);
  }

  async getPaymentMethodById(id: string): Promise<PaymentMethod | null> {
    return this.paymentMethodRepository.findOne({
      where: { id }
    });
  }

  async getPaymentMethodsByUser(userId: string): Promise<PaymentMethod[]> {
    return this.paymentMethodRepository.find({
      where: { userId, status: PaymentMethodStatus.ACTIVE },
      order: { isDefault: 'DESC', createdAt: 'DESC' }
    });
  }

  async updatePaymentMethod(id: string, data: UpdatePaymentMethodData): Promise<PaymentMethod> {
    const paymentMethod = await this.paymentMethodRepository.findOne({
      where: { id }
    });

    if (!paymentMethod) {
      throw new Error('Payment method not found');
    }

    // If setting as default, unset other default payment methods
    if (data.isDefault && !paymentMethod.isDefault) {
      await this.paymentMethodRepository.update(
        { userId: paymentMethod.userId, isDefault: true },
        { isDefault: false }
      );
    }

    Object.assign(paymentMethod, data);
    return this.paymentMethodRepository.save(paymentMethod);
  }

  async deletePaymentMethod(id: string): Promise<boolean> {
    const paymentMethod = await this.paymentMethodRepository.findOne({
      where: { id }
    });

    if (!paymentMethod) {
      throw new Error('Payment method not found');
    }

    // Check if payment method is being used by active payments/subscriptions
    // This would require additional validation logic

    paymentMethod.status = PaymentMethodStatus.INACTIVE;
    await this.paymentMethodRepository.save(paymentMethod);

    return true;
  }

  async verifyPaymentMethod(id: string): Promise<PaymentMethod> {
    const paymentMethod = await this.paymentMethodRepository.findOne({
      where: { id }
    });

    if (!paymentMethod) {
      throw new Error('Payment method not found');
    }

    // Implement Stripe verification logic here
    paymentMethod.isVerified = true;
    return this.paymentMethodRepository.save(paymentMethod);
  }
}