import express from 'express';
import { auth } from '../middleware/auth.js';
import { createMultiTenantMiddleware } from '../middleware/multiTenant.js';
import EstimateService from '../services/estimateService.js';
import PDFService from '../services/pdfService.js';
import EmailService from '../services/emailService.js';
import PaymentService from '../services/paymentService.js';
import { validateEstimateData } from '../utils/estimateUtils.js';

const router = express.Router();

// Apply organization middleware to all routes
const requireOrganization = createMultiTenantMiddleware();
router.use(requireOrganization);

/**
 * @route   GET /api/estimates
 * @desc    Get all estimates for the organization
 * @access  Private
 */
router.get('/', auth, async (req, res) => {
  try {
    const { status, clientId, page = 1, limit = 20, search } = req.query;
    const organizationId = req.multiTenant.organizationId;

    const filters = {
      organizationId,
      ...(status && { status }),
      ...(clientId && { clientId }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { referenceNumber: { contains: search, mode: 'insensitive' } },
          { client: { 
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } }
            ]
          }}
        ]
      })
    };

    const estimates = await EstimateService.getEstimates(filters, {
      page: parseInt(page),
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      data: estimates
    });
  } catch (error) {
    console.error('Error fetching estimates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch estimates',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/estimates/dashboard-stats
 * @desc    Get estimate dashboard statistics
 * @access  Private
 */
router.get('/dashboard-stats', auth, async (req, res) => {
  try {
    const organizationId = req.multiTenant.organizationId;
    const { period = '30' } = req.query;

    const stats = await EstimateService.getDashboardStats(organizationId, parseInt(period));

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard stats',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/estimates/pricing-suggestions
 * @desc    Get pricing suggestions for a service type
 * @access  Private
 */
router.get('/pricing-suggestions', auth, async (req, res) => {
  try {
    const { serviceType, category } = req.query;
    
    if (!serviceType) {
      return res.status(400).json({ error: 'Service type is required' });
    }

    const organizationId = req.multiTenant.organizationId;
    const suggestions = await EstimateService.suggestPricing(serviceType, category, organizationId);
    res.json(suggestions);
  } catch (error) {
    console.error('Error getting pricing suggestions:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   POST /api/estimates
 * @desc    Create a new estimate
 * @access  Private
 */
router.post('/', auth, async (req, res) => {
  try {
    const organizationId = req.multiTenant.organizationId;
    const creatorId = req.user.id;

    const estimateData = {
      ...req.body,
      organizationId,
      creatorId
    };

    const estimate = await EstimateService.createEstimate(estimateData);

    res.status(201).json({
      success: true,
      data: estimate,
      message: 'Estimate created successfully'
    });
  } catch (error) {
    console.error('Error creating estimate:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create estimate',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/estimates/:id
 * @desc    Get a specific estimate by ID
 * @access  Private
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const organizationId = req.multiTenant.organizationId;
    const estimate = await EstimateService.getEstimateById(req.params.id, organizationId);
    
    if (!estimate) {
      return res.status(404).json({
        success: false,
        message: 'Estimate not found'
      });
    }

    res.json({
      success: true,
      data: estimate
    });
  } catch (error) {
    console.error('Error fetching estimate:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch estimate',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/estimates/:id
 * @desc    Update an estimate
 * @access  Private
 */
router.put('/:id', auth, async (req, res) => {
  try {
    const organizationId = req.multiTenant.organizationId;
    const estimate = await EstimateService.updateEstimate(req.params.id, req.body, organizationId);
    
    if (!estimate) {
      return res.status(404).json({
        success: false,
        message: 'Estimate not found'
      });
    }

    res.json({
      success: true,
      data: estimate,
      message: 'Estimate updated successfully'
    });
  } catch (error) {
    console.error('Error updating estimate:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update estimate',
      error: error.message
    });
  }
});

/**
 * @route   PATCH /api/estimates/:id/status
 * @desc    Update estimate status
 * @access  Private
 */
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const validStatuses = ['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const organizationId = req.multiTenant.organizationId;
    const updateData = { status };
    if (status === 'REJECTED' && rejectionReason) {
      updateData.rejectionReason = rejectionReason;
    }

    const estimate = await EstimateService.updateEstimate(req.params.id, updateData, organizationId);
    
    res.json(estimate);
  } catch (error) {
    console.error('Error updating estimate status:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   DELETE /api/estimates/:id
 * @desc    Delete an estimate
 * @access  Private
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const organizationId = req.multiTenant.organizationId;
    const deleted = await EstimateService.deleteEstimate(req.params.id, organizationId);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Estimate not found'
      });
    }

    res.json({
      success: true,
      message: 'Estimate deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting estimate:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete estimate',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/estimates/:id/convert-to-contract
 * @desc    Convert an accepted estimate to a contract
 * @access  Private
 */
router.post('/:id/convert-to-contract', auth, async (req, res) => {
  try {
    const { title, content } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: 'Contract content is required' });
    }

    const organizationId = req.multiTenant.organizationId;
    const estimate = await EstimateService.getEstimateById(req.params.id, organizationId);
    
    if (!estimate) {
      return res.status(404).json({ error: 'Estimate not found' });
    }

    const contract = await EstimateService.convertToContract(req.params.id, {
      title,
      content
    }, organizationId);
    
    res.status(201).json(contract);
  } catch (error) {
    console.error('Error converting estimate to contract:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   POST /api/estimates/:id/duplicate
 * @desc    Duplicate an existing estimate
 * @access  Private
 */
router.post('/:id/duplicate', auth, async (req, res) => {
  try {
    const organizationId = req.multiTenant.organizationId;
    const creatorId = req.user.id;
    const duplicatedEstimate = await EstimateService.duplicateEstimate(req.params.id, organizationId, creatorId);
    
    if (!duplicatedEstimate) {
      return res.status(404).json({
        success: false,
        message: 'Estimate not found'
      });
    }

    res.status(201).json({
      success: true,
      data: duplicatedEstimate,
      message: 'Estimate duplicated successfully'
    });
  } catch (error) {
    console.error('Error duplicating estimate:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to duplicate estimate',
      error: error.message
    });
  }
});

// ===============================
// PUBLIC ROUTES (Customer Portal)
// ===============================

/**
 * @route   GET /api/estimates/portal/:token
 * @desc    Get estimate via customer portal token (public access)
 * @access  Public
 */
router.get('/portal/:token', async (req, res) => {
  try {
    // Don't use organization middleware for public routes
    // We'll determine organization from the estimate itself
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    const estimate = await prisma.estimate.findFirst({
      where: { portalToken: req.params.token },
      include: {
        client: true,
        organization: {
          include: {
            organizationSettings: true
          }
        },
        lineItems: {
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!estimate) {
      return res.status(404).json({ error: 'Estimate not found or access denied' });
    }

    // Remove sensitive data before sending to client
    const safeEstimate = {
      id: estimate.id,
      estimateNumber: estimate.estimateNumber,
      title: estimate.title,
      description: estimate.description,
      subtotal: estimate.subtotal,
      taxRate: estimate.taxRate,
      taxAmount: estimate.taxAmount,
      discountType: estimate.discountType,
      discountValue: estimate.discountValue,
      discountAmount: estimate.discountAmount,
      totalAmount: estimate.totalAmount,
      status: estimate.status,
      validUntil: estimate.validUntil,
      terms: estimate.terms,
      notes: estimate.notes,
      createdAt: estimate.createdAt,
      lineItems: estimate.lineItems,
      client: {
        name: estimate.client.name
      },
      organization: {
        name: estimate.organization.name,
        logo: estimate.organization.logo,
        primaryColor: estimate.organization.primaryColor
      }
    };

    res.json(safeEstimate);
  } catch (error) {
    console.error('Error fetching estimate via portal:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @route   POST /api/estimates/portal/:token/accept
 * @desc    Accept estimate via customer portal (public access)
 * @access  Public
 */
router.post('/portal/:token/accept', async (req, res) => {
  try {
    const { clientSignature, acceptanceNotes } = req.body;
    
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    // Find and update the estimate
    const estimate = await prisma.estimate.findFirst({
      where: { 
        portalToken: req.params.token,
        status: { in: ['SENT', 'DRAFT'] }
      }
    });

    if (!estimate) {
      return res.status(404).json({ error: 'Estimate not found or cannot be accepted' });
    }

    const updatedEstimate = await prisma.estimate.update({
      where: { id: estimate.id },
      data: {
        status: 'ACCEPTED',
        acceptedAt: new Date(),
        clientSignature,
        acceptanceNotes
      }
    });

    res.json({ 
      success: true, 
      message: 'Estimate accepted successfully',
      estimateNumber: updatedEstimate.estimateNumber
    });
  } catch (error) {
    console.error('Error accepting estimate via portal:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @route   POST /api/estimates/portal/:token/reject
 * @desc    Reject estimate via customer portal (public access)
 * @access  Public
 */
router.post('/portal/:token/reject', async (req, res) => {
  try {
    const { rejectionReason } = req.body;
    
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    // Find and update the estimate
    const estimate = await prisma.estimate.findFirst({
      where: { 
        portalToken: req.params.token,
        status: { in: ['SENT', 'DRAFT'] }
      }
    });

    if (!estimate) {
      return res.status(404).json({ error: 'Estimate not found or cannot be rejected' });
    }

    const updatedEstimate = await prisma.estimate.update({
      where: { id: estimate.id },
      data: {
        status: 'REJECTED',
        rejectedAt: new Date(),
        rejectionReason: rejectionReason || 'No reason provided'
      }
    });

    res.json({ 
      success: true, 
      message: 'Estimate rejected',
      estimateNumber: updatedEstimate.estimateNumber
    });
  } catch (error) {
    console.error('Error rejecting estimate via portal:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Generate PDF
router.post('/:id/pdf', async (req, res) => {
  try {
    const organizationId = req.multiTenant.organizationId;
    const estimate = await EstimateService.getEstimateById(req.params.id, organizationId);
    
    if (!estimate) {
      return res.status(404).json({
        success: false,
        message: 'Estimate not found'
      });
    }

    const pdfBuffer = await PDFService.generateEstimatePDF(estimate);
    const pdfPath = await PDFService.saveEstimatePDF(estimate, pdfBuffer);

    // Update estimate with PDF path
    await EstimateService.updateEstimate(req.params.id, {
      pdfPath,
      pdfGeneratedAt: new Date()
    }, organizationId);

    res.json({
      success: true,
      data: {
        pdfPath,
        downloadUrl: `/api/estimates/${req.params.id}/pdf/download`
      },
      message: 'PDF generated successfully'
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate PDF',
      error: error.message
    });
  }
});

// Download PDF
router.get('/:id/pdf/download', async (req, res) => {
  try {
    const organizationId = req.multiTenant.organizationId;
    const estimate = await EstimateService.getEstimateById(req.params.id, organizationId);
    
    if (!estimate || !estimate.pdfPath) {
      return res.status(404).json({
        success: false,
        message: 'PDF not found'
      });
    }

    const pdfPath = PDFService.getFullPDFPath(estimate.pdfPath);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="estimate-${estimate.referenceNumber}.pdf"`);
    
    res.sendFile(pdfPath);
  } catch (error) {
    console.error('Error downloading PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download PDF',
      error: error.message
    });
  }
});

// Send estimate via email
router.post('/:id/send', async (req, res) => {
  try {
    const organizationId = req.multiTenant.organizationId;
    const { id } = req.params;
    const { email, subject, message, generatePDF = true } = req.body;
    const senderId = req.user.id;

    const estimate = await EstimateService.getEstimateById(id, organizationId);
    
    if (!estimate) {
      return res.status(404).json({
        success: false,
        message: 'Estimate not found'
      });
    }

    // Generate PDF if requested and not exists
    let pdfPath = estimate.pdfPath;
    if (generatePDF && !pdfPath) {
      const pdfBuffer = await PDFService.generateEstimatePDF(estimate);
      pdfPath = await PDFService.saveEstimatePDF(estimate, pdfBuffer);
      
      await EstimateService.updateEstimate(id, {
        pdfPath,
        pdfGeneratedAt: new Date()
      }, organizationId);
    }

    // Send email
    const emailResult = await EmailService.sendEstimate({
      estimate,
      recipientEmail: email || estimate.client.email,
      subject,
      message,
      pdfPath,
      senderId
    });

    // Update estimate status
    await EstimateService.updateEstimate(id, {
      status: 'SENT',
      sentAt: new Date()
    }, organizationId);

    res.json({
      success: true,
      data: emailResult,
      message: 'Estimate sent successfully'
    });
  } catch (error) {
    console.error('Error sending estimate:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send estimate',
      error: error.message
    });
  }
});

// Submit for approval
router.post('/:id/submit-approval', async (req, res) => {
  try {
    const organizationId = req.multiTenant.organizationId;
    const { id } = req.params;
    const { comments } = req.body;
    const userId = req.user.id;

    const result = await EstimateService.submitForApproval(id, organizationId, userId, comments);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Estimate not found'
      });
    }

    res.json({
      success: true,
      data: result,
      message: 'Estimate submitted for approval'
    });
  } catch (error) {
    console.error('Error submitting for approval:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit for approval',
      error: error.message
    });
  }
});

// Approve/Reject estimate
router.post('/:id/approve', async (req, res) => {
  try {
    const organizationId = req.multiTenant.organizationId;
    const { id } = req.params;
    const { status, comments } = req.body; // 'APPROVED' or 'REJECTED'
    const approverId = req.user.id;

    const result = await EstimateService.approveEstimate(id, organizationId, approverId, status, comments);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Estimate not found'
      });
    }

    res.json({
      success: true,
      data: result,
      message: `Estimate ${status.toLowerCase()} successfully`
    });
  } catch (error) {
    console.error('Error processing approval:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process approval',
      error: error.message
    });
  }
});

// Convert estimate to project
router.post('/:id/convert-to-project', async (req, res) => {
  try {
    const organizationId = req.multiTenant.organizationId;
    const { id } = req.params;
    const creatorId = req.user.id;

    const project = await EstimateService.convertToProject(id, organizationId, creatorId);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Estimate not found or cannot be converted'
      });
    }

    res.status(201).json({
      success: true,
      data: project,
      message: 'Estimate converted to project successfully'
    });
  } catch (error) {
    console.error('Error converting to project:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to convert to project',
      error: error.message
    });
  }
});

// Line Items Management
router.get('/:id/line-items', async (req, res) => {
  try {
    const organizationId = req.multiTenant.organizationId;
    const { id } = req.params;

    const lineItems = await EstimateService.getLineItems(id, organizationId);

    res.json({
      success: true,
      data: lineItems
    });
  } catch (error) {
    console.error('Error fetching line items:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch line items',
      error: error.message
    });
  }
});

router.post('/:id/line-items', async (req, res) => {
  try {
    const organizationId = req.multiTenant.organizationId;
    const { id } = req.params;

    const lineItem = await EstimateService.addLineItem(id, req.body, organizationId);

    res.status(201).json({
      success: true,
      data: lineItem,
      message: 'Line item added successfully'
    });
  } catch (error) {
    console.error('Error adding line item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add line item',
      error: error.message
    });
  }
});

router.put('/:id/line-items/:lineItemId', async (req, res) => {
  try {
    const organizationId = req.multiTenant.organizationId;
    const { id, lineItemId } = req.params;

    const lineItem = await EstimateService.updateLineItem(lineItemId, req.body, organizationId);

    if (!lineItem) {
      return res.status(404).json({
        success: false,
        message: 'Line item not found'
      });
    }

    res.json({
      success: true,
      data: lineItem,
      message: 'Line item updated successfully'
    });
  } catch (error) {
    console.error('Error updating line item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update line item',
      error: error.message
    });
  }
});

router.delete('/:id/line-items/:lineItemId', async (req, res) => {
  try {
    const organizationId = req.multiTenant.organizationId;
    const { lineItemId } = req.params;

    const deleted = await EstimateService.deleteLineItem(lineItemId, organizationId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Line item not found'
      });
    }

    res.json({
      success: true,
      message: 'Line item deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting line item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete line item',
      error: error.message
    });
  }
});

// Catalog Items Management
router.get('/catalog/items', async (req, res) => {
  try {
    const organizationId = req.multiTenant.organizationId;
    const { category, search, page = 1, limit = 50 } = req.query;

    const filters = {
      organizationId,
      isActive: true,
      ...(category && { category }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } }
        ]
      })
    };

    const catalogItems = await EstimateService.getCatalogItems(filters, {
      page: parseInt(page),
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      data: catalogItems
    });
  } catch (error) {
    console.error('Error fetching catalog items:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch catalog items',
      error: error.message
    });
  }
});

router.post('/catalog/items', async (req, res) => {
  try {
    const organizationId = req.multiTenant.organizationId;
    const createdById = req.user.id;

    const catalogItemData = {
      ...req.body,
      organizationId,
      createdById
    };

    const catalogItem = await EstimateService.createCatalogItem(catalogItemData);

    res.status(201).json({
      success: true,
      data: catalogItem,
      message: 'Catalog item created successfully'
    });
  } catch (error) {
    console.error('Error creating catalog item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create catalog item',
      error: error.message
    });
  }
});

router.put('/catalog/items/:itemId', async (req, res) => {
  try {
    const organizationId = req.multiTenant.organizationId;
    const { itemId } = req.params;

    const catalogItem = await EstimateService.updateCatalogItem(itemId, req.body, organizationId);

    if (!catalogItem) {
      return res.status(404).json({
        success: false,
        message: 'Catalog item not found'
      });
    }

    res.json({
      success: true,
      data: catalogItem,
      message: 'Catalog item updated successfully'
    });
  } catch (error) {
    console.error('Error updating catalog item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update catalog item',
      error: error.message
    });
  }
});

router.delete('/catalog/items/:itemId', async (req, res) => {
  try {
    const organizationId = req.multiTenant.organizationId;
    const { itemId } = req.params;

    const deleted = await EstimateService.deleteCatalogItem(itemId, organizationId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Catalog item not found'
      });
    }

    res.json({
      success: true,
      message: 'Catalog item deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting catalog item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete catalog item',
      error: error.message
    });
  }
});

// Payment Management
router.get('/:id/payments', async (req, res) => {
  try {
    const organizationId = req.multiTenant.organizationId;
    const { id } = req.params;

    const payments = await PaymentService.getEstimatePayments(id, organizationId);

    res.json({
      success: true,
      data: payments
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payments',
      error: error.message
    });
  }
});

router.post('/:id/payments', async (req, res) => {
  try {
    const organizationId = req.multiTenant.organizationId;
    const { id } = req.params;

    const paymentData = {
      ...req.body,
      estimateId: id,
      organizationId
    };

    const payment = await PaymentService.createPayment(paymentData);

    res.status(201).json({
      success: true,
      data: payment,
      message: 'Payment created successfully'
    });
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment',
      error: error.message
    });
  }
});

export default router; 