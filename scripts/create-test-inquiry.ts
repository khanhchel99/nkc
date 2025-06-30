import { db } from '../src/server/db';

async function createTestInquiry() {
  try {
    console.log('Creating a test inquiry without email thread...');
    
    // Get the user to associate with the inquiry
    const user = await db.user.findFirst({
      where: { email: 'vkhanhngx@gmail.com' }
    });
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Create a new inquiry submission
    const inquiry = await db.inquirySubmission.create({
      data: {
        userId: user.id,
        customerName: 'Jane Doe',
        customerEmail: 'jane@example.com',
        companyName: 'Test Company Ltd.',
        phone: '+1234567890',
        message: 'This is a test inquiry to check the empty email thread state.',
        items: [
          {
            productId: 'test-product-1',
            productName: 'Test Chair',
            quantity: 5,
            notes: 'Preferred color: black'
          }
        ],
      },
    });
    
    console.log('Test inquiry created:', inquiry.id);
    console.log('You can test the empty email thread state at:');
    console.log(`http://localhost:3000/admin/inquiries/${inquiry.id}/email-thread`);
    
  } catch (error) {
    console.error('Error creating test inquiry:', error);
  } finally {
    await db.$disconnect();
  }
}

createTestInquiry();
