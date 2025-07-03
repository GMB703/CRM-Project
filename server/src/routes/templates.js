import express from "express";
import { auth as authMiddleware } from "../middleware/auth.js";
import { createMultiTenantMiddleware } from "../middleware/multiTenant.js";
import TemplateService from "../services/templateService.js";

const router = express.Router();
const multiTenantMiddleware = createMultiTenantMiddleware();

router.use(authMiddleware);
router.use(multiTenantMiddleware);

// Get all templates
router.get("/", async (req, res) => {
  try {
    const { organizationId } = req.multiTenant;
    const { category, type, isActive, searchTerm } = req.query;
    
    const filters = { category, type, searchTerm };
    if (isActive !== undefined) filters.isActive = isActive === "true";

    const templates = await TemplateService.getTemplates(organizationId, filters);
    res.json(templates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get template by ID
router.get("/:id", async (req, res) => {
  try {
    const { organizationId } = req.multiTenant;
    const template = await TemplateService.getTemplateById(req.params.id, organizationId);
    
    if (!template) {
      return res.status(404).json({ error: "Template not found" });
    }
    
    res.json(template);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new template
router.post("/", async (req, res) => {
  try {
    const { organizationId } = req.multiTenant;
    const { userId } = req.user;
    
    const template = await TemplateService.createTemplate(req.body, organizationId, userId);
    res.status(201).json(template);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Test template processing
router.post("/:id/test", async (req, res) => {
  try {
    const { organizationId } = req.multiTenant;
    const { variables } = req.body;
    
    const template = await TemplateService.getTemplateById(req.params.id, organizationId);
    if (!template) {
      return res.status(404).json({ error: "Template not found" });
    }
    
    const processed = TemplateService.processTemplate(template, variables);
    res.json(processed);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
