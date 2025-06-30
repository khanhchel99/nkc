import { sendEmail } from '../src/lib/email-service';

async function testEmailSending() {
  try {
    console.log('Testing email sending and database save...');
    
    const result = await sendEmail({
      to: 'test@example.com',
      subject: 'Test Email',
      htmlContent: '<h1>Test Email</h1><p>This is a test email.</p>',
      textContent: 'Test Email\n\nThis is a test email.',
      emailThreadId: 'cmcg45fy70005i4tg2h5rnk0l', // Using the existing thread ID from our check
      emailType: 'test',
      isFromAdmin: true,
    });

    console.log('Email send result:', result);
  } catch (error) {
    console.error('Error during test:', error);
  }
}

testEmailSending();
