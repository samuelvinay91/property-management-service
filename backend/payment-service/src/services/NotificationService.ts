import { Payment } from '../entities/Payment';
import { Refund } from '../entities/Refund';

export class NotificationService {
  async sendPaymentCreatedNotification(payment: Payment): Promise<void> {
    // Implementation would integrate with notification service
    console.log(`Payment created notification sent for payment ${payment.id}`);
  }

  async sendPaymentSuccessNotification(payment: Payment): Promise<void> {
    // Implementation would integrate with notification service
    console.log(`Payment success notification sent for payment ${payment.id}`);
  }

  async sendPaymentFailedNotification(payment: Payment, reason: string): Promise<void> {
    // Implementation would integrate with notification service
    console.log(`Payment failed notification sent for payment ${payment.id}: ${reason}`);
  }

  async sendLateFeeNotification(payment: Payment): Promise<void> {
    // Implementation would integrate with notification service
    console.log(`Late fee notification sent for payment ${payment.id}`);
  }

  async sendRefundNotification(payment: Payment, refund: Refund): Promise<void> {
    // Implementation would integrate with notification service
    console.log(`Refund notification sent for payment ${payment.id}, refund ${refund.id}`);
  }
}