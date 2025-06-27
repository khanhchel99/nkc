'use client';

import { useState } from "react";
import SubmitButton from "./SubmitButton";
import { useI18n } from "../i18n";

interface ContactInquiryFormProps {
  inquiryType?: 'contact' | 'services';
}

export default function ContactInquiryForm({ inquiryType = 'contact' }: ContactInquiryFormProps) {
  const { t } = useI18n();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    inquiry: "",
    note: "",
    companyName: "",
    attachment: null as File | null,
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: 'success' | 'error',
    message: string
  } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, files } = e.target as HTMLInputElement;
    if (name === "attachment" && files) {
      setFormData(prev => ({ ...prev, attachment: files[0] ?? null }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);
    try {
      const formPayload = new FormData();
      formPayload.append("name", formData.name);
      formPayload.append("email", formData.email);
      formPayload.append("mobile", formData.mobile);
      formPayload.append("service", formData.inquiry); // Keep 'service' field name for API compatibility
      formPayload.append("note", formData.note);
      if (formData.companyName) formPayload.append("companyName", formData.companyName);
      if (formData.attachment) formPayload.append("attachment", formData.attachment);

      const response = await fetch('/api/inquiry', {
        method: 'POST',
        body: formPayload,
      });
      
      if (response.ok) {
        setSubmitStatus({
          type: 'success',
          message: t('inquiry_success_message')
        });
        setFormData({
          name: "",
          email: "",
          mobile: "",
          inquiry: "",
          note: "",
          companyName: "",
          attachment: null,
        });
      } else {
        throw new Error('Failed to submit inquiry');
      }
    } catch (error) {
      setSubmitStatus({
        type: 'error',
        message: t('inquiry_error_message')
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInquiryOptions = () => {
    if (inquiryType === 'services') {
      return [
        { value: "general-carpentry", label: t('general_carpentry') },
        { value: "furniture-manufacturing", label: t('furniture_manufacturing') },
        { value: "furniture-remodeling", label: t('furniture_remodeling') },
        { value: "wooden-floor", label: t('wooden_floor') },
        { value: "wooden-furniture", label: t('wooden_furniture') },
        { value: "custom-work", label: t('custom_work') },
      ];
    } else {
      return [
        { value: "wholesale-account", label: t('wholesale_account_creation') },
        { value: "pricing-inquiry", label: t('pricing_inquiry') },
        { value: "product-inquiry", label: t('product_inquiry') },
        { value: "technical-support", label: t('technical_support') },
        { value: "partnership", label: t('partnership_collaboration') },
        { value: "general-inquiry", label: t('general_inquiry') },
      ];
    }
  };

  const getFieldLabel = () => {
    return inquiryType === 'services' ? t('select_a_service') : t('inquiry_regarding');
  };

  const getPlaceholder = () => {
    return inquiryType === 'services' ? t('select_a_service') : t('select_inquiry_type');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {submitStatus && (
        <div className={`p-4 rounded-md ${submitStatus.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {submitStatus.message}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="block w-full">
          <span className="block mb-1 font-medium text-gray-700">{t('your_name')} <span className="text-red-500">*</span></span>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder={t('your_name')}
            required
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2"
            style={{ "--tw-ring-color": "#7A4F2A" } as React.CSSProperties}
          />
        </label>
        <label className="block w-full">
          <span className="block mb-1 font-medium text-gray-700">{t('your_email')} <span className="text-red-500">*</span></span>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder={t('your_email')}
            required
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2"
            style={{ "--tw-ring-color": "#7A4F2A" } as React.CSSProperties}
          />
        </label>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="block w-full">
          <span className="block mb-1 font-medium text-gray-700">{t('your_mobile')} <span className="text-red-500">*</span></span>
          <input
            type="tel"
            name="mobile"
            value={formData.mobile}
            onChange={handleChange}
            placeholder={t('your_mobile')}
            required
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2"
            style={{ "--tw-ring-color": "#7A4F2A" } as React.CSSProperties}
          />
        </label>
        <label className="block w-full">
          <span className="block mb-1 font-medium text-gray-700">{getFieldLabel()} <span className="text-red-500">*</span></span>
          <div className="relative">
            <select
              name="inquiry"
              value={formData.inquiry}
              onChange={handleChange}
              required
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 appearance-none font-normal text-gray-400 pr-10 bg-white placeholder-gray-400"
              style={{ "--tw-ring-color": "#7A4F2A" } as React.CSSProperties}
            >
              <option value="" disabled hidden className="text-gray-400 font-normal">{getPlaceholder()}</option>
              {getInquiryOptions().map((option) => (
                <option key={option.value} value={option.value} className="text-gray-800">
                  {option.label}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg">▼</span>
          </div>
        </label>
      </div>
      
      <input
        type="text"
        name="companyName"
        value={formData.companyName}
        onChange={handleChange}
        placeholder={t('company_name_optional')}
        className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2"
        style={{ "--tw-ring-color": "#7A4F2A" } as React.CSSProperties}
      />
      
      <div className="mb-4">
        <span className="block mb-1 font-medium text-gray-700">{t('attachment_optional')}</span>
        <div className="relative flex items-center">
          <input
            type="file"
            name="attachment"
            accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt"
            onChange={handleChange}
            className="sr-only"
            id="attachment-upload"
            tabIndex={-1}
          />
          <button
            type="button"
            className="inline-block px-4 py-2 bg-[#895D35] text-white rounded cursor-pointer hover:bg-[#7A4F2A] transition-colors"
            onClick={() => document.getElementById('attachment-upload')?.click()}
          >
            {t('choose_file')}
          </button>
          <span className="ml-3 text-gray-600 truncate">
            {formData.attachment ? formData.attachment.name : t('no_file_chosen')}
          </span>
        </div>
      </div>
      
      <label className="block w-full">
        <span className="block mb-1 font-medium text-gray-700">{t('special_note_optional')}</span>
        <textarea
          name="note"
          value={formData.note}
          onChange={handleChange}
          placeholder={t('special_note')}
          rows={4}
          className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2"
          style={{ "--tw-ring-color": "#7A4F2A" } as React.CSSProperties}
        />
      </label>
      
      <SubmitButton 
        text={isSubmitting ? t('submitting') : t('submit')} 
        backgroundColor="#7A4F2A" 
        hoverColor="#6A4520"
        disabled={isSubmitting}
      />
    </form>
  );
}
