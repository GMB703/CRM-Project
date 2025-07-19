import express from 'express';
import { isAuthenticated } from '../middleware/auth.js';
import { createPaymentIntent, handleWebhook } from '../services/paymentService.js';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Get all payments
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const payments = await prisma.payment.findMany({
      where: {
        invoice: {
          organizationId: req.user.organizationId,
        },
      },
    });
    res.json({ success: true, data: payments });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get payments' });
  }
});

// Create a new payment intent
router.post('/create-payment-intent', isAuthenticated, async (req, res) => {
  try {
    const { amount } = req.body;
    const paymentIntent = await createPaymentIntent(amount);
    res.json({ success: true, clientSecret: paymentIntent.client_secret });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create payment intent' });
  }
});

// Handle Stripe webhooks
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    await handleWebhook(req.body, req.headers['stripe-signature']);
    res.json({ received: true });
  } catch (error) {
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
});

export { router as default }; 