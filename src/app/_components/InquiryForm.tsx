'use client';

import { useState } from "react";
import SubmitButton from "./SubmitButton";

export default function InquiryForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    service: "",
    note: ""
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: 'success' | 'error',
    message: string
  } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);
    
    try {
      const response = await fetch('/api/inquiry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
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
        note: ""
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
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        <select 
          name="service"
          value={formData.service}
          onChange={handleChange}
          required
          className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 appearance-none"
          style={{ "--tw-ring-color": "#7A4F2A" } as React.CSSProperties}
        >
          <option value="">Select A Service</option>
          <option value="general-carpentry">General Carpentry</option>
          <option value="furniture-manufacturing">Furniture Manufacturing</option>
          <option value="furniture-remodeling">Furniture Remodeling</option>
          <option value="wooden-floor">Wooden Floor</option>
          <option value="wooden-furniture">Wooden Furniture</option>
          <option value="custom-work">Custom Work</option>
        </select>
      </div>
      
      <textarea
        name="note"
        value={formData.note}
        onChange={handleChange}
        placeholder="Special Note"
        rows={4}
        className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2"
        style={{ "--tw-ring-color": "#7A4F2A" } as React.CSSProperties}
      />
      
      <SubmitButton 
        text={isSubmitting ? "Submitting..." : "Submit"} 
        backgroundColor="#7A4F2A" 
        hoverColor="#6A4520"
        disabled={isSubmitting}
      />
    </form>
  );
}