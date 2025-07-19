import express from 'express';
import { isAuthenticated } from '../middleware/auth.js';
import { generateContract } from '../services/contractService.js';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Get all contract templates
router.get('/templates', isAuthenticated, async (req, res) => {
  try {
    const templates = await prisma.contractTemplate.findMany({
      where: { organizationId: req.user.organizationId },
    });
    res.json({ success: true, data: templates });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get templates' });
  }
});

// Create a new contract template
router.post('/templates', isAuthenticated, async (req, res) => {
  try {
    const { name, content } = req.body;
    const template = await prisma.contractTemplate.create({
      data: {
        name,
        content,
        organizationId: req.user.organizationId,
      },
    });
    res.json({ success: true, data: template });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create template' });
  }
});


// Generate a new contract
router.post('/generate', isAuthenticated, async (req, res) => {
  try {
    const { contractData } = req.body;
    const pdfBytes = await generateContract(contractData);
    res.setHeader('Content-Type', 'application/pdf');
    res.send(pdfBytes);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to generate contract' });
  }
});

export { router as default }; 