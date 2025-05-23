'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@apollo/client';
import { 
  CreditCardIcon,
  BanknotesIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowLeftIcon,
  PrinterIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/24/outline';
import { GET_PAYMENT_DETAILS, PROCESS_PAYMENT } from '@/lib/graphql/queries';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface PaymentMethod {
  id: string;
  type: 'CREDIT_CARD' | 'BANK_ACCOUNT';
  last4: string;
  expiryMonth?: number;
  expiryYear?: number;
  bankName?: string;
}

export default function PaymentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  const { data, loading, error } = useQuery(GET_PAYMENT_DETAILS, {
    variables: { id: params.id },
  });

  const [processPaymentMutation] = useMutation(PROCESS_PAYMENT);

  const handleProcessPayment = async () => {
    if (!selectedPaymentMethod) return;
    
    setIsProcessing(true);
    try {
      await processPaymentMutation({
        variables: {
          paymentId: params.id,
          paymentMethodId: selectedPaymentMethod,
        },
      });
      // Refresh payment data
      window.location.reload();
    } catch (error) {
      console.error('Payment processing error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner className="w-8 h-8" />
      </div>
    );
  }

  if (error || !data?.payment) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment not found</h2>
          <p className="text-gray-600 mb-4">The payment you're looking for doesn't exist.</p>
          <button
            onClick={() => router.push('/payments')}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            Back to Payments
          </button>
        </div>
      </div>
    );
  }

  const payment = data.payment;
  const tenant = data.tenant;
  const paymentMethods = data.paymentMethods || [];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircleIcon className="w-6 h-6 text-green-600" />;
      case 'FAILED':
        return <XCircleIcon className="w-6 h-6 text-red-600" />;
      case 'PENDING':
        return <ClockIcon className="w-6 h-6 text-yellow-600" />;
      default:
        return <ClockIcon className="w-6 h-6 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <button
              onClick={() => router.push('/payments')}
              className="mr-4 p-2 hover:bg-gray-100 rounded-full"
            >
              <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Payment Details</h1>
              <p className="text-gray-600">Payment ID: {payment.id}</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <button className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 flex items-center">
              <PrinterIcon className="w-4 h-4 mr-2" />
              Print
            </button>
            <button className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 flex items-center">
              <DocumentDuplicateIcon className="w-4 h-4 mr-2" />
              Duplicate
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Payment Summary */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Payment Summary</h2>
                <div className="flex items-center">
                  {getStatusIcon(payment.status)}
                  <span className={`ml-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(payment.status)}`}>
                    {payment.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Amount</h3>
                  <p className="text-2xl font-bold text-gray-900">${payment.amount.toLocaleString()}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Due Date</h3>
                  <p className="text-lg text-gray-900">{new Date(payment.dueDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Payment Type</h3>
                  <p className="text-lg text-gray-900">{payment.type}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Created</h3>
                  <p className="text-lg text-gray-900">{new Date(payment.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Description</h3>
                <p className="text-gray-900">{payment.description}</p>
              </div>
            </div>

            {/* Tenant Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Tenant Information</h2>
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-gray-600 font-medium text-lg">
                    {tenant.firstName[0]}{tenant.lastName[0]}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {tenant.firstName} {tenant.lastName}
                  </h3>
                  <p className="text-gray-600">{tenant.email}</p>
                  <p className="text-gray-600">{tenant.phone}</p>
                </div>
              </div>
            </div>

            {/* Property Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Property Information</h2>
              <div>
                <h3 className="text-lg font-medium text-gray-900">{payment.property.title}</h3>
                <p className="text-gray-600">{payment.property.address}</p>
                <p className="text-gray-600">{payment.property.city}, {payment.property.state} {payment.property.zipCode}</p>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Payment Actions */}
            {payment.status === 'PENDING' && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Process Payment</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Payment Method
                    </label>
                    <div className="space-y-2">
                      {paymentMethods.map((method: PaymentMethod) => (
                        <label key={method.id} className="flex items-center">
                          <input
                            type="radio"
                            name="paymentMethod"
                            value={method.id}
                            checked={selectedPaymentMethod === method.id}
                            onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                          />
                          <div className="ml-3 flex items-center">
                            {method.type === 'CREDIT_CARD' ? (
                              <CreditCardIcon className="w-5 h-5 text-gray-400 mr-2" />
                            ) : (
                              <BanknotesIcon className="w-5 h-5 text-gray-400 mr-2" />
                            )}
                            <span className="text-sm text-gray-900">
                              {method.type === 'CREDIT_CARD' 
                                ? `****-****-****-${method.last4}` 
                                : `${method.bankName} ****${method.last4}`}
                            </span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleProcessPayment}
                    disabled={!selectedPaymentMethod || isProcessing}
                    className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {isProcessing ? (
                      <>
                        <LoadingSpinner className="w-4 h-4 mr-2" />
                        Processing...
                      </>
                    ) : (
                      'Process Payment'
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Payment History */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment History</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Payment created</span>
                  <span className="text-gray-900">{new Date(payment.createdAt).toLocaleDateString()}</span>
                </div>
                {payment.processedAt && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Payment processed</span>
                    <span className="text-gray-900">{new Date(payment.processedAt).toLocaleDateString()}</span>
                  </div>
                )}
                {payment.failedAt && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Payment failed</span>
                    <span className="text-gray-900">{new Date(payment.failedAt).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="space-y-2">
                <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md">
                  Send payment reminder
                </button>
                <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md">
                  Generate invoice
                </button>
                <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md">
                  Add late fee
                </button>
                <button className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md">
                  Cancel payment
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}