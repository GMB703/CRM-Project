import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class PaymentService {
  static stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

  static async getEstimatePayments(estimateId, organizationId) {
    // Verify estimate belongs to organization
    const estimate = await prisma.estimate.findFirst({
      where: { id: estimateId, organizationId }
    });

    if (!estimate) {
      throw new Error('Estimate not found');
    }

    return await prisma.estimatePayment.findMany({
      where: { estimateId },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async createPayment(paymentData) {
    const {
      estimateId,
      organizationId,
      amount,
      method,
      stripePaymentIntentId,
      description,
      reference
    } = paymentData;

    // Verify estimate belongs to organization
    const estimate = await prisma.estimate.findFirst({
      where: { id: estimateId, organizationId }
    });

    if (!estimate) {
      throw new Error('Estimate not found');
    }

    const payment = await prisma.estimatePayment.create({
      data: {
        estimateId,
        amount,
        method,
        status: 'PENDING',
        stripePaymentIntentId,
        description,
        reference,
        currency: 'USD'
      }
    });

    return payment;
  }

  static async createStripePaymentIntent({
    estimateId,
    organizationId,
    amount,
    currency = 'usd',
    description
  }) {
    if (!this.stripe) {
      throw new Error('Stripe is not configured');
    }

    try {
      // Verify estimate belongs to organization
      const estimate = await prisma.estimate.findFirst({
        where: { id: estimateId, organizationId },
        include: {
          client: true,
          organization: true
        }
      });

      if (!estimate) {
        throw new Error('Estimate not found');
      }

      // Create Stripe PaymentIntent
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency,
        description: description || `Payment for estimate ${estimate.referenceNumber}`,
        metadata: {
          estimateId,
          organizationId,
          clientEmail: estimate.client.email,
          estimateNumber: estimate.referenceNumber
        }
      });

      // Create payment record in database
      const payment = await this.createPayment({
        estimateId,
        organizationId,
        amount,
        method: 'STRIPE',
        stripePaymentIntentId: paymentIntent.id,
        description: description || `Payment for estimate ${estimate.referenceNumber}`
      });

      return {
        paymentIntent,
        payment,
        clientSecret: paymentIntent.client_secret
      };
    } catch (error) {
      console.error('Error creating Stripe PaymentIntent:', error);
      throw new Error(`Failed to create payment intent: ${error.message}`);
    }
  }

  static async handleStripeWebhook(event) {
    if (!this.stripe) {
      throw new Error('Stripe is not configured');
    }

    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSuccess(event.data.object);
          break;
        case 'payment_intent.payment_failed':
          await this.handlePaymentFailure(event.data.object);
          break;
        case 'payment_intent.canceled':
          await this.handlePaymentCanceled(event.data.object);
          break;
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }
    } catch (error) {
      console.error('Error handling Stripe webhook:', error);
      throw error;
    }
  }

  static async handlePaymentSuccess(paymentIntent) {
    try {
      // Find payment record
      const payment = await prisma.estimatePayment.findFirst({
        where: { stripePaymentIntentId: paymentIntent.id }
      });

      if (!payment) {
        console.error('Payment record not found for PaymentIntent:', paymentIntent.id);
        return;
      }

      // Update payment status
      await prisma.estimatePayment.update({
        where: { id: payment.id },
        data: {
          status: 'COMPLETED',
          paidAt: new Date(),
          stripeChargeId: paymentIntent.charges?.data[0]?.id
        }
      });

      // Check if estimate is fully paid
      const estimate = await prisma.estimate.findUnique({
        where: { id: payment.estimateId },
        include: {
          payments: {
            where: { status: 'COMPLETED' }
          }
        }
      });

      if (estimate) {
        const totalPaid = estimate.payments.reduce((sum, p) => sum + p.amount, 0);
        const estimateTotal = estimate.subtotal + (estimate.subtotal * estimate.taxRate / 100) - (estimate.discountValue || 0);

        if (totalPaid >= estimateTotal) {
          await prisma.estimate.update({
            where: { id: estimate.id },
            data: { 
              status: 'PAID',
              paidAt: new Date()
            }
          });
        }
      }

      console.log('Payment processed successfully:', payment.id);
    } catch (error) {
      console.error('Error handling payment success:', error);
      throw error;
    }
  }

  static async handlePaymentFailure(paymentIntent) {
    try {
      const payment = await prisma.estimatePayment.findFirst({
        where: { stripePaymentIntentId: paymentIntent.id }
      });

      if (payment) {
        await prisma.estimatePayment.update({
          where: { id: payment.id },
          data: {
            status: 'FAILED',
            failureReason: paymentIntent.last_payment_error?.message || 'Payment failed'
          }
        });
      }

      console.log('Payment failed:', paymentIntent.id);
    } catch (error) {
      console.error('Error handling payment failure:', error);
      throw error;
    }
  }

  static async handlePaymentCanceled(paymentIntent) {
    try {
      const payment = await prisma.estimatePayment.findFirst({
        where: { stripePaymentIntentId: paymentIntent.id }
      });

      if (payment) {
        await prisma.estimatePayment.update({
          where: { id: payment.id },
          data: {
            status: 'CANCELLED'
          }
        });
      }

      console.log('Payment canceled:', paymentIntent.id);
    } catch (error) {
      console.error('Error handling payment cancellation:', error);
      throw error;
    }
  }

  static async refundPayment(paymentId, organizationId, amount = null, reason = null) {
    if (!this.stripe) {
      throw new Error('Stripe is not configured');
    }

    try {
      // Get payment record
      const payment = await prisma.estimatePayment.findFirst({
        where: {
          id: paymentId,
          estimate: { organizationId }
        }
      });

      if (!payment) {
        throw new Error('Payment not found');
      }

      if (payment.status !== 'COMPLETED') {
        throw new Error('Can only refund completed payments');
      }

      // Create Stripe refund
      const refund = await this.stripe.refunds.create({
        payment_intent: payment.stripePaymentIntentId,
        amount: amount ? Math.round(amount * 100) : undefined, // Partial refund if amount specified
        reason: reason || 'requested_by_customer'
      });

      // Update payment record
      await prisma.estimatePayment.update({
        where: { id: payment.id },
        data: {
          status: amount && amount < payment.amount ? 'PARTIALLY_REFUNDED' : 'REFUNDED',
          refundedAmount: (payment.refundedAmount || 0) + (amount || payment.amount),
          stripeRefundId: refund.id
        }
      });

      return {
        success: true,
        refund,
        refundedAmount: amount || payment.amount
      };
    } catch (error) {
      console.error('Error processing refund:', error);
      throw new Error(`Failed to process refund: ${error.message}`);
    }
  }

  static async getPaymentStats(organizationId, period = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - period);

    const [
      totalPayments,
      completedPayments,
      failedPayments,
      totalRevenue,
      periodRevenue
    ] = await Promise.all([
      // Total payments
      prisma.estimatePayment.count({
        where: {
          estimate: { organizationId }
        }
      }),

      // Completed payments
      prisma.estimatePayment.count({
        where: {
          estimate: { organizationId },
          status: 'COMPLETED'
        }
      }),

      // Failed payments
      prisma.estimatePayment.count({
        where: {
          estimate: { organizationId },
          status: 'FAILED'
        }
      }),

      // Total revenue
      prisma.estimatePayment.aggregate({
        where: {
          estimate: { organizationId },
          status: 'COMPLETED'
        },
        _sum: {
          amount: true
        }
      }),

      // Period revenue
      prisma.estimatePayment.aggregate({
        where: {
          estimate: { organizationId },
          status: 'COMPLETED',
          paidAt: {
            gte: startDate
          }
        },
        _sum: {
          amount: true
        }
      })
    ]);

    const successRate = totalPayments > 0 ? (completedPayments / totalPayments) * 100 : 0;

    return {
      totalPayments,
      completedPayments,
      failedPayments,
      successRate: Math.round(successRate * 100) / 100,
      totalRevenue: totalRevenue._sum.amount || 0,
      periodRevenue: periodRevenue._sum.amount || 0
    };
  }

  static async createPaymentLink({
    estimateId,
    organizationId,
    amount,
    description,
    returnUrl,
    cancelUrl
  }) {
    if (!this.stripe) {
      throw new Error('Stripe is not configured');
    }

    try {
      // Verify estimate
      const estimate = await prisma.estimate.findFirst({
        where: { id: estimateId, organizationId },
        include: { client: true, organization: true }
      });

      if (!estimate) {
        throw new Error('Estimate not found');
      }

      // Create Stripe Checkout session
      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: description || `Payment for estimate ${estimate.referenceNumber}`,
                description: estimate.title
              },
              unit_amount: Math.round(amount * 100)
            },
            quantity: 1
          }
        ],
        mode: 'payment',
        success_url: returnUrl || `${process.env.CLIENT_URL}/estimates/${estimateId}/payment-success`,
        cancel_url: cancelUrl || `${process.env.CLIENT_URL}/estimates/${estimateId}/payment-cancel`,
        customer_email: estimate.client.email,
        metadata: {
          estimateId,
          organizationId,
          estimateNumber: estimate.referenceNumber
        }
      });

      // Create payment record
      await this.createPayment({
        estimateId,
        organizationId,
        amount,
        method: 'STRIPE_CHECKOUT',
        stripePaymentIntentId: session.payment_intent,
        description: description || `Payment for estimate ${estimate.referenceNumber}`,
        reference: session.id
      });

      return {
        sessionId: session.id,
        url: session.url
      };
    } catch (error) {
      console.error('Error creating payment link:', error);
      throw new Error(`Failed to create payment link: ${error.message}`);
    }
  }
}

export default PaymentService;
