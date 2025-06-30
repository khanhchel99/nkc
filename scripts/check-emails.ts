import { db } from '../src/server/db';

async function checkEmails() {
  try {
    console.log('Checking EmailThread table...');
    const threads = await db.emailThread.findMany({
      include: {
        emails: true,
        inquiry: true
      }
    });
    
    console.log(`Found ${threads.length} email threads:`);
    for (const thread of threads) {
      console.log(`Thread ${thread.id}:`);
      console.log(`  - Inquiry: ${thread.inquiryId}`);
      console.log(`  - Customer: ${thread.customerName} (${thread.customerEmail})`);
      console.log(`  - Subject: ${thread.subject}`);
      console.log(`  - Emails in thread: ${thread.emails.length}`);
      
      for (const email of thread.emails) {
        console.log(`    Email ${email.id}:`);
        console.log(`      - From: ${email.fromEmail}`);
        console.log(`      - To: ${email.toEmail}`);
        console.log(`      - Subject: ${email.subject}`);
        console.log(`      - Type: ${email.emailType}`);
        console.log(`      - From Admin: ${email.isFromAdmin}`);
        console.log(`      - Sent At: ${email.sentAt}`);
      }
      console.log('---');
    }

    console.log('\nChecking Email table directly...');
    const allEmails = await db.email.findMany({
      orderBy: { sentAt: 'desc' }
    });
    
    console.log(`Found ${allEmails.length} total emails in database`);
    for (const email of allEmails) {
      console.log(`Email ${email.id}: ${email.subject} (${email.emailType})`);
    }

  } catch (error) {
    console.error('Error checking emails:', error);
  } finally {
    await db.$disconnect();
  }
}

checkEmails();
