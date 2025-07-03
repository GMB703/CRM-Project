import nodemailer from 'nodemailer';
import { PrismaClient } from '@prisma/client';
import path from 'path';

const prisma = new PrismaClient();

class EmailService {
  static async createTransporter() {
    // Configure based on environment variables
    const emailConfig = {
      host: process.env.SMTP_HOST || 'localhost',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    };

    // For development, use Ethereal Email (test account)
    if (process.env.NODE_ENV === 'development' && !process.env.SMTP_HOST) {
      const testAccount = await nodemailer.createTestAccount();
      
      emailConfig.host = 'smtp.ethereal.email';
      emailConfig.port = 587;
      emailConfig.secure = false;
      emailConfig.auth = {
        user: testAccount.user,
        pass: testAccount.pass
      };
    }

    return nodemailer.createTransporter(emailConfig);
  }

  static async sendEstimate({
    estimate,
    recipientEmail,
    subject,
    message,
    pdfPath,
    senderId
  }) {
    try {
      const transporter = await this.createTransporter();
      
      // Default subject if not provided
      const emailSubject = subject || `Estimate ${estimate.referenceNumber} from ${estimate.organization?.name || 'Your Company'}`;
      
      // Generate email content
      const emailContent = this.generateEstimateEmailHTML({
        estimate,
        message,
        organizationName: estimate.organization?.name || 'Your Company'
      });

      const mailOptions = {
        from: `"${estimate.organization?.name || 'Your Company'}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
        to: recipientEmail,
        subject: emailSubject,
        html: emailContent,
        attachments: []
      };

      // Attach PDF if provided
      if (pdfPath) {
        const fullPDFPath = path.join(process.cwd(), 'uploads', pdfPath);
        mailOptions.attachments.push({
          filename: `estimate-${estimate.referenceNumber}.pdf`,
          path: fullPDFPath
        });
      }

      // Send email
      const info = await transporter.sendMail(mailOptions);

      // Log email in database
      await this.logEmail({
        estimateId: estimate.id,
        recipientEmail,
        subject: emailSubject,
        content: message || '',
        senderId,
        status: 'SENT',
        messageId: info.messageId
      });

      // For development, log the preview URL
      if (process.env.NODE_ENV === 'development' && !process.env.SMTP_HOST) {
        console.log('📧 Email sent! Preview URL:', nodemailer.getTestMessageUrl(info));
      }

      return {
        success: true,
        messageId: info.messageId,
        previewUrl: process.env.NODE_ENV === 'development' ? nodemailer.getTestMessageUrl(info) : null
      };
    } catch (error) {
      console.error('Error sending email:', error);
      
      // Log failed email attempt
      await this.logEmail({
        estimateId: estimate.id,
        recipientEmail,
        subject: subject || `Estimate ${estimate.referenceNumber}`,
        content: message || '',
        senderId,
        status: 'FAILED',
        error: error.message
      });

      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  static async logEmail({
    estimateId,
    recipientEmail,
    subject,
    content,
    senderId,
    status,
    messageId = null,
    error = null
  }) {
    try {
      await prisma.estimateEmailLog.create({
        data: {
          estimateId,
          recipientEmail,
          subject,
          content,
          senderId,
          status,
          messageId,
          error,
          sentAt: new Date()
        }
      });
    } catch (logError) {
      console.error('Error logging email:', logError);
    }
  }

  static generateEstimateEmailHTML({ estimate, message, organizationName }) {
    const customMessage = message ? `
      <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 30px; border-left: 4px solid #2563eb;">
        <h3 style="color: #1f2937; margin-bottom: 10px;">Message from ${organizationName}</h3>
        <p style="color: #4b5563; line-height: 1.6; margin: 0;">${message.replace(/\n/g, '<br>')}</p>
      </div>
    ` : '';

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Estimate ${estimate.referenceNumber}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f7fafc;
            margin: 0;
            padding: 20px;
        }
        
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .header {
            background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
        }
        
        .header p {
            margin: 10px 0 0 0;
            opacity: 0.9;
            font-size: 16px;
        }
        
        .content {
            padding: 30px;
        }
        
        .estimate-info {
            background-color: #f8fafc;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 30px;
        }
        
        .estimate-info h2 {
            color: #1f2937;
            margin: 0 0 15px 0;
            font-size: 20px;
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
        }
        
        .info-item {
            display: flex;
            flex-direction: column;
        }
        
        .info-label {
            font-size: 12px;
            color: #6b7280;
            text-transform: uppercase;
            font-weight: 600;
            margin-bottom: 4px;
        }
        
        .info-value {
            color: #1f2937;
            font-weight: 500;
        }
        
        .total-section {
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            margin-bottom: 30px;
        }
        
        .total-amount {
            font-size: 36px;
            font-weight: bold;
            color: #2563eb;
            margin: 10px 0;
        }
        
        .total-label {
            color: #6b7280;
            font-size: 14px;
            text-transform: uppercase;
            font-weight: 600;
        }
        
        .cta-section {
            text-align: center;
            margin-bottom: 30px;
        }
        
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
            color: white;
            padding: 15px 30px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 600;
            font-size: 16px;
            box-shadow: 0 4px 6px rgba(37, 99, 235, 0.2);
            transition: transform 0.2s ease;
        }
        
        .cta-button:hover {
            transform: translateY(-2px);
        }
        
        .footer {
            background-color: #f8fafc;
            padding: 20px 30px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
        }
        
        .footer p {
            margin: 5px 0;
            color: #6b7280;
            font-size: 14px;
        }
        
        .company-name {
            color: #2563eb;
            font-weight: 600;
        }
        
        @media (max-width: 600px) {
            .info-grid {
                grid-template-columns: 1fr;
            }
            
            .total-amount {
                font-size: 28px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>New Estimate</h1>
            <p>You have received an estimate from ${organizationName}</p>
        </div>
        
        <div class="content">
            ${customMessage}
            
            <div class="estimate-info">
                <h2>Estimate Details</h2>
                <div class="info-grid">
                    <div class="info-item">
                        <div class="info-label">Estimate Number</div>
                        <div class="info-value">${estimate.referenceNumber}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Date</div>
                        <div class="info-value">${new Date(estimate.createdAt).toLocaleDateString()}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Title</div>
                        <div class="info-value">${estimate.title || 'Service Estimate'}</div>
                    </div>
                    ${estimate.validUntil ? `
                    <div class="info-item">
                        <div class="info-label">Valid Until</div>
                        <div class="info-value">${new Date(estimate.validUntil).toLocaleDateString()}</div>
                    </div>
                    ` : ''}
                </div>
            </div>
            
            <div class="total-section">
                <div class="total-label">Total Amount</div>
                <div class="total-amount">$${(estimate.total || estimate.subtotal || 0).toFixed(2)}</div>
                ${estimate.lineItems && estimate.lineItems.length > 0 ? `
                <p style="color: #6b7280; margin: 10px 0 0 0;">
                    ${estimate.lineItems.length} item${estimate.lineItems.length !== 1 ? 's' : ''} included
                </p>
                ` : ''}
            </div>
            
            <div class="cta-section">
                <p style="color: #6b7280; margin-bottom: 20px;">
                    Please find the detailed estimate attached as a PDF document.
                </p>
                ${estimate.portalUrl ? `
                <a href="${estimate.portalUrl}" class="cta-button">
                    View Online
                </a>
                ` : ''}
            </div>
            
            ${estimate.terms ? `
            <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <h3 style="color: #1f2937; margin: 0 0 10px 0; font-size: 16px;">Terms & Conditions</h3>
                <p style="color: #6b7280; margin: 0; font-size: 14px; line-height: 1.6;">
                    ${estimate.terms.replace(/\n/g, '<br>')}
                </p>
            </div>
            ` : ''}
        </div>
        
        <div class="footer">
            <p>This estimate was sent by <span class="company-name">${organizationName}</span></p>
            <p>If you have any questions, please don't hesitate to contact us.</p>
        </div>
    </div>
</body>
</html>
    `;
  }

  static async sendApprovalNotification({
    estimate,
    approver,
    status,
    comments
  }) {
    try {
      const transporter = await this.createTransporter();
      
      const subject = `Estimate ${estimate.referenceNumber} ${status === 'APPROVED' ? 'Approved' : 'Rejected'}`;
      
      const emailContent = this.generateApprovalNotificationHTML({
        estimate,
        approver,
        status,
        comments
      });

      const mailOptions = {
        from: `"${estimate.organization?.name || 'Your Company'}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
        to: estimate.creator.email,
        subject,
        html: emailContent
      };

      const info = await transporter.sendMail(mailOptions);

      return {
        success: true,
        messageId: info.messageId
      };
    } catch (error) {
      console.error('Error sending approval notification:', error);
      throw new Error(`Failed to send approval notification: ${error.message}`);
    }
  }

  static generateApprovalNotificationHTML({ estimate, approver, status, comments }) {
    const isApproved = status === 'APPROVED';
    const statusColor = isApproved ? '#059669' : '#dc2626';
    const statusBg = isApproved ? '#d1fae5' : '#fee2e2';

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Estimate ${status}</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f7fafc; margin: 0; padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <div style="background: ${statusBg}; color: ${statusColor}; padding: 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px; font-weight: 600;">
                Estimate ${isApproved ? 'Approved' : 'Rejected'}
            </h1>
            <p style="margin: 10px 0 0 0; font-size: 16px;">
                ${estimate.referenceNumber}
            </p>
        </div>
        
        <div style="padding: 30px;">
            <p>Hello ${estimate.creator.firstName},</p>
            
            <p>Your estimate <strong>${estimate.referenceNumber}</strong> has been <strong>${status.toLowerCase()}</strong> by ${approver.firstName} ${approver.lastName}.</p>
            
            ${comments ? `
            <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${statusColor};">
                <h3 style="color: #1f2937; margin: 0 0 10px 0;">Comments:</h3>
                <p style="color: #4b5563; margin: 0;">${comments.replace(/\n/g, '<br>')}</p>
            </div>
            ` : ''}
            
            <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h3 style="color: #1f2937; margin: 0 0 15px 0;">Estimate Summary</h3>
                <p style="margin: 5px 0;"><strong>Title:</strong> ${estimate.title}</p>
                <p style="margin: 5px 0;"><strong>Client:</strong> ${estimate.client.firstName} ${estimate.client.lastName}</p>
                <p style="margin: 5px 0;"><strong>Total Amount:</strong> $${(estimate.total || estimate.subtotal || 0).toFixed(2)}</p>
            </div>
            
            ${isApproved ? `
            <p>You can now send this estimate to your client or convert it to a project.</p>
            ` : `
            <p>Please review the comments and make necessary adjustments before resubmitting.</p>
            `}
        </div>
        
        <div style="background-color: #f8fafc; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">
                This notification was sent automatically by ${estimate.organization?.name || 'Your Company'}
            </p>
        </div>
    </div>
</body>
</html>
    `;
  }
}

export default EmailService; 