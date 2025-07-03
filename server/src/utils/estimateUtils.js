/**
 * Calculate estimate totals including subtotal, tax, discount, and final total
 */
function calculateEstimateTotals(lineItems, taxRate = 0, discountType = 'NONE', discountValue = 0) {
  // Calculate subtotal from line items
  const subtotal = lineItems.reduce((sum, item) => {
    const itemTotal = parseFloat(item.quantity) * parseFloat(item.unitPrice);
    return sum + itemTotal;
  }, 0);

  // Calculate discount
  let discountAmount = 0;
  if (discountType === 'PERCENTAGE' && discountValue > 0) {
    discountAmount = subtotal * (parseFloat(discountValue) / 100);
  } else if (discountType === 'FIXED_AMOUNT' && discountValue > 0) {
    discountAmount = Math.min(parseFloat(discountValue), subtotal); // Can't discount more than subtotal
  }

  // Calculate tax on discounted amount
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = taxableAmount * (parseFloat(taxRate) / 100);

  // Calculate final total
  const total = subtotal - discountAmount + taxAmount;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    discount: Math.round(discountAmount * 100) / 100,
    tax: Math.round(taxAmount * 100) / 100,
    total: Math.round(total * 100) / 100
  };
}

/**
 * Generate estimate number with format EST-YYYY-NNNN
 */
function generateEstimateNumber(sequence = 1) {
  const year = new Date().getFullYear();
  const paddedSequence = sequence.toString().padStart(4, '0');
  return `EST-${year}-${paddedSequence}`;
}

/**
 * Validate estimate data before creation/update
 */
function validateEstimateData(data) {
  const errors = [];

  // Required fields
  if (!data.title || data.title.trim() === '') {
    errors.push('Title is required');
  }

  if (!data.clientId) {
    errors.push('Client is required');
  }

  // Validate line items
  if (!data.lineItems || !Array.isArray(data.lineItems) || data.lineItems.length === 0) {
    errors.push('At least one line item is required');
  } else {
    data.lineItems.forEach((item, index) => {
      if (!item.description || item.description.trim() === '') {
        errors.push(`Line item ${index + 1}: Description is required`);
      }
      
      if (!item.quantity || parseFloat(item.quantity) <= 0) {
        errors.push(`Line item ${index + 1}: Quantity must be greater than 0`);
      }
      
      if (!item.unitPrice || parseFloat(item.unitPrice) <= 0) {
        errors.push(`Line item ${index + 1}: Unit price must be greater than 0`);
      }
    });
  }

  // Validate tax rate
  if (data.taxRate && (parseFloat(data.taxRate) < 0 || parseFloat(data.taxRate) > 100)) {
    errors.push('Tax rate must be between 0 and 100');
  }

  // Validate discount
  if (data.discountType === 'PERCENTAGE' && data.discountValue) {
    if (parseFloat(data.discountValue) < 0 || parseFloat(data.discountValue) > 100) {
      errors.push('Discount percentage must be between 0 and 100');
    }
  } else if (data.discountType === 'FIXED_AMOUNT' && data.discountValue) {
    if (parseFloat(data.discountValue) < 0) {
      errors.push('Discount amount must be greater than or equal to 0');
    }
  }

  // Validate valid until date
  if (data.validUntil && new Date(data.validUntil) <= new Date()) {
    errors.push('Valid until date must be in the future');
  }

  return errors;
}

/**
 * Format currency for display
 */
function formatCurrency(amount, currency = 'USD', locale = 'en-US') {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency
  }).format(amount);
}

/**
 * Calculate estimate acceptance rate for analytics
 */
function calculateAcceptanceRate(acceptedCount, sentCount) {
  if (sentCount === 0) return 0;
  return Math.round((acceptedCount / sentCount) * 100 * 100) / 100; // Round to 2 decimal places
}

/**
 * Check if estimate is expired
 */
function isEstimateExpired(estimate) {
  if (!estimate.validUntil) return false;
  return new Date(estimate.validUntil) < new Date();
}

/**
 * Get estimate status display information
 */
function getEstimateStatusInfo(status) {
  const statusMap = {
    DRAFT: {
      label: 'Draft',
      color: 'gray',
      description: 'Estimate is being prepared'
    },
    SENT: {
      label: 'Sent',
      color: 'blue',
      description: 'Estimate has been sent to client'
    },
    ACCEPTED: {
      label: 'Accepted',
      color: 'green',
      description: 'Client has accepted the estimate'
    },
    REJECTED: {
      label: 'Rejected',
      color: 'red',
      description: 'Client has rejected the estimate'
    },
    EXPIRED: {
      label: 'Expired',
      color: 'orange',
      description: 'Estimate has passed its valid until date'
    }
  };

  return statusMap[status] || {
    label: status,
    color: 'gray',
    description: 'Unknown status'
  };
}

/**
 * Generate estimate summary text
 */
function generateEstimateSummary(estimate) {
  const lineItemCount = estimate.lineItems?.length || 0;
  const clientName = estimate.client?.name || 'Unknown Client';
  const totalAmount = formatCurrency(estimate.totalAmount);
  
  return `${lineItemCount} item${lineItemCount !== 1 ? 's' : ''} for ${clientName} - ${totalAmount}`;
}

/**
 * Prepare estimate data for email templates
 */
function prepareEstimateForEmail(estimate, organization) {
  return {
    estimateNumber: estimate.estimateNumber,
    title: estimate.title,
    description: estimate.description,
    client: {
      name: estimate.client.name,
      email: estimate.client.email
    },
    organization: {
      name: organization.name,
      logo: organization.logo,
      primaryColor: organization.primaryColor
    },
    amounts: {
      subtotal: formatCurrency(estimate.subtotal),
      taxAmount: formatCurrency(estimate.taxAmount),
      discountAmount: formatCurrency(estimate.discountAmount),
      totalAmount: formatCurrency(estimate.totalAmount)
    },
    lineItems: estimate.lineItems.map(item => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: formatCurrency(item.unitPrice),
      totalPrice: formatCurrency(item.totalPrice)
    })),
    validUntil: estimate.validUntil ? new Date(estimate.validUntil).toLocaleDateString() : null,
    portalUrl: estimate.portalUrl,
    terms: estimate.terms,
    notes: estimate.notes
  };
}

/**
 * Calculate time until estimate expires
 */
function getTimeUntilExpiration(estimate) {
  if (!estimate.validUntil) return null;
  
  const now = new Date();
  const expiration = new Date(estimate.validUntil);
  const timeDiff = expiration.getTime() - now.getTime();
  
  if (timeDiff <= 0) return { expired: true };
  
  const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  return {
    expired: false,
    days,
    hours,
    totalHours: Math.floor(timeDiff / (1000 * 60 * 60))
  };
}

export {
  calculateEstimateTotals,
  generateEstimateNumber,
  validateEstimateData,
  formatCurrency,
  calculateAcceptanceRate,
  isEstimateExpired,
  getEstimateStatusInfo,
  generateEstimateSummary,
  prepareEstimateForEmail,
  getTimeUntilExpiration
}; 