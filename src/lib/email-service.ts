import { db } from '@/server/db';
import { emailTemplates, getTemplate, renderTemplate } from './email-templates';
import { v4 as uuidv4 } from 'uuid';

interface SendEmailParams {
  to: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  emailThreadId?: string; // Database ID of EmailThread record
  emailType: string;
  isFromAdmin?: boolean;
}

interface CreateEmailThreadParams {
  inquiryId: string;
  customerEmail: string;
  customerName: string;
  subject: string;
}

interface SendEmailWithThreadParams {
  to: string;
  subject: string;
  templateId: string;
  templateData: Record<string, any>;
  inquiryId: string;
  customerEmail: string;
  customerName: string;
  isFromAdmin?: boolean;
}

// Send email via API
export async function sendEmail({
  to,
  subject,
  htmlContent,
  textContent,
  emailThreadId,
  emailType,
  isFromAdmin = false,
}: SendEmailParams) {
  try {
    const response = await fetch('http://localhost:3000/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to,
        subject,
        htmlContent,
        textContent,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (result.success) {
      // Save email to database
      if (emailThreadId) {
        await db.email.create({
          data: {
            threadId: emailThreadId,
            messageId: result.messageId || `msg-${uuidv4()}`,
            fromEmail: process.env.EMAIL_FROM || 'sales@nkcfurniture.com',
            toEmail: to,
            subject,
            htmlContent,
            textContent,
            emailType,
            isFromAdmin,
          }
        });
      }

      return result;
    } else {
      throw new Error(result.error || 'Failed to send email');
    }
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

// Create a new email thread
export async function createEmailThread({
  inquiryId,
  customerEmail,
  customerName,
  subject,
}: CreateEmailThreadParams) {
  try {
    const emailThread = await db.emailThread.create({
      data: {
        inquiryId,
        customerEmail,
        customerName,
        subject,
        threadId: uuidv4(),
      }
    });

    return emailThread;
  } catch (error) {
    console.error('Error creating email thread:', error);
    throw error;
  }
}

// Send email and create thread if it doesn't exist
export async function sendEmailWithThread({
  to,
  subject,
  templateId,
  templateData,
  inquiryId,
  customerEmail,
  customerName,
  isFromAdmin = false,
}: SendEmailWithThreadParams) {
  try {
    // Check if thread already exists for this inquiry
    let emailThread = await db.emailThread.findUnique({
      where: { inquiryId }
    });

    // Create thread if it doesn't exist
    if (!emailThread) {
      emailThread = await createEmailThread({
        inquiryId,
        customerEmail,
        customerName,
        subject,
      });
    }

    // Get the template
    const template = getTemplate(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    // Render the template
    const { html: htmlContent, text: textContent } = renderTemplate(template, templateData);

    // Send the email
    const result = await sendEmail({
      to,
      subject,
      htmlContent,
      textContent,
      emailThreadId: emailThread.id,
      emailType: templateId,
      isFromAdmin,
    });

    return {
      ...result,
      threadId: emailThread.id,
    };
  } catch (error) {
    console.error('Error sending email with thread:', error);
    throw error;
  }
}

// Send inquiry acknowledgment email
export async function sendInquiryAcknowledgment({
  inquiry,
  user,
}: {
  inquiry: any;
  user: any;
}) {
  try {
    const templateData = {
      customerName: user.name || 'Valued Customer',
      inquiryId: inquiry.id,
      companyName: inquiry.company || 'Not specified',
      message: inquiry.message,
      productsCount: inquiry.inquiryListItems?.length || 0,
      submissionDate: inquiry.createdAt.toLocaleDateString(),
    };

    return await sendEmailWithThread({
      to: user.email!,
      subject: `Inquiry Acknowledgment - ${inquiry.id}`,
      templateId: 'inquiry_acknowledgment',
      templateData,
      inquiryId: inquiry.id,
      customerEmail: user.email!,
      customerName: user.name || 'Valued Customer',
      isFromAdmin: false,
    });
  } catch (error) {
    console.error('Error sending inquiry acknowledgment:', error);
    throw error;
  }
}

// Get email thread with messages
export async function getEmailThread(inquiryId: string) {
  try {
    const emailThread = await db.emailThread.findUnique({
      where: { inquiryId },
      include: {
        emails: {
          orderBy: { sentAt: 'asc' }
        },
        inquiry: {
          include: {
            user: true
          }
        }
      }
    });

    return emailThread;
  } catch (error) {
    console.error('Error getting email thread:', error);
    throw error;
  }
}

// Send reply email in existing thread
export async function sendReplyEmail({
  threadId,
  to,
  subject,
  htmlContent,
  textContent,
  emailType,
  isFromAdmin = true,
}: {
  threadId: string;
  to: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  emailType: string;
  isFromAdmin?: boolean;
}) {
  try {
    // Find the thread
    const emailThread = await db.emailThread.findUnique({
      where: { id: threadId }
    });

    if (!emailThread) {
      throw new Error('Email thread not found');
    }

    // Send the email
    const result = await sendEmail({
      to,
      subject: `Re: ${subject}`,
      htmlContent,
      textContent,
      emailThreadId: threadId,
      emailType,
      isFromAdmin,
    });

    return result;
  } catch (error) {
    console.error('Error sending reply email:', error);
    throw error;
  }
}
