import express from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const router = express.Router();
const prisma = new PrismaClient();

// Middleware to protect routes
const isClientAuthenticated = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.clientId = decoded.clientId;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Client login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const client = await prisma.client.findUnique({
      where: { email },
    });

    if (!client || !(await bcrypt.compare(password, client.password))) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const token = jwt.sign({ clientId: client.id }, process.env.JWT_SECRET, {
      expiresIn: '1d',
    });

    res.json({ success: true, token });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to log in' });
  }
});

// Get all estimates for the client
router.get('/estimates', isClientAuthenticated, async (req, res) => {
  try {
    const estimates = await prisma.estimate.findMany({
      where: { clientId: req.clientId },
    });
    res.json({ success: true, data: estimates });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get estimates' });
  }
});

// Get all contracts for the client
router.get('/contracts', isClientAuthenticated, async (req, res) => {
  try {
    const contracts = await prisma.contract.findMany({
      where: { clientId: req.clientId },
    });
    res.json({ success: true, data: contracts });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get contracts' });
  }
});

export { router as default }; 