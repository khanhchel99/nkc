"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/trpc/react";
import { useI18n } from "../../i18n";

export default function EditProfile() {
  const { t } = useI18n();
  const router = useRouter();
  const { data: user, isLoading } = api.user.getCurrentUser.useQuery();
  
  const [formData, setFormData] = useState({
    name: "",
    title: "",
    company: "",
    phone: "",
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Initialize form data once user data is loaded
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name ?? "",
        title: user.title ?? "",
        company: user.company ?? "",
        phone: user.phone ?? "",
      });
    }
  }, [user]);
  
  const updateProfile = api.user.updateProfile.useMutation({
    onSuccess: () => {
      router.push("/");
      router.refresh();
    },
  });
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await updateProfile.mutateAsync(formData);
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto">
          <div className="bg-amber-50 rounded-lg shadow-md p-8 text-center">
            <p className="text-[#895D35]">{t('loading_profile')}</p>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-md mx-auto">
        <div className="bg-amber-50 rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold mb-6 text-[#895D35]">{t('edit_profile')}</h1>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-[#895D35] mb-1">
                {t('name')}
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-amber-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#895D35]"
              />
            </div>
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-[#895D35] mb-1">
                {t('title_position')}
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-amber-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#895D35]"
              />
            </div>
            <div>
              <label htmlFor="company" className="block text-sm font-medium text-[#895D35] mb-1">
                {t('company')}
              </label>
              <input
                type="text"
                id="company"
                name="company"
                value={formData.company}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-amber-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#895D35]"
              />
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-[#895D35] mb-1">
                {t('phone')}
              </label>
              <input
                type="text"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-amber-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#895D35]"
              />
            </div>
            <div className="flex justify-between pt-4">
              <Link href="/" className="px-4 py-2 border border-[#895D35] text-[#895D35] rounded hover:bg-amber-100">
                {t('cancel')}
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-[#895D35] text-white rounded hover:bg-[#7A4F2A] disabled:opacity-50"
              >
                {isSubmitting ? t('saving') : t('save_changes')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}