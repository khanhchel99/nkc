import { getTemplate, renderTemplate, getTemplateSubject, getTemplateName } from '../src/lib/email-templates';

function testEmailTemplates() {
  console.log('Testing bilingual email templates...\n');

  const template = getTemplate('quote_ready');
  if (!template) {
    console.error('Template not found!');
    return;
  }

  // Test data
  const variables = {
    customerName: 'John Doe',
    customerEmail: 'john@example.com',
    companyName: 'Test Company',
    phone: '+1 (555) 123-4567',
    website: 'www.nkcfurniture.com',
    companyAddress: '123 Furniture St, Design City, DC 12345',
    replyEmail: 'sales@nkcfurniture.com',
    quoteItemsList: `
      <div style="margin: 15px 0; padding: 15px; border: 1px solid #ddd; border-radius: 6px; background-color: #fafafa;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
          <div style="flex: 1;">
            <strong style="color: #333; font-size: 16px;">Executive Chair</strong>
            <div style="color: #666; margin: 5px 0;">Quantity: 5</div>
            <div style="color: #888; font-size: 14px; font-style: italic;">Notes: Black color preferred</div>
          </div>
          <div style="text-align: right; min-width: 150px;">
            <div style="color: #666; margin: 2px 0;">Unit Price: $299.00</div>
            <div style="color: #895D35; font-weight: bold; font-size: 16px;">Total: $1,495.00</div>
          </div>
        </div>
      </div>
    `,
    quoteItemsListText: `Executive Chair (Qty: 5)
  Unit Price: $299.00
  Total: $1,495.00
  Notes: Black color preferred`,
    totalPrice: '$1,495.00'
  };

  // Test English
  console.log('=== ENGLISH VERSION ===');
  console.log('Template Name:', getTemplateName(template, 'en'));
  console.log('Subject:', getTemplateSubject(template, 'en'));
  
  const englishResult = renderTemplate(template, variables, 'en');
  console.log('HTML length:', englishResult.html.length);
  console.log('Text length:', englishResult.text.length);
  console.log('HTML contains quote items:', englishResult.html.includes('Executive Chair'));
  console.log('HTML contains total price:', englishResult.html.includes('$1,495.00'));

  // Test Vietnamese
  console.log('\n=== VIETNAMESE VERSION ===');
  console.log('Template Name:', getTemplateName(template, 'vi'));
  console.log('Subject:', getTemplateSubject(template, 'vi'));
  
  const vietnameseResult = renderTemplate(template, variables, 'vi');
  console.log('HTML length:', vietnameseResult.html.length);
  console.log('Text length:', vietnameseResult.text.length);
  console.log('HTML contains quote items:', vietnameseResult.html.includes('Executive Chair'));
  console.log('HTML contains total price:', vietnameseResult.html.includes('$1,495.00'));
  console.log('HTML contains Vietnamese text:', vietnameseResult.html.includes('Báo giá này có hiệu lực'));

  console.log('\n✅ Template testing completed!');
}

testEmailTemplates();
