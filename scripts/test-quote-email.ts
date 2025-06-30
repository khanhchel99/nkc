import { sendReplyEmail } from '../src/lib/email-service';
import { getTemplate, renderTemplate, getTemplateSubject } from '../src/lib/email-templates';

async function testQuoteEmail() {
  try {
    console.log('Testing quote email with pricing...');
    
    const template = getTemplate('quote_ready');
    if (!template) {
      throw new Error('Quote template not found');
    }
    
    // Test data with quote items
    const variables = {
      customerName: 'John Corporate',
      customerEmail: 'vkhanhngx@gmail.com',
      companyName: 'Big Store Inc.',
      phone: '+1 (555) 123-4567',
      website: 'www.nkcfurniture.com',
      companyAddress: '123 Furniture St, Design City, DC 12345',
      replyEmail: 'sales@nkcfurniture.com',
      quoteItemsList: `
        <div style="margin: 15px 0; padding: 15px; border: 1px solid #ddd; border-radius: 6px; background-color: #fafafa;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
            <div style="flex: 1;">
              <strong style="color: #333; font-size: 16px;">Executive Office Chair</strong>
              <div style="color: #666; margin: 5px 0;">Quantity: 10</div>
              <div style="color: #888; font-size: 14px; font-style: italic;">Notes: Black leather, ergonomic design</div>
            </div>
            <div style="text-align: right; min-width: 150px;">
              <div style="color: #666; margin: 2px 0;">Unit Price: $299.00</div>
              <div style="color: #895D35; font-weight: bold; font-size: 16px;">Total: $2,990.00</div>
            </div>
          </div>
        </div>
        <div style="margin: 15px 0; padding: 15px; border: 1px solid #ddd; border-radius: 6px; background-color: #fafafa;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
            <div style="flex: 1;">
              <strong style="color: #333; font-size: 16px;">Conference Table</strong>
              <div style="color: #666; margin: 5px 0;">Quantity: 2</div>
              <div style="color: #888; font-size: 14px; font-style: italic;">Notes: Oak finish, 8-person capacity</div>
            </div>
            <div style="text-align: right; min-width: 150px;">
              <div style="color: #666; margin: 2px 0;">Unit Price: $899.00</div>
              <div style="color: #895D35; font-weight: bold; font-size: 16px;">Total: $1,798.00</div>
            </div>
          </div>
        </div>
      `,
      quoteItemsListText: `Executive Office Chair (Qty: 10)
  Unit Price: $299.00
  Total: $2,990.00
  Notes: Black leather, ergonomic design

Conference Table (Qty: 2)
  Unit Price: $899.00
  Total: $1,798.00
  Notes: Oak finish, 8-person capacity`,
      totalPrice: '$4,788.00'
    };

    // Test English version
    console.log('Sending English quote email...');
    const englishRendered = renderTemplate(template, variables, 'en');
    
    const result = await sendReplyEmail({
      threadId: 'cmcg45fy70005i4tg2h5rnk0l', // Using existing thread
      to: 'vkhanhngx@gmail.com',
      subject: getTemplateSubject(template, 'en'),
      htmlContent: englishRendered.html,
      textContent: englishRendered.text,
      emailType: 'quote_ready',
      isFromAdmin: true,
    });

    console.log('English quote email sent successfully:', result);
    
    // Test Vietnamese version
    console.log('Sending Vietnamese quote email...');
    const vietnameseRendered = renderTemplate(template, variables, 'vi');
    
    const resultVi = await sendReplyEmail({
      threadId: 'cmcg45fy70005i4tg2h5rnk0l', // Using existing thread
      to: 'vkhanhngx@gmail.com',
      subject: getTemplateSubject(template, 'vi'),
      htmlContent: vietnameseRendered.html,
      textContent: vietnameseRendered.text,
      emailType: 'quote_ready_vi',
      isFromAdmin: true,
    });

    console.log('Vietnamese quote email sent successfully:', resultVi);
    
  } catch (error) {
    console.error('Error sending quote emails:', error);
  }
}

testQuoteEmail();
