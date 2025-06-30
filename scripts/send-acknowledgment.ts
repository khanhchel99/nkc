import { sendInquiryAcknowledgment } from '../src/lib/email-service';

async function sendProperAcknowledgment() {
  try {
    console.log('Sending proper acknowledgment email for existing inquiry...');
    
    // Mock the inquiry and user data based on what we saw in the database
    const mockInquiry = {
      id: 'cmcg45fqy0003i4tgbnw5f4go',
      company: 'Corporate Solutions Ltd',
      message: 'We are interested in your furniture collection for our new office space.',
      createdAt: new Date(),
      inquiryListItems: [{}, {}, {}] // Mock 3 items
    };

    const mockUser = {
      name: 'John Corporate',
      email: 'vkhanhngx@gmail.com'
    };

    const result = await sendInquiryAcknowledgment({
      inquiry: mockInquiry,
      user: mockUser,
    });

    console.log('Acknowledgment email sent successfully:', result);
  } catch (error) {
    console.error('Error sending acknowledgment:', error);
  }
}

sendProperAcknowledgment();
