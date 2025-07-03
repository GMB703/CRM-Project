import express from "express";
import { auth as authMiddleware } from "../middleware/auth.js";
import { createMultiTenantMiddleware } from "../middleware/multiTenant.js";
import CommunicationHubService from "../services/communicationHubService.js";

const router = express.Router();
const multiTenantMiddleware = createMultiTenantMiddleware();

router.use(authMiddleware);
router.use(multiTenantMiddleware);

// Send message
router.post("/send", async (req, res) => {
  try {
    const { organizationId } = req.multiTenant;
    const { userId } = req.user;
    
    const messageData = {
      ...req.body,
      organizationId,
      userId
    };
    
    const result = await CommunicationHubService.sendMessage(messageData);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get message history
router.get("/history", async (req, res) => {
  try {
    const { organizationId } = req.multiTenant;
    const filters = req.query;
    
    const history = await CommunicationHubService.getMessageHistory(organizationId, filters);
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get communication channels
router.get("/channels", async (req, res) => {
  try {
    const { organizationId } = req.multiTenant;
    const { type } = req.query;
    
    const channels = await CommunicationHubService.getChannels(organizationId, type);
    res.json(channels);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create communication channel
router.post("/channels", async (req, res) => {
  try {
    const { organizationId } = req.multiTenant;
    
    const channel = await CommunicationHubService.createChannel(req.body, organizationId);
    res.status(201).json(channel);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get communication analytics
router.get("/analytics", async (req, res) => {
  try {
    const { organizationId } = req.multiTenant;
    const { days = 30 } = req.query;
    
    const analytics = await CommunicationHubService.getCommunicationAnalytics(organizationId, parseInt(days));
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
