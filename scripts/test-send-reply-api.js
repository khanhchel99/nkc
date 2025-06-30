// Test the new send-reply API
async function testSendReply() {
  try {
    console.log('Testing new send-reply API...');
    
    const response = await fetch('http://localhost:3000/api/send-reply', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        threadId: 'cmcg45fy70005i4tg2h5rnk0l', // Using existing thread
        to: 'vkhanhngx@gmail.com',
        subject: 'Test Admin Reply via New API',
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #895D35;">Test Email from New API</h2>
            <p>This is a test email sent via the new send-reply API route.</p>
            <p>It should be both sent and saved to the database.</p>
            <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
          </div>
        `,
        textContent: 'Test email from new API - ' + new Date().toISOString(),
        emailType: 'admin_reply',
        isFromAdmin: true
      }),
    });

    const result = await response.json();
    console.log('API Response:', result);

    if (result.success) {
      console.log('✅ Email sent and saved successfully!');
      console.log('Email ID:', result.emailId);
      console.log('Thread ID:', result.threadId);
    } else {
      console.log('❌ Failed:', result.error);
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testSendReply();
