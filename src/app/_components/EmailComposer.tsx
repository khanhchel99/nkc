"use client";
import React, { useState, useEffect } from 'react';
import { emailTemplates, getTemplate, renderTemplate, getTemplateSubject } from '@/lib/email-templates';
import { useI18n } from '../i18n';

interface EmailComposerProps {
  isOpen: boolean;
  onClose: () => void;
  threadId?: string; // Add threadId as optional prop
  inquiry: {
    id: string;
    customerName: string;
    customerEmail: string;
    companyName?: string | null;
    phone?: string | null;
    message?: string | null;
    items: Array<{
      productName: string;
      productId: string;
      quantity: number;
      notes?: string;
    }>;
    createdAt: Date;
  };
}

export default function EmailComposer({ isOpen, onClose, threadId, inquiry }: EmailComposerProps) {
  const { t } = useI18n();
  const [selectedTemplate, setSelectedTemplate] = useState('inquiry_acknowledgment');
  const [emailLanguage, setEmailLanguage] = useState<'en' | 'vi'>('en');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailContent, setEmailContent] = useState('');
  const [isRichText, setIsRichText] = useState(true);
  const [showHtmlCode, setShowHtmlCode] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [customMessage, setCustomMessage] = useState('');
  const [quoteItems, setQuoteItems] = useState<Array<{
    productName: string;
    quantity: number;
    unitPrice: string;
    totalPrice: string;
    notes?: string;
  }>>([]);

  // Company details (these could be moved to environment variables)
  const companyDetails = {
    phone: '+1 (555) 123-4567',
    website: 'www.nkcfurniture.com',
    companyAddress: '123 Furniture St, Design City, DC 12345',
    replyEmail: 'sales@nkcfurniture.com'
  };

  // Initialize quote items from inquiry items
  useEffect(() => {
    if (inquiry) {
      setQuoteItems(inquiry.items.map(item => ({
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: '', // Empty for manual input
        totalPrice: '', // Empty for manual input
        notes: item.notes
      })));
    }
  }, [inquiry]);

  useEffect(() => {
    if (selectedTemplate && inquiry) {
      const template = getTemplate(selectedTemplate);
      if (template) {
        setEmailSubject(getTemplateSubject(template, emailLanguage));
        
        // Generate quote items HTML for quote_ready template
        const quoteItemsHtml = quoteItems.map(item => 
          `<div style="margin: 15px 0; padding: 15px; border: 1px solid #ddd; border-radius: 6px; background-color: #fafafa;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
              <div style="flex: 1;">
                <strong style="color: #333; font-size: 16px;">${item.productName}</strong>
                <div style="color: #666; margin: 5px 0;">Quantity: ${item.quantity}</div>
                ${item.notes ? `<div style="color: #888; font-size: 14px; font-style: italic;">Notes: ${item.notes}</div>` : ''}
              </div>
              <div style="text-align: right; min-width: 150px;">
                <div style="color: #666; margin: 2px 0;">Unit Price: ${item.unitPrice || '_______'}</div>
                <div style="color: #895D35; font-weight: bold; font-size: 16px;">Total: ${item.totalPrice || '_______'}</div>
              </div>
            </div>
          </div>`
        ).join('');

        const quoteItemsText = quoteItems.map(item => 
          `${item.productName} (Qty: ${item.quantity})
  Unit Price: ${item.unitPrice || '_______'}
  Total: ${item.totalPrice || '_______'}${item.notes ? `\n  Notes: ${item.notes}` : ''}`
        ).join('\n\n');

        const totalPrice = quoteItems.every(item => item.totalPrice && !isNaN(parseFloat(item.totalPrice))) 
          ? quoteItems.reduce((sum, item) => sum + parseFloat(item.totalPrice), 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' })
          : '_______';
        
        // Prepare template variables
        const variables = {
          customerName: inquiry.customerName,
          customerEmail: inquiry.customerEmail,
          companyName: inquiry.companyName || '',
          message: inquiry.message || '',
          customMessage: customMessage,
          ...companyDetails,
          itemsList: inquiry.items.map(item => 
            `<div style="margin: 10px 0; padding: 10px; border-left: 3px solid #895D35;">
              <strong>${item.productName}</strong> - Quantity: ${item.quantity}
              ${item.notes ? `<br><small style="color: #666;">Notes: ${item.notes}</small>` : ''}
            </div>`
          ).join(''),
          itemsListText: inquiry.items.map(item => 
            `- ${item.productName} (Qty: ${item.quantity})${item.notes ? ` - Notes: ${item.notes}` : ''}`
          ).join('\n'),
          quoteItemsList: quoteItemsHtml,
          quoteItemsListText: quoteItemsText,
          totalPrice: totalPrice
        };

        const rendered = renderTemplate(template, variables, emailLanguage);
        setEmailContent(rendered.html);
      }
    }
  }, [selectedTemplate, inquiry, customMessage, emailLanguage, quoteItems]);

  const handleSendEmail = async () => {
    if (!emailSubject.trim() || !emailContent.trim()) {
      alert(t('fill_subject_content'));
      return;
    }

    setIsSending(true);
    try {
      // Use send-reply API if threadId is available, otherwise fallback to send-email
      const apiUrl = threadId ? '/api/send-reply' : '/api/send-email';
      const requestBody = threadId ? {
        threadId: threadId,
        to: inquiry.customerEmail,
        subject: emailSubject,
        htmlContent: emailContent,
        textContent: undefined,
        emailType: selectedTemplate || 'admin_reply',
        isFromAdmin: true
      } : {
        to: inquiry.customerEmail,
        subject: emailSubject,
        htmlContent: emailContent,
        textContent: undefined,
        inReplyTo: `inquiry-${inquiry.id}@nkcfurniture.com`,
        references: `inquiry-${inquiry.id}@nkcfurniture.com`
      };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();
      
      if (result.success) {
        alert(t('email_sent_successfully'));
        onClose();
        // Only refresh if using the new API (with threadId)
        if (threadId) {
          window.location.reload();
        }
      } else {
        alert(t('email_send_failed') + ': ' + result.error);
      }
    } catch (error) {
      console.error('Error sending email:', error);
      alert(t('email_send_failed') + '. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {t('compose_email')} {inquiry.customerName}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
              disabled={isSending}
            >
              ×
            </button>
          </div>

          {/* Email recipient info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium text-gray-900">To: {inquiry.customerEmail}</p>
                <p className="text-sm text-gray-600">{inquiry.customerName}</p>
                {inquiry.companyName && (
                  <p className="text-sm text-gray-600">{inquiry.companyName}</p>
                )}
              </div>
              <div className="text-sm text-gray-500">
                Inquiry submitted: {new Date(inquiry.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>

          {/* Template selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Template
            </label>
            <div className="flex gap-4">
              <select
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#895D35] focus:border-[#895D35]"
                disabled={isSending}
              >
                {emailTemplates.map(template => (
                  <option key={template.id} value={template.id}>
                    {emailLanguage === 'vi' ? template.nameVi : template.name}
                  </option>
                ))}
              </select>
              
              {/* Language Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  type="button"
                  onClick={() => setEmailLanguage('en')}
                  className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                    emailLanguage === 'en'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  disabled={isSending}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => setEmailLanguage('vi')}
                  className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                    emailLanguage === 'vi'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  disabled={isSending}
                >
                  Tiếng Việt
                </button>
              </div>
            </div>
          </div>

          {/* Quote pricing for quote_ready template */}
          {selectedTemplate === 'quote_ready' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quote Pricing
              </label>
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                {quoteItems.map((item, index) => (
                  <div key={index} className="bg-white p-4 rounded-lg border">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="md:col-span-2">
                        <h4 className="font-medium text-gray-900">{item.productName}</h4>
                        <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                        {item.notes && (
                          <p className="text-sm text-gray-500 italic">Notes: {item.notes}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Unit Price
                        </label>
                        <input
                          type="text"
                          value={item.unitPrice}
                          onChange={(e) => {
                            const newQuoteItems = [...quoteItems];
                            if (newQuoteItems[index]) {
                              newQuoteItems[index].unitPrice = e.target.value;
                              // Auto-calculate total if unit price is numeric
                              const unitPrice = parseFloat(e.target.value.replace(/[^0-9.-]/g, ''));
                              if (!isNaN(unitPrice)) {
                                newQuoteItems[index].totalPrice = (unitPrice * item.quantity).toFixed(2);
                              }
                            }
                            setQuoteItems(newQuoteItems);
                          }}
                          placeholder="$0.00"
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-[#895D35] focus:border-[#895D35]"
                          disabled={isSending}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Total Price
                        </label>
                        <input
                          type="text"
                          value={item.totalPrice}
                          onChange={(e) => {
                            const newQuoteItems = [...quoteItems];
                            if (newQuoteItems[index]) {
                              newQuoteItems[index].totalPrice = e.target.value;
                            }
                            setQuoteItems(newQuoteItems);
                          }}
                          placeholder="$0.00"
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-[#895D35] focus:border-[#895D35]"
                          disabled={isSending}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <div className="border-t pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900">Total Estimate:</span>
                    <span className="text-lg font-bold text-[#895D35]">
                      {quoteItems.every(item => item.totalPrice && !isNaN(parseFloat(item.totalPrice))) 
                        ? quoteItems.reduce((sum, item) => sum + parseFloat(item.totalPrice), 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' })
                        : '$0.00'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Custom message for follow-up template */}
          {selectedTemplate === 'follow_up' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custom Message
              </label>
              <textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Enter your custom follow-up message..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#895D35] focus:border-[#895D35]"
                disabled={isSending}
              />
            </div>
          )}

          {/* Subject */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject
            </label>
            <input
              type="text"
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#895D35] focus:border-[#895D35]"
              disabled={isSending}
            />
          </div>

          {/* Content type toggle */}
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-gray-700">
                HTML Rich Text Email
              </div>
              <button
                type="button"
                onClick={() => setShowHtmlCode(!showHtmlCode)}
                className="text-sm text-[#895D35] hover:text-[#7A4F2A] flex items-center space-x-1"
                disabled={isSending}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d={showHtmlCode ? "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" : "M15 12a3 3 0 11-6 0 3 3 0 016 0z"} />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d={showHtmlCode ? "" : "M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"} />
                </svg>
                <span>{showHtmlCode ? 'Hide Code' : 'Show Code'}</span>
              </button>
            </div>
          </div>

          {/* Email content */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Content
            </label>
            <div className="border border-gray-300 rounded-lg overflow-hidden">
              {/* Rich Text Preview/Editor */}
              <div className="bg-gray-50 px-3 py-2 border-b text-sm text-gray-600 flex items-center justify-between">
                <span>Rich Text Preview & Editor</span>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500">Click in the preview area to edit content directly</span>
                  {!isSending && (
                    <div className="flex items-center space-x-1 border-l pl-2 ml-2">
                      <button
                        type="button"
                        onClick={() => document.execCommand('bold')}
                        className="px-2 py-1 text-xs bg-white border rounded hover:bg-gray-50"
                        title="Bold"
                      >
                        <strong>B</strong>
                      </button>
                      <button
                        type="button"
                        onClick={() => document.execCommand('italic')}
                        className="px-2 py-1 text-xs bg-white border rounded hover:bg-gray-50"
                        title="Italic"
                      >
                        <em>I</em>
                      </button>
                      <button
                        type="button"
                        onClick={() => document.execCommand('underline')}
                        className="px-2 py-1 text-xs bg-white border rounded hover:bg-gray-50"
                        title="Underline"
                      >
                        <u>U</u>
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              <div 
                contentEditable={!isSending}
                dangerouslySetInnerHTML={{ __html: emailContent }}
                onInput={(e) => setEmailContent(e.currentTarget.innerHTML)}
                className="p-4 min-h-[400px] max-h-[500px] overflow-y-auto focus:outline-none focus:ring-2 focus:ring-[#895D35] focus:ring-inset bg-white"
                style={{
                  fontFamily: 'Arial, sans-serif',
                  lineHeight: '1.6',
                  cursor: isSending ? 'not-allowed' : 'text'
                }}
                suppressContentEditableWarning={true}
                onFocus={(e) => {
                  if (!isSending) {
                    e.currentTarget.classList.add('ring-2', 'ring-[#895D35]', 'ring-inset');
                  }
                }}
                onBlur={(e) => {
                  e.currentTarget.classList.remove('ring-2', 'ring-[#895D35]', 'ring-inset');
                }}
              />
              
              {/* HTML Code Section - Collapsible */}
              {showHtmlCode && (
                <div className="border-t">
                  <div className="bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700">
                    HTML Source Code
                  </div>
                  <textarea
                    value={emailContent}
                    onChange={(e) => setEmailContent(e.target.value)}
                    rows={10}
                    className="w-full px-3 py-2 border-0 focus:ring-[#895D35] focus:border-[#895D35] font-mono text-sm resize-none"
                    placeholder="HTML content..."
                    disabled={isSending}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              disabled={isSending}
            >
              Cancel
            </button>
            <button
              onClick={handleSendEmail}
              disabled={isSending || !emailSubject.trim() || !emailContent.trim()}
              className="px-6 py-2 bg-[#895D35] text-white rounded-lg hover:bg-[#7A4F2A] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isSending ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Send Email
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
