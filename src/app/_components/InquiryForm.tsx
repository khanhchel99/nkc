'use client';

import { useState } from "react";
import SubmitButton from "./SubmitButton";

export default function InquiryForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    service: "",
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
      formPayload.append("service", formData.service);
      formPayload.append("note", formData.note);
      if (formData.companyName) formPayload.append("companyName", formData.companyName);
      if (formData.attachment) formPayload.append("attachment", formData.attachment);

      const response = await fetch('/api/inquiry', {
        method: 'POST',
        body: formPayload,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit form");
      }
      
      setSubmitStatus({
        type: 'success',
        message: 'Thank you! Your inquiry has been submitted successfully.'
      });
      
      // Clear form data
      setFormData({
        name: "",
        email: "",
        mobile: "",
        service: "",
        note: "",
        companyName: "",
        attachment: null,
      });
      
    } catch (error) {
      console.error("Error submitting form:", error);
      setSubmitStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to submit the form. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {submitStatus && (
        <div className={`p-3 rounded-md ${
          submitStatus.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {submitStatus.message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="block w-full">
          <span className="block mb-1 font-medium text-gray-700">Your Name <span className="text-red-500">*</span></span>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Your Name"
            required
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2"
            style={{ "--tw-ring-color": "#7A4F2A" } as React.CSSProperties}
          />
        </label>
        <label className="block w-full">
          <span className="block mb-1 font-medium text-gray-700">Your Email <span className="text-red-500">*</span></span>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Your Email"
            required
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2"
            style={{ "--tw-ring-color": "#7A4F2A" } as React.CSSProperties}
          />
        </label>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="block w-full">
          <span className="block mb-1 font-medium text-gray-700">Your Mobile <span className="text-red-500">*</span></span>
          <input
            type="tel"
            name="mobile"
            value={formData.mobile}
            onChange={handleChange}
            placeholder="Your Mobile"
            required
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2"
            style={{ "--tw-ring-color": "#7A4F2A" } as React.CSSProperties}
          />
        </label>
        <label className="block w-full">
          <span className="block mb-1 font-medium text-gray-700">Select A Service <span className="text-red-500">*</span></span>
          <div className="relative">
            <select
              name="service"
              value={formData.service}
              onChange={handleChange}
              required
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 appearance-none font-normal text-gray-400 pr-10 bg-white placeholder-gray-400"
              style={{ "--tw-ring-color": "#7A4F2A" } as React.CSSProperties}
            >
              <option value="" disabled hidden className="text-gray-400 font-normal">Select A Service</option>
              <option value="general-carpentry" className="text-gray-800">General Carpentry</option>
              <option value="furniture-manufacturing" className="text-gray-800">Furniture Manufacturing</option>
              <option value="furniture-remodeling" className="text-gray-800">Furniture Remodeling</option>
              <option value="wooden-floor" className="text-gray-800">Wooden Floor</option>
              <option value="wooden-furniture" className="text-gray-800">Wooden Furniture</option>
              <option value="custom-work" className="text-gray-800">Custom Work</option>
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
        placeholder="Company Name (optional)"
        className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2"
        style={{ "--tw-ring-color": "#7A4F2A" } as React.CSSProperties}
      />
      <div className="mb-4">
        <span className="block mb-1 font-medium text-gray-700">Attachment (optional)</span>
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
            Choose File
          </button>
          <span className="ml-3 text-gray-600 truncate">{formData.attachment ? formData.attachment.name : "No file chosen"}</span>
        </div>
      </div>
      <label className="block w-full">
        <span className="block mb-1 font-medium text-gray-700">Special Note (optional)</span>
        <textarea
          name="note"
          value={formData.note}
          onChange={handleChange}
          placeholder="Special Note"
          rows={4}
          className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2"
          style={{ "--tw-ring-color": "#7A4F2A" } as React.CSSProperties}
        />
      </label>
      
      <SubmitButton 
        text={isSubmitting ? "Submitting..." : "Submit"} 
        backgroundColor="#7A4F2A" 
        hoverColor="#6A4520"
        disabled={isSubmitting}
      />
    </form>
  );
}