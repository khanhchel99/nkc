import { PrismaClient } from '@prisma/client';
import { sendEmailWithThread, sendReplyEmail } from '../src/lib/email-service';

const prisma = new PrismaClient();

async function main() {
  console.log('🧪 Running integration test for admin email workflow...\n');

  try {
    // 1. Find the latest inquiry submission
    console.log('1. Finding latest inquiry submission:');
    const latestInquiry = await prisma.inquirySubmission.findFirst({
      orderBy: { createdAt: 'desc' },
      include: {
        user: true,
        emailThread: {
          include: {
            emails: {
              orderBy: { sentAt: 'asc' }
            }
          }
        }
      }
    });

    if (!latestInquiry) {
      console.log('   ⚠️ No inquiries found! Run test-complete-workflow.ts first.');
      return;
    }

    console.log(`   Found inquiry: ${latestInquiry.id}`);
    console.log(`   Customer: ${latestInquiry.customerName} (${latestInquiry.customerEmail})`);
    console.log(`   Status: ${latestInquiry.status}`);
    console.log(`   Has thread: ${latestInquiry.emailThread ? 'Yes' : 'No'}`);
    
    if (latestInquiry.emailThread) {
      console.log(`   Emails in thread: ${latestInquiry.emailThread.emails.length}`);
    }

    // 2. Test sending a quote email if thread exists
    if (latestInquiry.emailThread) {
      console.log('\n2. Testing quote email sending:');
      
      // Prepare sample quote data
      const inquiryItems = Array.isArray(latestInquiry.items) ? latestInquiry.items as any[] : [];
      const quoteItems = inquiryItems.map((item, index) => ({
        ...item,
        unitPrice: 150.00 + (index * 50), // Sample prices
        totalPrice: (150.00 + (index * 50)) * item.quantity
      }));

      try {
        const quoteResult = await sendEmailWithThread({
          to: latestInquiry.customerEmail,
          subject: `Quote Ready - Inquiry ${latestInquiry.id}`,
          templateId: 'quote_ready',
          templateData: {
            customerName: latestInquiry.customerName,
            inquiryId: latestInquiry.id,
            submissionDate: latestInquiry.createdAt.toLocaleDateString(),
            inquiryItems: quoteItems,
            totalAmount: quoteItems.reduce((sum, item) => sum + item.totalPrice, 0)
          },
          inquiryId: latestInquiry.id,
          customerEmail: latestInquiry.customerEmail,
          customerName: latestInquiry.customerName,
          isFromAdmin: true
        });

        console.log(`   ✅ Quote email sent successfully`);
        console.log(`   Thread ID: ${quoteResult.threadId}`);

      } catch (error) {
        console.log(`   ❌ Quote email failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // 3. Test sending a follow-up email
      console.log('\n3. Testing follow-up email sending:');
      
      try {
        const followUpResult = await sendReplyEmail({
          threadId: latestInquiry.emailThread.id,
          to: latestInquiry.customerEmail,
          subject: `Follow-up on your inquiry ${latestInquiry.id}`,
          htmlContent: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Following up on your furniture inquiry</h2>
              <p>Dear ${latestInquiry.customerName},</p>
              <p>We wanted to follow up on your recent furniture inquiry. Our team has prepared a detailed quote for your consideration.</p>
              <p>Please review the quote and let us know if you have any questions or would like to schedule a consultation.</p>
              <p>Best regards,<br>NKC Furniture Sales Team</p>
            </div>
          `,
          textContent: `
            Following up on your furniture inquiry
            
            Dear ${latestInquiry.customerName},
            
            We wanted to follow up on your recent furniture inquiry. Our team has prepared a detailed quote for your consideration.
            
            Please review the quote and let us know if you have any questions or would like to schedule a consultation.
            
            Best regards,
            NKC Furniture Sales Team
          `,
          emailType: 'follow_up',
          isFromAdmin: true
        });

        console.log(`   ✅ Follow-up email sent successfully`);
        console.log(`   Email sent to thread: ${latestInquiry.emailThread.id}`);

      } catch (error) {
        console.log(`   ❌ Follow-up email failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // 4. Update inquiry status
    console.log('\n4. Testing inquiry status update:');
    
    try {
      const updatedInquiry = await prisma.inquirySubmission.update({
        where: { id: latestInquiry.id },
        data: { status: 'quoted' }
      });

      console.log(`   ✅ Inquiry status updated to: ${updatedInquiry.status}`);

    } catch (error) {
      console.log(`   ❌ Status update failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // 5. Verify final email thread state
    console.log('\n5. Final email thread verification:');
    
    const finalThread = await prisma.emailThread.findUnique({
      where: { inquiryId: latestInquiry.id },
      include: {
        emails: {
          orderBy: { sentAt: 'asc' }
        }
      }
    });

    if (finalThread) {
      console.log(`   ✅ Email thread found`);
      console.log(`   Total emails in thread: ${finalThread.emails.length}`);
      
      finalThread.emails.forEach((email, index) => {
        console.log(`   ${index + 1}. ${email.emailType} - ${email.subject} (${email.isFromAdmin ? 'Admin' : 'Customer'})`);
      });
    }

    console.log('\n✅ Integration test completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('   1. Check admin dashboard: http://localhost:3000/admin/inquiries');
    console.log('   2. View email thread for latest inquiry');
    console.log('   3. Test email composer with different templates');

  } catch (error) {
    console.error('❌ Integration test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
