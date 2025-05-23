import { PaymentService } from '../services/PaymentService';
import { PaymentMethodService } from '../services/PaymentMethodService';

const paymentService = new PaymentService();
const paymentMethodService = new PaymentMethodService();

export const resolvers = {
  Query: {
    payment: async (_: any, { id }: { id: string }) => {
      return paymentService.getPaymentById(id);
    },

    payments: async (_: any, { tenantId, propertyId, status, limit, offset }: any) => {
      if (tenantId) {
        return paymentService.getPaymentsByTenant(tenantId, limit, offset);
      }
      if (propertyId) {
        return paymentService.getPaymentsByProperty(propertyId, limit, offset);
      }
      return paymentService.getAllPayments(limit, offset, status);
    },

    overduePayments: async () => {
      return paymentService.getOverduePayments();
    },

    paymentMethod: async (_: any, { id }: { id: string }) => {
      return paymentMethodService.getPaymentMethodById(id);
    },

    paymentMethods: async (_: any, { userId }: { userId: string }) => {
      return paymentMethodService.getPaymentMethodsByUser(userId);
    },

    refund: async (_: any, { id }: { id: string }) => {
      return paymentService.getRefundById(id);
    },

    refunds: async (_: any, { paymentId }: { paymentId: string }) => {
      return paymentService.getRefundsByPayment(paymentId);
    }
  },

  Mutation: {
    createPayment: async (_: any, { input }: { input: any }) => {
      return paymentService.createPayment(input);
    },

    processPayment: async (_: any, { input }: { input: any }) => {
      return paymentService.processPayment(input);
    },

    cancelPayment: async (_: any, { id }: { id: string }) => {
      return paymentService.cancelPayment(id);
    },

    retryPayment: async (_: any, { id }: { id: string }) => {
      return paymentService.retryPayment(id);
    },

    createPaymentMethod: async (_: any, { input }: { input: any }) => {
      return paymentMethodService.createPaymentMethod(input);
    },

    updatePaymentMethod: async (_: any, { id, nickname, isDefault }: any) => {
      return paymentMethodService.updatePaymentMethod(id, { nickname, isDefault });
    },

    deletePaymentMethod: async (_: any, { id }: { id: string }) => {
      return paymentMethodService.deletePaymentMethod(id);
    },

    createRefund: async (_: any, { input }: { input: any }) => {
      return paymentService.createRefund(input.paymentId, input.amount, input.reason);
    },

    calculateLateFees: async () => {
      await paymentService.calculateLateFees();
      return true;
    }
  },

  Payment: {
    paymentMethod: async (payment: any) => {
      if (payment.paymentMethodId) {
        return paymentMethodService.getPaymentMethodById(payment.paymentMethodId);
      }
      return null;
    },

    refunds: async (payment: any) => {
      return paymentService.getRefundsByPayment(payment.id);
    }
  }
};