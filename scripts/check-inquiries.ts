import { db } from '../src/server/db';

async function checkInquiriesAndThreads() {
  try {
    console.log('Checking all inquiries and their email threads...');
    
    const inquiries = await db.inquirySubmission.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: true
      }
    });
    
    console.log(`Found ${inquiries.length} inquiries:`);
    for (const inquiry of inquiries) {
      console.log(`\nInquiry ${inquiry.id}:`);
      console.log(`  - Customer: ${inquiry.customerName} (${inquiry.customerEmail})`);
      console.log(`  - Company: ${inquiry.companyName}`);
      console.log(`  - Created: ${inquiry.createdAt}`);
      console.log(`  - Status: ${inquiry.status}`);
      
      // Check if email thread exists for this inquiry
      const emailThread = await db.emailThread.findUnique({
        where: { inquiryId: inquiry.id },
        include: {
          emails: true
        }
      });
      
      if (emailThread) {
        console.log(`  - Email Thread: ${emailThread.id} (${emailThread.emails.length} emails)`);
      } else {
        console.log(`  - Email Thread: NONE`);
      }
    }

  } catch (error) {
    console.error('Error checking inquiries:', error);
  } finally {
    await db.$disconnect();
  }
}

checkInquiriesAndThreads();
