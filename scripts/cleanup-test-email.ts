import { db } from '../src/server/db';

async function removeTestEmail() {
  try {
    console.log('Removing test email...');
    
    const result = await db.email.delete({
      where: {
        id: 'cmcge1s5u0001i4kgt9x6c8j8' // The test email ID
      }
    });
    
    console.log('Test email removed successfully:', result.id);
  } catch (error) {
    console.error('Error removing test email:', error);
  } finally {
    await db.$disconnect();
  }
}

removeTestEmail();
