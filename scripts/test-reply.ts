import { sendReplyEmail } from '../src/lib/email-service';

async function testReplyEmail() {
  try {
    console.log('Testing reply email sending...');
    
    const result = await sendReplyEmail({
      threadId: 'cmcg45fy70005i4tg2h5rnk0l',
      to: 'vkhanhngx@gmail.com',
      subject: 'Inquiry #cmcg45fqy0003i4tgbnw5f4go',
      htmlContent: '<h2>Follow-up on Your Inquiry</h2><p>Dear John,</p><p>Thank you for your inquiry. We have reviewed your requirements and will provide you with a detailed quote within 2 business days.</p><p>Best regards,<br>NKC Furniture Sales Team</p>',
      textContent: 'Follow-up on Your Inquiry\n\nDear John,\n\nThank you for your inquiry. We have reviewed your requirements and will provide you with a detailed quote within 2 business days.\n\nBest regards,\nNKC Furniture Sales Team',
      emailType: 'admin_reply',
      isFromAdmin: true,
    });

    console.log('Reply email sent successfully:', result);
  } catch (error) {
    console.error('Error sending reply email:', error);
  }
}

testReplyEmail();
