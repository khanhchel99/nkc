import { PrismaClient } from '@prisma/client';
import { sendEmailWithThread } from '../src/lib/email-service';
import { getTemplate } from '../src/lib/email-templates';

const prisma = new PrismaClient();

async function main() {
  console.log('🔬 Running complete workflow test...\n');

  try {
    // 1. Check database connection and counts
    console.log('1. Database Status Check:');
    const [userCount, productCount, inquiryCount, threadCount, emailCount] = await Promise.all([
      prisma.user.count(),
      prisma.product.count(),
      prisma.inquirySubmission.count(),
      prisma.emailThread.count(),
      prisma.email.count(),
    ]);

    console.log(`   Users: ${userCount}`);
    console.log(`   Products: ${productCount}`);
    console.log(`   Inquiry Submissions: ${inquiryCount}`);
    console.log(`   Email Threads: ${threadCount}`);
    console.log(`   Emails: ${emailCount}\n`);

    // 2. Find or create a test wholesale user
    console.log('2. Test User Setup:');
    // First check if wholesale role exists
    const wholesaleRole = await prisma.role.findFirst({
      where: { name: 'wholesale' }
    });

    if (!wholesaleRole) {
      console.log('   ⚠️ No wholesale role found! Creating one...');
      await prisma.role.create({
        data: {
          name: 'wholesale',
          description: 'Wholesale customer role'
        }
      });
    }

    const wholesaleRoleId = wholesaleRole?.id || (await prisma.role.findFirst({ where: { name: 'wholesale' } }))!.id;

    let testUser = await prisma.user.findFirst({
      where: { roleId: wholesaleRoleId }
    });

    if (!testUser) {
      testUser = await prisma.user.create({
        data: {
          email: 'test-wholesale@example.com',
          name: 'Test Wholesale User',
          roleId: wholesaleRoleId,
          phone: '+1234567890',
        }
      });
      console.log(`   Created test user: ${testUser.email}`);
    } else {
      console.log(`   Using existing user: ${testUser.email}`);
    }

    // 3. Get some products for testing
    console.log('\n3. Product Selection:');
    const products = await prisma.product.findMany({
      take: 3,
      orderBy: { nameEn: 'asc' }
    });

    if (products.length === 0) {
      console.log('   ⚠️ No products found! Skipping product-related tests.');
      return;
    }

    console.log(`   Selected ${products.length} products:`);
    products.forEach((product, index) => {
      console.log(`   ${index + 1}. ${product.nameEn} (${product.slug})`);
    });

    // 4. Create test inquiry submission
    console.log('\n4. Creating Test Inquiry:');
    const itemsData = products.map((product, index) => ({
      productId: product.id,
      productName: product.nameEn,
      quantity: (index + 1) * 10, // 10, 20, 30
      notes: `Test note for ${product.nameEn}`
    }));

    const inquirySubmission = await prisma.inquirySubmission.create({
      data: {
        userId: testUser.id,
        customerName: testUser.name || 'Test User',
        customerEmail: testUser.email || 'test@example.com',
        companyName: 'Test Company Ltd.',
        phone: testUser.phone,
        status: 'pending',
        message: 'Test inquiry for complete workflow verification',
        items: itemsData,
      }
    });

    console.log(`   Created inquiry: ${inquirySubmission.id}`);
    console.log(`   Items: ${Array.isArray(inquirySubmission.items) ? inquirySubmission.items.length : 'Unknown'}`);

    // 5. Test template availability
    console.log('\n5. Template Availability Test:');
    const templateIds = ['inquiry_acknowledgment', 'quote_ready', 'follow_up'];

    for (const templateId of templateIds) {
      try {
        const template = getTemplate(templateId);
        if (template) {
          console.log(`   ✅ ${templateId}: Template found`);
        } else {
          console.log(`   ❌ ${templateId}: Template not found`);
        }
      } catch (error) {
        console.log(`   ❌ ${templateId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // 6. Test email sending (acknowledgment)
    console.log('\n6. Email Sending Test:');
    try {
      const emailResult = await sendEmailWithThread({
        to: testUser.email!,
        subject: 'Test Inquiry Acknowledgment',
        templateId: 'inquiry_acknowledgment',
        templateData: {
          customerName: testUser.name || 'Test User',
          inquiryId: inquirySubmission.id,
          submissionDate: inquirySubmission.createdAt.toLocaleDateString(),
          inquiryItems: itemsData
        },
        inquiryId: inquirySubmission.id,
        customerEmail: testUser.email!,
        customerName: testUser.name || 'Test User',
        isFromAdmin: false
      });

      console.log(`   ✅ Email sent successfully`);
      console.log(`   Thread ID: ${emailResult.threadId}`);

      // Verify email thread was created and has emails
      const emailThread = await prisma.emailThread.findUnique({
        where: { id: emailResult.threadId },
        include: { emails: true }
      });

      if (emailThread && emailThread.emails.length > 0) {
        console.log(`   ✅ Email saved to database`);
        console.log(`   Subject: ${emailThread.emails[0]?.subject}`);
        console.log(`   Type: ${emailThread.emails[0]?.emailType}`);
        console.log(`   Emails in thread: ${emailThread.emails.length}`);
      } else {
        console.log(`   ⚠️ Email thread created but no emails found`);
      }

    } catch (error) {
      console.log(`   ❌ Email sending failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // 7. Check final state
    console.log('\n7. Final State Check:');
    const [finalInquiryCount, finalThreadCount, finalEmailCount] = await Promise.all([
      prisma.inquirySubmission.count(),
      prisma.emailThread.count(),
      prisma.email.count(),
    ]);

    console.log(`   Inquiry Submissions: ${inquiryCount} → ${finalInquiryCount}`);
    console.log(`   Email Threads: ${threadCount} → ${finalThreadCount}`);
    console.log(`   Emails: ${emailCount} → ${finalEmailCount}`);

    // 8. Clean up test data (optional)
    console.log('\n8. Cleanup (optional):');
    console.log('   To clean up test data, run: npm run cleanup-test-inquiry');

    console.log('\n✅ Complete workflow test finished successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
