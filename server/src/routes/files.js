import express from 'express';
import multer from 'multer';
import { PrismaClient } from '@prisma/client';
import { isAuthenticated } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();
const upload = multer({ dest: 'uploads/' });

// Get all files
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const files = await prisma.file.findMany({
      where: { organizationId: req.user.organizationId },
    });
    res.json({ success: true, data: files });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get files' });
  }
});

// Upload a new file
router.post('/upload', isAuthenticated, upload.single('file'), async (req, res) => {
  try {
    const { originalname, path, size } = req.file;
    const file = await prisma.file.create({
      data: {
        name: originalname,
        url: path,
        size,
        organizationId: req.user.organizationId,
      },
    });
    res.json({ success: true, data: file });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to upload file' });
  }
});

// Delete a file
router.delete('/:id', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.file.delete({
      where: { id },
    });
    res.json({ success: true, message: 'File deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete file' });
  }
});

export { router as default }; 