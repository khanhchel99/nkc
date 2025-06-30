import { db } from '../src/server/db';

async function cleanupTestInquiry() {
  try {
    console.log('Removing test inquiry...');
    
    const result = await db.inquirySubmission.delete({
      where: {
        id: 'cmcgen0h00001i4w8b5fisbdq'
      }
    });
    
    console.log('Test inquiry removed successfully:', result.id);
  } catch (error) {
    console.error('Error removing test inquiry:', error);
  } finally {
    await db.$disconnect();
  }
}

cleanupTestInquiry();
