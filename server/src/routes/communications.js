import express from 'express';
import { PrismaClient } from '@prisma/client';
import { isAuthenticated } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// --- Message Templates ---

// Get all message templates
router.get('/templates', isAuthenticated, async (req, res) => {
  try {
    const templates = await prisma.messageTemplate.findMany({
      where: { organizationId: req.user.organizationId },
    });
    res.json({ success: true, data: templates });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get templates' });
  }
});

// Create a new message template
router.post('/templates', isAuthenticated, async (req, res) => {
  try {
    const { name, subject, body } = req.body;
    const template = await prisma.messageTemplate.create({
      data: {
        name,
        subject,
        body,
        organizationId: req.user.organizationId,
        creatorId: req.user.id,
      },
    });
    res.json({ success: true, data: template });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create template' });
  }
});

// --- Message History ---

// Get all message history
router.get('/history', isAuthenticated, async (req, res) => {
  try {
    const history = await prisma.messageHistory.findMany({
      where: { organizationId: req.user.organizationId },
      include: { sender: true, recipient: true },
    });
    res.json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get history' });
  }
});

// Send a new message
router.post('/send', isAuthenticated, async (req, res) => {
  try {
    const { recipientId, subject, body } = req.body;
    const message = await prisma.messageHistory.create({
      data: {
        subject,
        body,
        organizationId: req.user.organizationId,
        senderId: req.user.id,
        recipientId,
      },
    });
    res.json({ success: true, data: message });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to send message' });
  }
});

export { router as default };
