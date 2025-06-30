"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useI18n } from "../i18n";
import { api } from "@/trpc/react";

type InquiryListItem = {
  id: string;
  productId: string;
  quantity: number;
  notes?: string | null;
  createdAt: Date;
  product: {
    id: string;
    slug: string;
    nameEn: string;
    nameVi: string;
    descriptionEn: string;
    descriptionVi: string;
    images: string[];
    room: string;
    type: string;
    categoryRef?: {
      nameEn: string;
      nameVi: string;
    } | null;
  };
};

export default function InquiryListPage() {
  const { t, locale } = useI18n();
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showSubmissionForm, setShowSubmissionForm] = useState(false);
  const [submissionForm, setSubmissionForm] = useState({
    customerName: '',
    customerEmail: '',
    companyName: '',
    phone: '',
    message: '',
  });
  
  // Get current user
  const { data: user } = api.user.getCurrentUserOptional.useQuery();
  const isWholesaleUser = user?.role?.name === 'wholesale';
  
  // Populate form with user data when user is loaded
  useEffect(() => {
    if (user) {
      setSubmissionForm(prev => ({
        ...prev,
        customerName: user.name || '',
        customerEmail: user.email || '',
        companyName: user.businessProfile?.companyName || '',
        phone: user.phone || '',
      }));
    }
  }, [user]);

  // Get inquiry list items
  const { data: inquiryItems, isLoading, refetch } = api.inquiryList.getItems.useQuery(
    undefined,
    { enabled: isWholesaleUser }
  );
  
  // Mutations
  const removeItem = api.inquiryList.removeItem.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const updateQuantity = api.inquiryList.updateQuantity.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const submitInquiry = api.inquiryList.submitInquiry.useMutation({
    onSuccess: () => {
      setSelectedItems([]);
      setShowSubmissionForm(false);
      setSubmissionForm({
        customerName: '',
        customerEmail: '',
        companyName: '',
        phone: '',
        message: '',
      });
      refetch();
      alert(t("inquiry_submitted"));
    },
    onError: (error) => {
      alert(t("inquiry_submit_error"));
    },
  });
  
  const clearAll = api.inquiryList.clearAll.useMutation({
    onSuccess: () => {
      setSelectedItems([]);
      refetch();
    },
  });

  const handleSelectItem = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleSelectAll = () => {
    if (selectedItems.length === inquiryItems?.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(inquiryItems?.map((item: InquiryListItem) => item.id) || []);
    }
  };

  const handleRemoveSelected = () => {
    if (selectedItems.length === 0) return;
    
    const itemsToRemove = inquiryItems?.filter((item: InquiryListItem) => selectedItems.includes(item.id));
    itemsToRemove?.forEach((item: InquiryListItem) => {
      removeItem.mutate({ productId: item.productId });
    });
    setSelectedItems([]);
  };

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    updateQuantity.mutate({ productId, quantity: newQuantity });
  };

  const handleSubmitInquiry = () => {
    if (selectedItems.length === 0) return;
    
    submitInquiry.mutate({
      selectedItemIds: selectedItems,
      customerName: submissionForm.customerName,
      customerEmail: submissionForm.customerEmail,
      companyName: submissionForm.companyName || undefined,
      phone: submissionForm.phone || undefined,
      message: submissionForm.message || undefined,
    });
  };

  if (!isWholesaleUser) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Access Restricted
          </h1>
          <p className="text-gray-600 mb-8">
            This page is only available to wholesale customers.
          </p>
          <Link 
            href="/contact"
            className="bg-[#895D35] text-white px-6 py-3 rounded-lg hover:bg-[#7A4F2A] transition"
          >
            Contact for Wholesale Account
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#895D35] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your inquiry list...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{t("my_inquiry_list")}</h1>
              <p className="text-gray-600 mt-1">
                {inquiryItems?.length || 0} {inquiryItems?.length === 1 ? 'item' : 'items'}
              </p>
            </div>
            <div className="flex space-x-4">
              {inquiryItems && inquiryItems.length > 0 && (
                <>
                  <button
                    onClick={handleSelectAll}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  >
                    {selectedItems.length === inquiryItems.length ? 'Deselect All' : 'Select All'}
                  </button>
                  {selectedItems.length > 0 && (
                    <>
                      <button
                        onClick={() => setShowSubmissionForm(true)}
                        className="px-4 py-2 bg-[#895D35] text-white rounded-lg hover:bg-[#7A4F2A] transition"
                        disabled={selectedItems.length === 0}
                      >
                        {t("submit_inquiry")} ({selectedItems.length})
                      </button>
                      <button
                        onClick={handleRemoveSelected}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                        disabled={removeItem.isPending}
                      >
                        Remove Selected ({selectedItems.length})
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => clearAll.mutate()}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
                    disabled={clearAll.isPending}
                  >
                    Clear All
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {!inquiryItems || inquiryItems.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 bg-gray-200 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">{t("inquiry_list_empty")}</h2>
            <p className="text-gray-600 mb-8">{t("add_products_to_inquiry")}</p>
            <Link 
              href="/catalogue"
              className="bg-[#895D35] text-white px-6 py-3 rounded-lg hover:bg-[#7A4F2A] transition"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="grid gap-6">
            {inquiryItems.map((item: InquiryListItem) => (
              <div key={item.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-start space-x-6">
                  {/* Checkbox */}
                  <div className="flex items-center pt-2">
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(item.id)}
                      onChange={() => handleSelectItem(item.id)}
                      className="w-4 h-4 text-[#895D35] border-gray-300 rounded focus:ring-[#895D35]"
                    />
                  </div>
                  
                  {/* Product Image */}
                  <div className="flex-shrink-0">
                    <div className="relative w-24 h-24 rounded-lg overflow-hidden">
                      <Image
                        src={item.product.images[0] || "/images/business-slide1.jpg"}
                        alt={locale === 'vi' ? item.product.nameVi : item.product.nameEn}
                        fill
                        style={{ objectFit: "cover" }}
                      />
                    </div>
                  </div>
                  
                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      <Link 
                        href={`/catalogue/${item.product.slug}`}
                        className="hover:text-[#895D35] transition"
                      >
                        {locale === 'vi' ? item.product.nameVi : item.product.nameEn}
                      </Link>
                    </h3>
                    <p className="text-gray-600 mb-2 line-clamp-2">
                      {locale === 'vi' ? item.product.descriptionVi : item.product.descriptionEn}
                    </p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                      <span>{item.product.room}</span>
                      <span>•</span>
                      <span>{item.product.type}</span>
                      {item.product.categoryRef && (
                        <>
                          <span>•</span>
                          <span>{locale === 'vi' ? item.product.categoryRef.nameVi : item.product.categoryRef.nameEn}</span>
                        </>
                      )}
                    </div>
                    
                    {/* Quantity Controls */}
                    <div className="flex items-center space-x-4 mb-3">
                      <span className="text-sm font-medium text-gray-700">{t("quantity")}:</span>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleQuantityChange(item.productId, item.quantity - 1)}
                          className="w-8 h-8 border border-gray-300 rounded flex items-center justify-center hover:bg-gray-50 transition"
                          disabled={item.quantity <= 1 || updateQuantity.isPending}
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="1"
                          max="9999"
                          value={item.quantity}
                          onChange={(e) => {
                            const newQuantity = parseInt(e.target.value) || 1;
                            if (newQuantity >= 1 && newQuantity <= 9999) {
                              handleQuantityChange(item.productId, newQuantity);
                            }
                          }}
                          className="w-16 h-8 text-center border border-gray-300 rounded focus:ring-[#895D35] focus:border-[#895D35] font-semibold"
                          disabled={updateQuantity.isPending}
                        />
                        <button
                          onClick={() => handleQuantityChange(item.productId, item.quantity + 1)}
                          className="w-8 h-8 border border-gray-300 rounded flex items-center justify-center hover:bg-gray-50 transition"
                          disabled={updateQuantity.isPending || item.quantity >= 9999}
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {item.notes && (
                      <div className="mt-3 p-3 bg-amber-50 rounded border border-amber-200">
                        <p className="text-sm text-amber-800">
                          <span className="font-medium">Notes:</span> {item.notes}
                        </p>
                      </div>
                    )}
                    <div className="mt-3 text-xs text-gray-400">
                      Added on {new Date(item.createdAt).toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US')}
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex-shrink-0 flex flex-col space-y-2">
                    <Link
                      href={`/catalogue/${item.product.slug}`}
                      className="px-4 py-2 bg-[#895D35] text-white text-sm rounded hover:bg-[#7A4F2A] transition text-center"
                    >
                      View Product
                    </Link>
                    <Link
                      href="/contact"
                      className="px-4 py-2 border border-[#895D35] text-[#895D35] text-sm rounded hover:bg-[#895D35] hover:text-white transition text-center"
                    >
                      Request Quote
                    </Link>
                    <button
                      onClick={() => removeItem.mutate({ productId: item.productId })}
                      className="px-4 py-2 border border-red-600 text-red-600 text-sm rounded hover:bg-red-600 hover:text-white transition"
                      disabled={removeItem.isPending}
                    >
                      {t("remove_from_inquiry_list")}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {inquiryItems && inquiryItems.length > 0 && (
          <div className="mt-8 p-6 bg-white rounded-lg border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4">Ready to make an inquiry?</h3>
            <p className="text-gray-600 mb-4">
              Contact our wholesale team to get detailed quotes and discuss your requirements.
            </p>
            <button
              onClick={() => setShowSubmissionForm(true)}
              className="bg-[#895D35] text-white px-6 py-3 rounded-lg hover:bg-[#7A4F2A] transition mr-4"
              disabled={selectedItems.length === 0}
            >
              {t("submit_selected_items")} ({selectedItems.length})
            </button>
            <Link
              href="/contact"
              className="border border-[#895D35] text-[#895D35] px-6 py-3 rounded-lg hover:bg-[#895D35] hover:text-white transition inline-block"
            >
              Contact Wholesale Team
            </Link>
          </div>
        )}
      </div>

      {/* Submission Form Modal */}
      {showSubmissionForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">{t("submit_inquiry")}</h2>
                <button
                  onClick={() => setShowSubmissionForm(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">{t("selected_items")} ({selectedItems.length}):</h3>
                <div className="space-y-3 max-h-40 overflow-y-auto">
                  {inquiryItems?.filter((item: InquiryListItem) => selectedItems.includes(item.id)).map((item: InquiryListItem) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div>
                        <span className="font-medium">{locale === 'vi' ? item.product.nameVi : item.product.nameEn}</span>
                        <span className="text-gray-600 ml-2">× {item.quantity}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Information Note */}
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start space-x-2">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-800">{t("account_info_secured")}</p>
                    <p className="text-sm text-blue-700 mt-1">{t("account_info_secured_desc")}</p>
                    <Link href="/profile" className="text-sm text-blue-600 hover:text-blue-800 underline mt-2 inline-block">
                      Update Profile Settings →
                    </Link>
                  </div>
                </div>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); handleSubmitInquiry(); }} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t("customer_name")} *
                      {user?.name && (
                        <span className="text-xs text-green-600 ml-2">{t("from_your_account")}</span>
                      )}
                    </label>
                    <input
                      type="text"
                      required
                      value={submissionForm.customerName}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t("customer_email")} *
                      {user?.email && (
                        <span className="text-xs text-green-600 ml-2">{t("from_your_account")}</span>
                      )}
                    </label>
                    <input
                      type="email"
                      required
                      value={submissionForm.customerEmail}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t("company_name")}
                      {user?.businessProfile?.companyName && (
                        <span className="text-xs text-green-600 ml-2">{t("from_your_account")}</span>
                      )}
                    </label>
                    <input
                      type="text"
                      value={submissionForm.companyName}
                      readOnly={!!user?.businessProfile?.companyName}
                      onChange={!user?.businessProfile?.companyName ? (e) => setSubmissionForm({...submissionForm, companyName: e.target.value}) : undefined}
                      placeholder={!user?.businessProfile?.companyName ? "Enter your company name" : ""}
                      className={`w-full px-3 py-2 border border-gray-300 rounded-lg ${
                        user?.businessProfile?.companyName 
                          ? 'bg-gray-50 text-gray-700 cursor-not-allowed' 
                          : 'focus:ring-[#895D35] focus:border-[#895D35]'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t("phone_number")}
                      {user?.phone && (
                        <span className="text-xs text-green-600 ml-2">{t("from_your_account")}</span>
                      )}
                    </label>
                    <input
                      type="tel"
                      value={submissionForm.phone}
                      readOnly={!!user?.phone}
                      onChange={!user?.phone ? (e) => setSubmissionForm({...submissionForm, phone: e.target.value}) : undefined}
                      placeholder={!user?.phone ? "Enter your phone number" : ""}
                      className={`w-full px-3 py-2 border border-gray-300 rounded-lg ${
                        user?.phone 
                          ? 'bg-gray-50 text-gray-700 cursor-not-allowed' 
                          : 'focus:ring-[#895D35] focus:border-[#895D35]'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t("additional_message")}</label>
                  <textarea
                    rows={4}
                    value={submissionForm.message}
                    onChange={(e) => setSubmissionForm({...submissionForm, message: e.target.value})}
                    placeholder={t("message_placeholder")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#895D35] focus:border-[#895D35]"
                  />
                </div>

                <div className="flex justify-end space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowSubmissionForm(false)}
                    className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  >
                    {t("cancel")}
                  </button>
                  <button
                    type="submit"
                    disabled={submitInquiry.isPending || !submissionForm.customerName || !submissionForm.customerEmail}
                    className="px-6 py-2 bg-[#895D35] text-white rounded-lg hover:bg-[#7A4F2A] transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitInquiry.isPending ? t("submitting") : t("submit_inquiry")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
