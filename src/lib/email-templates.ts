import React from 'react';

interface EmailTemplate {
  id: string;
  name: string;
  nameVi: string;
  subject: string;
  subjectVi: string;
  htmlTemplate: string;
  htmlTemplateVi: string;
  textTemplate: string;
  textTemplateVi: string;
}

export const emailTemplates: EmailTemplate[] = [
  {
    id: 'inquiry_acknowledgment',
    name: 'Inquiry Acknowledgment',
    nameVi: 'Xác Nhận Yêu Cầu',
    subject: 'Thank you for your inquiry - NKC Furniture',
    subjectVi: 'Cảm ơn yêu cầu của bạn - NKC Furniture',
    htmlTemplate: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px;">
        <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #895D35; font-size: 28px; margin: 0;">NKC</h1>
            <p style="color: #666; margin: 5px 0 0 0;">Premium Furniture Solutions</p>
          </div>
          
          <h2 style="color: #333; margin-bottom: 20px;">Hello {{customerName}},</h2>
          
          <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
            Thank you for your inquiry regarding our furniture products. We have received your request and our team is reviewing the following items:
          </p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0;">
            <h3 style="color: #895D35; margin-top: 0;">Requested Items:</h3>
            {{itemsList}}
          </div>
          
          {{#if message}}
          <div style="margin: 20px 0;">
            <h4 style="color: #333; margin-bottom: 10px;">Your Message:</h4>
            <div style="background-color: #f1f3f4; padding: 15px; border-radius: 4px; border-left: 4px solid #895D35;">
              <p style="margin: 0; color: #555; font-style: italic;">"{{message}}"</p>
            </div>
          </div>
          {{/if}}
          
          <p style="color: #555; line-height: 1.6; margin: 20px 0;">
            Our wholesale team will review your requirements and prepare a detailed quote within 2-3 business days. We'll include pricing, availability, and delivery timelines.
          </p>
          
          <div style="background-color: #e3f2fd; padding: 20px; border-radius: 6px; margin: 20px 0;">
            <h4 style="color: #1976d2; margin-top: 0;">Next Steps:</h4>
            <ul style="color: #555; margin: 0; padding-left: 20px;">
              <li>Our team will prepare your custom quote</li>
              <li>You'll receive detailed pricing within 2-3 business days</li>
              <li>We'll schedule a consultation if needed</li>
              <li>Production timeline will be confirmed upon order</li>
            </ul>
          </div>
          
          <p style="color: #555; line-height: 1.6; margin: 20px 0;">
            If you have any immediate questions or would like to discuss your requirements, please don't hesitate to contact us directly.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="tel:{{phone}}" style="background-color: #895D35; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 0 10px;">
              Call Us
            </a>
            <a href="mailto:{{replyEmail}}" style="background-color: #f8f9fa; color: #895D35; padding: 12px 25px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 0 10px; border: 2px solid #895D35;">
              Reply to Email
            </a>
          </div>
          
          <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; text-align: center; color: #666; font-size: 14px;">
            <p>Best regards,<br><strong>NKC Furniture Team</strong></p>
            <p style="margin: 10px 0 0 0;">{{companyAddress}} | {{phone}} | {{website}}</p>
          </div>
        </div>
      </div>
    `,
    htmlTemplateVi: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px;">
        <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #895D35; font-size: 28px; margin: 0;">NKC</h1>
            <p style="color: #666; margin: 5px 0 0 0;">Giải Pháp Nội Thất Cao Cấp</p>
          </div>
          
          <h2 style="color: #333; margin-bottom: 20px;">Xin chào {{customerName}},</h2>
          
          <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
            Cảm ơn bạn đã quan tâm đến các sản phẩm nội thất của chúng tôi. Chúng tôi đã nhận được yêu cầu của bạn và đội ngũ của chúng tôi đang xem xét các sản phẩm sau:
          </p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0;">
            <h3 style="color: #895D35; margin-top: 0;">Sản phẩm yêu cầu:</h3>
            {{itemsList}}
          </div>
          
          {{#if message}}
          <div style="margin: 20px 0;">
            <h4 style="color: #333; margin-bottom: 10px;">Tin nhắn của bạn:</h4>
            <div style="background-color: #f1f3f4; padding: 15px; border-radius: 4px; border-left: 4px solid #895D35;">
              <p style="margin: 0; color: #555; font-style: italic;">"{{message}}"</p>
            </div>
          </div>
          {{/if}}
          
          <p style="color: #555; line-height: 1.6; margin: 20px 0;">
            Đội ngũ bán sỉ của chúng tôi sẽ xem xét yêu cầu của bạn và chuẩn bị báo giá chi tiết trong vòng 2-3 ngày làm việc. Chúng tôi sẽ bao gồm giá cả, tình trạng hàng và thời gian giao hàng.
          </p>
          
          <div style="background-color: #e3f2fd; padding: 20px; border-radius: 6px; margin: 20px 0;">
            <h4 style="color: #1976d2; margin-top: 0;">Các bước tiếp theo:</h4>
            <ul style="color: #555; margin: 0; padding-left: 20px;">
              <li>Đội ngũ của chúng tôi sẽ chuẩn bị báo giá tùy chỉnh</li>
              <li>Bạn sẽ nhận được giá chi tiết trong vòng 2-3 ngày làm việc</li>
              <li>Chúng tôi sẽ lên lịch tư vấn nếu cần</li>
              <li>Thời gian sản xuất sẽ được xác nhận khi đặt hàng</li>
            </ul>
          </div>
          
          <p style="color: #555; line-height: 1.6; margin: 20px 0;">
            Nếu bạn có bất kỳ câu hỏi nào hoặc muốn thảo luận về yêu cầu của mình, xin đừng ngần ngại liên hệ trực tiếp với chúng tôi.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="tel:{{phone}}" style="background-color: #895D35; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 0 10px;">
              Gọi cho chúng tôi
            </a>
            <a href="mailto:{{replyEmail}}" style="background-color: #f8f9fa; color: #895D35; padding: 12px 25px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 0 10px; border: 2px solid #895D35;">
              Trả lời Email
            </a>
          </div>
          
          <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; text-align: center; color: #666; font-size: 14px;">
            <p>Trân trọng,<br><strong>Đội ngũ NKC Furniture</strong></p>
            <p style="margin: 10px 0 0 0;">{{companyAddress}} | {{phone}} | {{website}}</p>
          </div>
        </div>
      </div>
    `,
    textTemplate: `
Hello {{customerName}},

Thank you for your inquiry regarding our furniture products. We have received your request and our team is reviewing the following items:

{{itemsListText}}

{{#if message}}
Your Message:
"{{message}}"
{{/if}}

Our wholesale team will review your requirements and prepare a detailed quote within 2-3 business days. We'll include pricing, availability, and delivery timelines.

Next Steps:
- Our team will prepare your custom quote
- You'll receive detailed pricing within 2-3 business days
- We'll schedule a consultation if needed
- Production timeline will be confirmed upon order

If you have any immediate questions or would like to discuss your requirements, please don't hesitate to contact us directly.

Best regards,
NKC Furniture Team
{{companyAddress}} | {{phone}} | {{website}}
    `,
    textTemplateVi: `
Xin chào {{customerName}},

Cảm ơn bạn đã quan tâm đến các sản phẩm nội thất của chúng tôi. Chúng tôi đã nhận được yêu cầu của bạn và đội ngũ của chúng tôi đang xem xét các sản phẩm sau:

{{itemsListText}}

{{#if message}}
Tin nhắn của bạn:
"{{message}}"
{{/if}}

Đội ngũ bán sỉ của chúng tôi sẽ xem xét yêu cầu của bạn và chuẩn bị báo giá chi tiết trong vòng 2-3 ngày làm việc. Chúng tôi sẽ bao gồm giá cả, tình trạng hàng và thời gian giao hàng.

Các bước tiếp theo:
- Đội ngũ của chúng tôi sẽ chuẩn bị báo giá tùy chỉnh
- Bạn sẽ nhận được giá chi tiết trong vòng 2-3 ngày làm việc
- Chúng tôi sẽ lên lịch tư vấn nếu cần
- Thời gian sản xuất sẽ được xác nhận khi đặt hàng

Nếu bạn có bất kỳ câu hỏi nào hoặc muốn thảo luận về yêu cầu của mình, xin đừng ngần ngại liên hệ trực tiếp với chúng tôi.

Trân trọng,
Đội ngũ NKC Furniture
{{companyAddress}} | {{phone}} | {{website}}
    `
  },
  {
    id: 'quote_ready',
    name: 'Quote Ready',
    nameVi: 'Báo Giá Sẵn Sàng',
    subject: 'Your Custom Quote is Ready - NKC Furniture',
    subjectVi: 'Báo giá tùy chỉnh của bạn đã sẵn sàng - NKC Furniture',
    htmlTemplate: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px;">
        <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #895D35; font-size: 28px; margin: 0;">NKC</h1>
            <p style="color: #666; margin: 5px 0 0 0;">Premium Furniture Solutions</p>
          </div>
          
          <h2 style="color: #333; margin-bottom: 20px;">Hello {{customerName}},</h2>
          
          <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
            Great news! We've prepared your custom quote for the items you requested. Please find the details below:
          </p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0;">
            <h3 style="color: #895D35; margin-top: 0;">Quote Details:</h3>
            {{quoteItemsList}}
            
            <div style="margin-top: 20px; padding-top: 15px; border-top: 2px solid #895D35;">
              <div style="display: flex; justify-content: space-between; align-items: center; font-size: 18px; font-weight: bold; color: #333;">
                <span>Total Estimated Price:</span>
                <span style="color: #895D35;">{{totalPrice}}</span>
              </div>
            </div>
          </div>
          
          <div style="background-color: #fff3cd; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <p style="margin: 0; color: #856404; font-size: 14px;">
              <strong>Note:</strong> Prices may vary based on final specifications, finishes, and delivery requirements. Final pricing will be confirmed upon order placement.
            </p>
          </div>
          
          <p style="color: #555; line-height: 1.6; margin: 20px 0;">
            This quote is valid for 30 days from the date of this email. Please let us know if you have any questions or would like to proceed with your order.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="mailto:{{replyEmail}}?subject=Re: Quote Acceptance" style="background-color: #895D35; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 0 10px;">
              Accept Quote
            </a>
            <a href="tel:{{phone}}" style="background-color: #f8f9fa; color: #895D35; padding: 12px 25px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 0 10px; border: 2px solid #895D35;">
              Discuss Quote
            </a>
          </div>
          
          <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; text-align: center; color: #666; font-size: 14px;">
            <p>Best regards,<br><strong>NKC Furniture Team</strong></p>
            <p style="margin: 10px 0 0 0;">{{companyAddress}} | {{phone}} | {{website}}</p>
          </div>
        </div>
      </div>
    `,
    htmlTemplateVi: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px;">
        <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #895D35; font-size: 28px; margin: 0;">NKC</h1>
            <p style="color: #666; margin: 5px 0 0 0;">Giải Pháp Nội Thất Cao Cấp</p>
          </div>
          
          <h2 style="color: #333; margin-bottom: 20px;">Xin chào {{customerName}},</h2>
          
          <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
            Tin tuyệt vời! Chúng tôi đã chuẩn bị báo giá tùy chỉnh cho các sản phẩm bạn yêu cầu. Vui lòng xem chi tiết bên dưới:
          </p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0;">
            <h3 style="color: #895D35; margin-top: 0;">Chi tiết báo giá:</h3>
            {{quoteItemsList}}
            
            <div style="margin-top: 20px; padding-top: 15px; border-top: 2px solid #895D35;">
              <div style="display: flex; justify-content: space-between; align-items: center; font-size: 18px; font-weight: bold; color: #333;">
                <span>Tổng giá ước tính:</span>
                <span style="color: #895D35;">{{totalPrice}}</span>
              </div>
            </div>
          </div>
          
          <div style="background-color: #fff3cd; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <p style="margin: 0; color: #856404; font-size: 14px;">
              <strong>Lưu ý:</strong> Giá có thể thay đổi dựa trên thông số kỹ thuật cuối cùng, hoàn thiện và yêu cầu giao hàng. Giá cuối cùng sẽ được xác nhận khi đặt hàng.
            </p>
          </div>
          
          <p style="color: #555; line-height: 1.6; margin: 20px 0;">
            Báo giá này có hiệu lực trong 30 ngày kể từ ngày gửi email này. Vui lòng cho chúng tôi biết nếu bạn có bất kỳ câu hỏi nào hoặc muốn tiến hành đặt hàng.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="mailto:{{replyEmail}}?subject=Re: Chấp nhận báo giá" style="background-color: #895D35; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 0 10px;">
              Chấp nhận báo giá
            </a>
            <a href="tel:{{phone}}" style="background-color: #f8f9fa; color: #895D35; padding: 12px 25px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 0 10px; border: 2px solid #895D35;">
              Thảo luận báo giá
            </a>
          </div>
          
          <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; text-align: center; color: #666; font-size: 14px;">
            <p>Trân trọng,<br><strong>Đội ngũ NKC Furniture</strong></p>
            <p style="margin: 10px 0 0 0;">{{companyAddress}} | {{phone}} | {{website}}</p>
          </div>
        </div>
      </div>
    `,
    textTemplate: `
Hello {{customerName}},

Great news! We've prepared your custom quote for the items you requested. Please find the details below:

{{quoteItemsListText}}

Total Estimated Price: {{totalPrice}}

Note: Prices may vary based on final specifications, finishes, and delivery requirements. Final pricing will be confirmed upon order placement.

This quote is valid for 30 days from the date of this email. Please let us know if you have any questions or would like to proceed with your order.

Best regards,
NKC Furniture Team
{{companyAddress}} | {{phone}} | {{website}}
    `,
    textTemplateVi: `
Xin chào {{customerName}},

Tin tuyệt vời! Chúng tôi đã chuẩn bị báo giá tùy chỉnh cho các sản phẩm bạn yêu cầu. Vui lòng xem chi tiết bên dưới:

{{quoteItemsListText}}

Tổng giá ước tính: {{totalPrice}}

Lưu ý: Giá có thể thay đổi dựa trên thông số kỹ thuật cuối cùng, hoàn thiện và yêu cầu giao hàng. Giá cuối cùng sẽ được xác nhận khi đặt hàng.

Báo giá này có hiệu lực trong 30 ngày kể từ ngày gửi email này. Vui lòng cho chúng tôi biết nếu bạn có bất kỳ câu hỏi nào hoặc muốn tiến hành đặt hàng.

Trân trọng,
Đội ngũ NKC Furniture
{{companyAddress}} | {{phone}} | {{website}}
    `
  },
  {
    id: 'follow_up',
    name: 'Follow Up',
    nameVi: 'Theo Dõi',
    subject: 'Following up on your furniture inquiry - NKC Furniture',
    subjectVi: 'Theo dõi yêu cầu nội thất của bạn - NKC Furniture',
    htmlTemplate: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px;">
        <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #895D35; font-size: 28px; margin: 0;">NKC</h1>
            <p style="color: #666; margin: 5px 0 0 0;">Premium Furniture Solutions</p>
          </div>
          
          <h2 style="color: #333; margin-bottom: 20px;">Hello {{customerName}},</h2>
          
          <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
            I hope this email finds you well. I wanted to follow up on your recent inquiry about our furniture products.
          </p>
          
          <p style="color: #555; line-height: 1.6; margin: 20px 0;">
            {{customMessage}}
          </p>
          
          <p style="color: #555; line-height: 1.6; margin: 20px 0;">
            If you have any questions or would like to discuss your requirements further, please don't hesitate to reach out. We're here to help you find the perfect furniture solutions for your needs.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="mailto:{{replyEmail}}" style="background-color: #895D35; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 0 10px;">
              Reply to Email
            </a>
            <a href="tel:{{phone}}" style="background-color: #f8f9fa; color: #895D35; padding: 12px 25px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 0 10px; border: 2px solid #895D35;">
              Call Us
            </a>
          </div>
          
          <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; text-align: center; color: #666; font-size: 14px;">
            <p>Best regards,<br><strong>NKC Furniture Team</strong></p>
            <p style="margin: 10px 0 0 0;">{{companyAddress}} | {{phone}} | {{website}}</p>
          </div>
        </div>
      </div>
    `,
    htmlTemplateVi: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px;">
        <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #895D35; font-size: 28px; margin: 0;">NKC</h1>
            <p style="color: #666; margin: 5px 0 0 0;">Giải Pháp Nội Thất Cao Cấp</p>
          </div>
          
          <h2 style="color: #333; margin-bottom: 20px;">Xin chào {{customerName}},</h2>
          
          <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
            Tôi hy vọng email này đến với bạn trong sức khỏe tốt. Tôi muốn theo dõi yêu cầu gần đây của bạn về các sản phẩm nội thất của chúng tôi.
          </p>
          
          <p style="color: #555; line-height: 1.6; margin: 20px 0;">
            {{customMessage}}
          </p>
          
          <p style="color: #555; line-height: 1.6; margin: 20px 0;">
            Nếu bạn có bất kỳ câu hỏi nào hoặc muốn thảo luận thêm về yêu cầu của mình, xin đừng ngần ngại liên hệ. Chúng tôi ở đây để giúp bạn tìm ra giải pháp nội thất hoàn hảo cho nhu cầu của bạn.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="mailto:{{replyEmail}}" style="background-color: #895D35; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 0 10px;">
              Trả lời Email
            </a>
            <a href="tel:{{phone}}" style="background-color: #f8f9fa; color: #895D35; padding: 12px 25px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 0 10px; border: 2px solid #895D35;">
              Gọi cho chúng tôi
            </a>
          </div>
          
          <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; text-align: center; color: #666; font-size: 14px;">
            <p>Trân trọng,<br><strong>Đội ngũ NKC Furniture</strong></p>
            <p style="margin: 10px 0 0 0;">{{companyAddress}} | {{phone}} | {{website}}</p>
          </div>
        </div>
      </div>
    `,
    textTemplate: `
Hello {{customerName}},

I hope this email finds you well. I wanted to follow up on your recent inquiry about our furniture products.

{{customMessage}}

If you have any questions or would like to discuss your requirements further, please don't hesitate to reach out. We're here to help you find the perfect furniture solutions for your needs.

Best regards,
NKC Furniture Team
{{companyAddress}} | {{phone}} | {{website}}
    `,
    textTemplateVi: `
Xin chào {{customerName}},

Tôi hy vọng email này đến với bạn trong sức khỏe tốt. Tôi muốn theo dõi yêu cầu gần đây của bạn về các sản phẩm nội thất của chúng tôi.

{{customMessage}}

Nếu bạn có bất kỳ câu hỏi nào hoặc muốn thảo luận thêm về yêu cầu của mình, xin đừng ngần ngại liên hệ. Chúng tôi ở đây để giúp bạn tìm ra giải pháp nội thất hoàn hảo cho nhu cầu của bạn.

Trân trọng,
Đội ngũ NKC Furniture
{{companyAddress}} | {{phone}} | {{website}}
    `
  }
];

export const getTemplate = (templateId: string): EmailTemplate | undefined => {
  return emailTemplates.find(template => template.id === templateId);
};

export const renderTemplate = (
  template: EmailTemplate, 
  variables: Record<string, any>, 
  language: 'en' | 'vi' = 'en'
): { html: string; text: string } => {
  // Select the appropriate template based on language
  let html = language === 'vi' ? template.htmlTemplateVi : template.htmlTemplate;
  let text = language === 'vi' ? template.textTemplateVi : template.textTemplate;

  // Simple template variable replacement
  Object.keys(variables).forEach(key => {
    const value = variables[key] || '';
    const regex = new RegExp(`{{${key}}}`, 'g');
    html = html.replace(regex, value);
    text = text.replace(regex, value);
  });

  // Handle conditional blocks (simple implementation)
  const conditionalRegex = /{{#if\s+(\w+)}}([\s\S]*?){{\/if}}/g;
  html = html.replace(conditionalRegex, (match, condition, content) => {
    return variables[condition] ? content : '';
  });
  text = text.replace(conditionalRegex, (match, condition, content) => {
    return variables[condition] ? content : '';
  });

  return { html, text };
};

export const getTemplateSubject = (template: EmailTemplate, language: 'en' | 'vi' = 'en'): string => {
  return language === 'vi' ? template.subjectVi : template.subject;
};

export const getTemplateName = (template: EmailTemplate, language: 'en' | 'vi' = 'en'): string => {
  return language === 'vi' ? template.nameVi : template.name;
};
