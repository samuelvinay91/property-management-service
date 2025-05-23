import Stripe from 'stripe';

interface ProcessPaymentData {
  paymentMethodId: string;
  amount: number;
  currency: string;
  description: string;
  metadata?: Record<string, any>;
}

interface CreateRefundData {
  chargeId: string;
  amount: number;
  reason: string;
}

interface StripePaymentResult {
  paymentIntentId: string;
  chargeId: string;
  processingFee: number;
}

export class StripeService {
  private stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2023-10-16'
    });
  }

  async processPayment(data: ProcessPaymentData): Promise<StripePaymentResult> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: data.amount,
        currency: data.currency,
        payment_method: data.paymentMethodId,
        description: data.description,
        metadata: data.metadata || {},
        confirm: true,
        return_url: process.env.STRIPE_RETURN_URL
      });

      if (paymentIntent.status !== 'succeeded') {
        throw new Error(`Payment failed with status: ${paymentIntent.status}`);
      }

      const charge = paymentIntent.latest_charge as Stripe.Charge;
      const processingFee = this.calculateProcessingFee(data.amount);

      return {
        paymentIntentId: paymentIntent.id,
        chargeId: charge.id,
        processingFee
      };
    } catch (error) {
      throw new Error(`Stripe payment failed: ${error.message}`);
    }
  }

  async createRefund(data: CreateRefundData): Promise<Stripe.Refund> {
    try {
      return await this.stripe.refunds.create({
        charge: data.chargeId,
        amount: data.amount,
        reason: data.reason as any
      });
    } catch (error) {
      throw new Error(`Stripe refund failed: ${error.message}`);
    }
  }

  async createCustomer(email: string, name: string): Promise<Stripe.Customer> {
    return this.stripe.customers.create({
      email,
      name
    });
  }

  async createPaymentMethod(customerId: string, type: string, cardData?: any): Promise<Stripe.PaymentMethod> {
    const paymentMethodData: any = {
      type: type as any,
      customer: customerId
    };

    if (type === 'card' && cardData) {
      paymentMethodData.card = cardData;
    }

    return this.stripe.paymentMethods.create(paymentMethodData);
  }

  async createSubscription(customerId: string, priceId: string, paymentMethodId: string): Promise<Stripe.Subscription> {
    return this.stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      default_payment_method: paymentMethodId,
      expand: ['latest_invoice.payment_intent']
    });
  }

  async cancelSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    return this.stripe.subscriptions.cancel(subscriptionId);
  }

  async handleWebhook(payload: string, signature: string): Promise<Stripe.Event> {
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;
    
    try {
      return this.stripe.webhooks.constructEvent(payload, signature, endpointSecret);
    } catch (error) {
      throw new Error(`Webhook signature verification failed: ${error.message}`);
    }
  }

  private calculateProcessingFee(amount: number): number {
    // Stripe standard pricing: 2.9% + 30¢
    return Math.round((amount * 0.029 + 30));
  }
}