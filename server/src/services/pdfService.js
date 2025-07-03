import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';

class PDFService {
  static async generateEstimatePDF(estimate) {
    let browser;
    
    try {
      // Launch Puppeteer
      browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      const page = await browser.newPage();
      
      // Generate HTML content
      const htmlContent = this.generateEstimateHTML(estimate);
      
      // Set content and generate PDF
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
      
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm'
        }
      });
      
      return pdfBuffer;
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw new Error(`Failed to generate PDF: ${error.message}`);
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  static async saveEstimatePDF(estimate, pdfBuffer) {
    try {
      // Create uploads directory if it doesn't exist
      const uploadsDir = path.join(process.cwd(), 'uploads', 'estimates');
      await fs.mkdir(uploadsDir, { recursive: true });
      
      // Generate filename
      const filename = `estimate-${estimate.referenceNumber}-${Date.now()}.pdf`;
      const filePath = path.join(uploadsDir, filename);
      
      // Save PDF file
      await fs.writeFile(filePath, pdfBuffer);
      
      // Return relative path for database storage
      return `estimates/${filename}`;
    } catch (error) {
      console.error('Error saving PDF:', error);
      throw new Error(`Failed to save PDF: ${error.message}`);
    }
  }

  static getFullPDFPath(relativePath) {
    return path.join(process.cwd(), 'uploads', relativePath);
  }

  static generateEstimateHTML(estimate) {
    // Calculate totals
    const subtotal = estimate.lineItems.reduce((sum, item) => sum + (item.total || 0), 0);
    const taxAmount = subtotal * (estimate.taxRate / 100);
    const discountAmount = estimate.discountType === 'PERCENTAGE' 
      ? subtotal * (estimate.discountValue / 100)
      : estimate.discountValue || 0;
    const total = subtotal + taxAmount - discountAmount;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Estimate ${estimate.referenceNumber}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background: white;
        }
        
        .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 40px;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 20px;
        }
        
        .company-info {
            flex: 1;
        }
        
        .company-name {
            font-size: 28px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 10px;
        }
        
        .company-details {
            color: #666;
            font-size: 14px;
        }
        
        .estimate-info {
            text-align: right;
            flex: 1;
        }
        
        .estimate-title {
            font-size: 24px;
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 10px;
        }
        
        .estimate-number {
            font-size: 18px;
            color: #2563eb;
            font-weight: 600;
            margin-bottom: 5px;
        }
        
        .estimate-date {
            color: #666;
            font-size: 14px;
        }
        
        .client-section {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
        }
        
        .client-info, .project-info {
            flex: 1;
            margin-right: 20px;
        }
        
        .section-title {
            font-size: 16px;
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 10px;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 5px;
        }
        
        .client-details, .project-details {
            font-size: 14px;
            color: #666;
        }
        
        .line-items {
            margin-bottom: 30px;
        }
        
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        
        .items-table th {
            background-color: #f8fafc;
            color: #374151;
            font-weight: 600;
            padding: 12px 8px;
            text-align: left;
            border-bottom: 2px solid #e5e7eb;
            font-size: 14px;
        }
        
        .items-table td {
            padding: 12px 8px;
            border-bottom: 1px solid #e5e7eb;
            font-size: 14px;
        }
        
        .items-table tbody tr:hover {
            background-color: #f9fafb;
        }
        
        .text-right {
            text-align: right;
        }
        
        .text-center {
            text-align: center;
        }
        
        .totals-section {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 30px;
        }
        
        .totals-table {
            width: 300px;
        }
        
        .totals-table td {
            padding: 8px 12px;
            border-bottom: 1px solid #e5e7eb;
        }
        
        .totals-table .total-row {
            font-weight: bold;
            font-size: 16px;
            background-color: #f8fafc;
            border-top: 2px solid #2563eb;
        }
        
        .terms-section {
            margin-bottom: 30px;
        }
        
        .terms-content {
            background-color: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #2563eb;
            font-size: 14px;
            line-height: 1.6;
        }
        
        .footer {
            text-align: center;
            color: #666;
            font-size: 12px;
            border-top: 1px solid #e5e7eb;
            padding-top: 20px;
        }
        
        .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
        }
        
        .status-draft {
            background-color: #fef3c7;
            color: #92400e;
        }
        
        .status-sent {
            background-color: #dbeafe;
            color: #1e40af;
        }
        
        .status-approved {
            background-color: #d1fae5;
            color: #065f46;
        }
        
        .status-rejected {
            background-color: #fee2e2;
            color: #991b1b;
        }
        
        .validity-info {
            background-color: #fffbeb;
            border: 1px solid #fbbf24;
            border-radius: 6px;
            padding: 12px;
            margin-bottom: 20px;
            font-size: 14px;
        }
        
        .validity-info strong {
            color: #92400e;
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <div class="company-info">
                <div class="company-name">${estimate.organization?.name || 'Company Name'}</div>
                <div class="company-details">
                    ${estimate.organization?.settings?.address || 'Company Address'}<br>
                    ${estimate.organization?.settings?.phone || 'Phone Number'}<br>
                    ${estimate.organization?.settings?.email || 'Email Address'}
                </div>
            </div>
            <div class="estimate-info">
                <div class="estimate-title">ESTIMATE</div>
                <div class="estimate-number">${estimate.referenceNumber}</div>
                <div class="estimate-date">
                    Date: ${new Date(estimate.createdAt).toLocaleDateString()}<br>
                    ${estimate.validUntil ? `Valid Until: ${new Date(estimate.validUntil).toLocaleDateString()}` : ''}
                </div>
                <div style="margin-top: 10px;">
                    <span class="status-badge status-${estimate.status.toLowerCase()}">${estimate.status}</span>
                </div>
            </div>
        </div>

        <!-- Client and Project Information -->
        <div class="client-section">
            <div class="client-info">
                <div class="section-title">Bill To</div>
                <div class="client-details">
                    <strong>${estimate.client.firstName} ${estimate.client.lastName}</strong><br>
                    ${estimate.client.email}<br>
                    ${estimate.client.phone || ''}<br>
                    ${estimate.client.address || ''}
                </div>
            </div>
            ${estimate.project ? `
            <div class="project-info">
                <div class="section-title">Project</div>
                <div class="project-details">
                    <strong>${estimate.project.name}</strong><br>
                    Status: ${estimate.project.status}<br>
                    ${estimate.project.description || ''}
                </div>
            </div>
            ` : ''}
        </div>

        <!-- Estimate Title and Description -->
        ${estimate.title ? `
        <div style="margin-bottom: 20px;">
            <h2 style="color: #1f2937; margin-bottom: 10px;">${estimate.title}</h2>
            ${estimate.description ? `<p style="color: #666; font-size: 14px;">${estimate.description}</p>` : ''}
        </div>
        ` : ''}

        <!-- Validity Notice -->
        ${estimate.validUntil ? `
        <div class="validity-info">
            <strong>⏰ This estimate is valid until ${new Date(estimate.validUntil).toLocaleDateString()}</strong>
        </div>
        ` : ''}

        <!-- Line Items -->
        <div class="line-items">
            <div class="section-title">Items & Services</div>
            <table class="items-table">
                <thead>
                    <tr>
                        <th style="width: 50%;">Description</th>
                        <th style="width: 10%;" class="text-center">Qty</th>
                        <th style="width: 10%;" class="text-center">Unit</th>
                        <th style="width: 15%;" class="text-right">Unit Price</th>
                        <th style="width: 15%;" class="text-right">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${estimate.lineItems.map(item => `
                    <tr>
                        <td>
                            <strong>${item.description}</strong>
                            ${item.category ? `<br><small style="color: #666;">Category: ${item.category}</small>` : ''}
                            ${item.notes ? `<br><small style="color: #666;">${item.notes}</small>` : ''}
                        </td>
                        <td class="text-center">${item.quantity}</td>
                        <td class="text-center">${item.unit || 'ea'}</td>
                        <td class="text-right">$${item.unitPrice.toFixed(2)}</td>
                        <td class="text-right">$${(item.total || 0).toFixed(2)}</td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <!-- Totals -->
        <div class="totals-section">
            <table class="totals-table">
                <tr>
                    <td>Subtotal:</td>
                    <td class="text-right">$${subtotal.toFixed(2)}</td>
                </tr>
                ${estimate.discountValue > 0 ? `
                <tr>
                    <td>Discount ${estimate.discountType === 'PERCENTAGE' ? `(${estimate.discountValue}%)` : ''}:</td>
                    <td class="text-right">-$${discountAmount.toFixed(2)}</td>
                </tr>
                ` : ''}
                ${estimate.taxRate > 0 ? `
                <tr>
                    <td>Tax (${estimate.taxRate}%):</td>
                    <td class="text-right">$${taxAmount.toFixed(2)}</td>
                </tr>
                ` : ''}
                <tr class="total-row">
                    <td>Total:</td>
                    <td class="text-right">$${total.toFixed(2)}</td>
                </tr>
            </table>
        </div>

        <!-- Terms and Conditions -->
        ${estimate.terms ? `
        <div class="terms-section">
            <div class="section-title">Terms & Conditions</div>
            <div class="terms-content">
                ${estimate.terms.replace(/\n/g, '<br>')}
            </div>
        </div>
        ` : ''}

        <!-- Notes -->
        ${estimate.notes ? `
        <div class="terms-section">
            <div class="section-title">Notes</div>
            <div class="terms-content">
                ${estimate.notes.replace(/\n/g, '<br>')}
            </div>
        </div>
        ` : ''}

        <!-- Footer -->
        <div class="footer">
            <p>This estimate was generated on ${new Date().toLocaleDateString()} by ${estimate.organization?.name || 'Your Company'}</p>
            <p>Thank you for your business!</p>
        </div>
    </div>
</body>
</html>
    `;
  }
}

export default PDFService; 