import express from 'express';
import multer from 'multer';
import { PrismaClient } from '@prisma/client';
import asyncHandler from 'express-async-handler';
import { auth } from '../middleware/auth.js';
import path from 'path';

const router = express.Router();
const prisma = new PrismaClient();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// @desc    Get messages for a project
// @route   GET /api/chat/messages/:projectId
// @access  Private
router.get(
  '/messages/:projectId',
  auth,
  asyncHandler(async (req, res) => {
    const { projectId } = req.params;

    const messages = await prisma.teamChatMessage.findMany({
      where: {
        projectId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    res.json(messages);
  })
);

// @desc    Send a new message
// @route   POST /api/chat/messages
// @access  Private
router.post(
  '/messages',
  auth,
  asyncHandler(async (req, res) => {
    const { content, projectId, type = 'TEXT' } = req.body;
    const userId = req.user.id;

    const message = await prisma.teamChatMessage.create({
      data: {
        content,
        type,
        projectId,
        userId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Emit the message to connected clients
    req.app.get('io').to(projectId).emit('new_message', message);

    res.status(201).json(message);
  })
);

// @desc    Upload a file
// @route   POST /api/chat/upload
// @access  Private
router.post(
  '/upload',
  auth,
  upload.single('file'),
  asyncHandler(async (req, res) => {
    const { projectId } = req.body;
    const userId = req.user.id;
    const file = req.file;

    if (!file) {
      res.status(400);
      throw new Error('No file uploaded');
    }

    const fileUrl = `/uploads/${file.filename}`;
    
    const message = await prisma.teamChatMessage.create({
      data: {
        content: 'File shared',
        type: 'FILE',
        projectId,
        userId,
        fileUrl,
        fileName: file.originalname,
        fileType: file.mimetype,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Emit the message to connected clients
    req.app.get('io').to(projectId).emit('new_message', message);

    res.status(201).json(message);
  })
);

// @desc    Delete a message
// @route   DELETE /api/chat/messages/:id
// @access  Private
router.delete(
  '/messages/:id',
  auth,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    const message = await prisma.teamChatMessage.findUnique({
      where: { id },
    });

    if (!message) {
      res.status(404);
      throw new Error('Message not found');
    }

    if (message.userId !== userId) {
      res.status(403);
      throw new Error('Not authorized to delete this message');
    }

    await prisma.teamChatMessage.delete({
      where: { id },
    });

    res.json({ message: 'Message deleted' });
  })
);

export default router; 