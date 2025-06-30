import { db } from '../src/server/db';
import { sendInquiryAcknowledgment } from '../src/lib/email-service';

async function createMissingEmailThread() {
  try {
    console.log('Creating email thread for previous inquiry...');
    
    // Get the previous inquiry
    const inquiry = await db.inquirySubmission.findUnique({
      where: { id: 'cmcg1egq00001i4m4gpnsp2px' },
      include: {
        user: true
      }
    });
    
    if (!inquiry) {
      throw new Error('Inquiry not found');
    }
    
    console.log('Found inquiry:', inquiry.customerName, inquiry.customerEmail);
    
    // Send acknowledgment email (this will create the thread and email)
    const result = await sendInquiryAcknowledgment({
      inquiry,
      user: inquiry.user,
    });
    
    console.log('Email thread and acknowledgment created successfully:', result);
    
  } catch (error) {
    console.error('Error creating email thread:', error);
  } finally {
    await db.$disconnect();
  }
}

createMissingEmailThread();
