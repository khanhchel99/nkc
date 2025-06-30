"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { api } from "@/trpc/react";
import Image from "next/image";
import type { Decimal } from "@prisma/client/runtime/library";

type FormData = {
  nameEn: string;
  nameVi: string;
  slug: string;
  descriptionEn: string;
  descriptionVi: string;
  price: number;
  wholesalePrice?: number;
  originalPrice?: number;
  stock: number;
  images: string[];
  categoryId?: string;
  subcategoryId?: string;
  room: string;
  type: string;
  category: string;
  combo?: string;
  inStock: boolean;
  featured: boolean;
  featuresEn: string[];
  featuresVi: string[];
  longDescriptionEn?: string;
  longDescriptionVi?: string;
  metaDescriptionEn?: string;
  metaDescriptionVi?: string;
  metaTitleEn?: string;
  metaTitleVi?: string;
  specificationsEn?: Record<string, any>;
  specificationsVi?: Record<string, any>;
};

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;
  
  const [toast, setToast] = useState<{message: string; type: 'success' | 'error'} | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [formData, setFormData] = useState<FormData>({
    nameEn: "",
    nameVi: "",
    slug: "",
    descriptionEn: "",
    descriptionVi: "",
    price: 0,
    stock: 0,
    images: [],
    room: "",
    type: "",
    category: "",
    inStock: true,
    featured: false,
    featuresEn: [],
    featuresVi: [],
  });

  const [newFeatureEn, setNewFeatureEn] = useState("");
  const [newFeatureVi, setNewFeatureVi] = useState("");
  const [newImage, setNewImage] = useState("");
  const [activeTab, setActiveTab] = useState<'basic' | 'seo' | 'advanced'>('basic');
  
  // Specification editing states
  const [newSpecKeyEn, setNewSpecKeyEn] = useState("");
  const [newSpecValueEn, setNewSpecValueEn] = useState("");
  const [newSpecKeyVi, setNewSpecKeyVi] = useState("");
  const [newSpecValueVi, setNewSpecValueVi] = useState("");

  // API queries
  const { data: product, isLoading: productLoading } = api.productManagement.getProduct.useQuery(
    { id: productId },
    { enabled: !!productId }
  );
  const { data: filterOptions } = api.productManagement.getFilterOptions.useQuery();

  // Mutations
  const updateProduct = api.productManagement.updateProduct.useMutation({
    onSuccess: () => {
      setToast({ message: 'Product updated successfully!', type: 'success' });
      setTimeout(() => {
        router.push('/admin/products');
      }, 1500);
    },
    onError: (error) => {
      setToast({ message: error.message, type: 'error' });
      setTimeout(() => setToast(null), 3000);
      setIsSubmitting(false);
    },
  });

  // Load product data
  useEffect(() => {
    if (product) {
      setFormData({
        nameEn: product.nameEn,
        nameVi: product.nameVi,
        slug: product.slug,
        descriptionEn: product.descriptionEn,
        descriptionVi: product.descriptionVi,
        price: Number(product.price),
        wholesalePrice: product.wholesalePrice ? Number(product.wholesalePrice) : undefined,
        originalPrice: product.originalPrice ? Number(product.originalPrice) : undefined,
        stock: product.stock,
        images: product.images,
        categoryId: product.categoryId || undefined,
        subcategoryId: product.subcategoryId || undefined,
        room: product.room,
        type: product.type,
        category: product.category,
        combo: product.combo || undefined,
        inStock: product.inStock,
        featured: product.featured,
        featuresEn: product.featuresEn || [],
        featuresVi: product.featuresVi || [],
        longDescriptionEn: product.longDescriptionEn || undefined,
        longDescriptionVi: product.longDescriptionVi || undefined,
        metaDescriptionEn: product.metaDescriptionEn || undefined,
        metaDescriptionVi: product.metaDescriptionVi || undefined,
        metaTitleEn: product.metaTitleEn || undefined,
        metaTitleVi: product.metaTitleVi || undefined,
        specificationsEn: (product.specificationsEn as Record<string, any>) || {},
        specificationsVi: (product.specificationsVi as Record<string, any>) || {},
      });
      setIsLoading(false);
    }
  }, [product]);

  // Form handlers
  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addFeature = (lang: 'en' | 'vi') => {
    const newFeature = lang === 'en' ? newFeatureEn : newFeatureVi;
    if (!newFeature.trim()) return;

    const field = lang === 'en' ? 'featuresEn' : 'featuresVi';
    updateFormData(field, [...formData[field], newFeature.trim()]);
    
    if (lang === 'en') {
      setNewFeatureEn("");
    } else {
      setNewFeatureVi("");
    }
  };

  const removeFeature = (lang: 'en' | 'vi', index: number) => {
    const field = lang === 'en' ? 'featuresEn' : 'featuresVi';
    const features = [...formData[field]];
    features.splice(index, 1);
    updateFormData(field, features);
  };

  const addImage = () => {
    if (!newImage.trim()) return;
    updateFormData('images', [...formData.images, newImage.trim()]);
    setNewImage("");
  };

  const removeImage = (index: number) => {
    const images = [...formData.images];
    images.splice(index, 1);
    updateFormData('images', images);
  };

  const addSpecification = (lang: 'en' | 'vi') => {
    const key = lang === 'en' ? newSpecKeyEn : newSpecKeyVi;
    const value = lang === 'en' ? newSpecValueEn : newSpecValueVi;
    
    if (!key.trim() || !value.trim()) return;

    const field = lang === 'en' ? 'specificationsEn' : 'specificationsVi';
    const specs = { ...formData[field] };
    specs[key.trim()] = value.trim();
    updateFormData(field, specs);
    
    if (lang === 'en') {
      setNewSpecKeyEn("");
      setNewSpecValueEn("");
    } else {
      setNewSpecKeyVi("");
      setNewSpecValueVi("");
    }
  };

  const removeSpecification = (lang: 'en' | 'vi', key: string) => {
    const field = lang === 'en' ? 'specificationsEn' : 'specificationsVi';
    const specs = { ...formData[field] };
    delete specs[key];
    updateFormData(field, specs);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validation
    if (!formData.nameEn || !formData.nameVi || !formData.slug || 
        !formData.descriptionEn || !formData.descriptionVi || 
        formData.images.length === 0) {
      setToast({ message: 'Please fill in all required fields', type: 'error' });
      setTimeout(() => setToast(null), 3000);
      setIsSubmitting(false);
      return;
    }

    updateProduct.mutate({ id: productId, ...formData });
  };

  if (productLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#895D35] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading product...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h1>
          <button
            onClick={() => router.push('/admin/products')}
            className="px-6 py-2 bg-[#895D35] text-white rounded-lg hover:bg-[#7A4F2A] transition"
          >
            Back to Products
          </button>
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
              <h1 className="text-3xl font-bold text-gray-900">Edit Product</h1>
              <p className="text-gray-600 mt-1">{product.nameEn}</p>
            </div>
            <nav className="flex space-x-4 text-sm">
              <a href="/admin" className="text-[#895D35] hover:text-[#7A4F2A] font-medium">
                Admin Dashboard
              </a>
              <span className="text-gray-400">→</span>
              <a href="/admin/products" className="text-[#895D35] hover:text-[#7A4F2A] font-medium">
                Products
              </a>
              <span className="text-gray-400">→</span>
              <span className="text-gray-600">Edit</span>
            </nav>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="container mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          {/* Tab Navigation */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6">
                {[
                  { id: 'basic', label: 'Basic Information' },
                  { id: 'seo', label: 'SEO & Meta' },
                  { id: 'advanced', label: 'Advanced' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-[#895D35] text-[#895D35]'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-6">
              {/* Basic Information Tab */}
              {activeTab === 'basic' && (
                <div className="space-y-6">
                  {/* Names */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Product Name (English) *
                      </label>
                      <input
                        type="text"
                        value={formData.nameEn}
                        onChange={(e) => updateFormData('nameEn', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#895D35] focus:border-[#895D35]"
                        placeholder="Enter English name"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Product Name (Vietnamese) *
                      </label>
                      <input
                        type="text"
                        value={formData.nameVi}
                        onChange={(e) => updateFormData('nameVi', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#895D35] focus:border-[#895D35]"
                        placeholder="Enter Vietnamese name"
                        required
                      />
                    </div>
                  </div>

                  {/* Slug */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      URL Slug *
                    </label>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) => updateFormData('slug', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#895D35] focus:border-[#895D35]"
                      placeholder="product-url-slug"
                      required
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      This will be used in the product URL
                    </p>
                  </div>

                  {/* Descriptions */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description (English) *
                      </label>
                      <textarea
                        value={formData.descriptionEn}
                        onChange={(e) => updateFormData('descriptionEn', e.target.value)}
                        rows={4}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#895D35] focus:border-[#895D35]"
                        placeholder="Enter English description"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description (Vietnamese) *
                      </label>
                      <textarea
                        value={formData.descriptionVi}
                        onChange={(e) => updateFormData('descriptionVi', e.target.value)}
                        rows={4}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#895D35] focus:border-[#895D35]"
                        placeholder="Enter Vietnamese description"
                        required
                      />
                    </div>
                  </div>

                  {/* Pricing */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Price ($) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.price}
                        onChange={(e) => updateFormData('price', parseFloat(e.target.value) || 0)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#895D35] focus:border-[#895D35]"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Wholesale Price ($)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.wholesalePrice || ''}
                        onChange={(e) => updateFormData('wholesalePrice', e.target.value ? parseFloat(e.target.value) : undefined)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#895D35] focus:border-[#895D35]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Original Price ($)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.originalPrice || ''}
                        onChange={(e) => updateFormData('originalPrice', e.target.value ? parseFloat(e.target.value) : undefined)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#895D35] focus:border-[#895D35]"
                      />
                    </div>
                  </div>

                  {/* Stock */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Stock Quantity
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.stock}
                        onChange={(e) => updateFormData('stock', parseInt(e.target.value) || 0)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#895D35] focus:border-[#895D35]"
                      />
                    </div>
                    <div className="flex items-center space-x-6 pt-8">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.inStock}
                          onChange={(e) => updateFormData('inStock', e.target.checked)}
                          className="h-4 w-4 text-[#895D35] focus:ring-[#895D35] border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">In Stock</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.featured}
                          onChange={(e) => updateFormData('featured', e.target.checked)}
                          className="h-4 w-4 text-[#895D35] focus:ring-[#895D35] border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">Featured</span>
                      </label>
                    </div>
                  </div>

                  {/* Categories */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category
                      </label>
                      <select
                        value={formData.categoryId || ''}
                        onChange={(e) => updateFormData('categoryId', e.target.value || undefined)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#895D35] focus:border-[#895D35]"
                      >
                        <option value="">Select category</option>
                        {filterOptions?.categories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.nameEn}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Room *
                      </label>
                      <input
                        type="text"
                        value={formData.room}
                        onChange={(e) => updateFormData('room', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#895D35] focus:border-[#895D35]"
                        placeholder="e.g., Living Room, Bedroom"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Type *
                      </label>
                      <input
                        type="text"
                        value={formData.type}
                        onChange={(e) => updateFormData('type', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#895D35] focus:border-[#895D35]"
                        placeholder="e.g., Chair, Table, Sofa"
                        required
                      />
                    </div>
                  </div>

                  {/* Category and Combo */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category Tag *
                      </label>
                      <input
                        type="text"
                        value={formData.category}
                        onChange={(e) => updateFormData('category', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#895D35] focus:border-[#895D35]"
                        placeholder="e.g., furniture, decor"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Combo
                      </label>
                      <input
                        type="text"
                        value={formData.combo || ''}
                        onChange={(e) => updateFormData('combo', e.target.value || undefined)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#895D35] focus:border-[#895D35]"
                        placeholder="Combo name if applicable"
                      />
                    </div>
                  </div>

                  {/* Images */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Product Images *
                    </label>
                    <div className="space-y-4">
                      <div className="flex space-x-2">
                        <input
                          type="url"
                          value={newImage}
                          onChange={(e) => setNewImage(e.target.value)}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#895D35] focus:border-[#895D35]"
                          placeholder="Enter image URL"
                        />
                        <button
                          type="button"
                          onClick={addImage}
                          className="px-4 py-2 bg-[#895D35] text-white rounded-lg hover:bg-[#7A4F2A] transition"
                        >
                          Add
                        </button>
                      </div>
                      
                      {formData.images.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {formData.images.map((image, index) => (
                            <div key={index} className="relative group">
                              <div className="w-full h-32 bg-gray-200 rounded-lg overflow-hidden">
                                <Image
                                  src={image}
                                  alt={`Product image ${index + 1}`}
                                  width={200}
                                  height={200}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => removeImage(index)}
                                className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {formData.images.length === 0 && (
                        <p className="text-sm text-red-500">At least one image is required</p>
                      )}
                    </div>
                  </div>

                  {/* Features */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Features (English)
                      </label>
                      <div className="space-y-2">
                        <div className="flex space-x-2">
                          <input
                            type="text"
                            value={newFeatureEn}
                            onChange={(e) => setNewFeatureEn(e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#895D35] focus:border-[#895D35]"
                            placeholder="Add feature"
                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature('en'))}
                          />
                          <button
                            type="button"
                            onClick={() => addFeature('en')}
                            className="px-3 py-2 bg-[#895D35] text-white rounded-lg hover:bg-[#7A4F2A] transition text-sm"
                          >
                            Add
                          </button>
                        </div>
                        {formData.featuresEn.map((feature, index) => (
                          <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded">
                            <span className="text-sm">{feature}</span>
                            <button
                              type="button"
                              onClick={() => removeFeature('en', index)}
                              className="text-red-500 hover:text-red-700 text-sm"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Features (Vietnamese)
                      </label>
                      <div className="space-y-2">
                        <div className="flex space-x-2">
                          <input
                            type="text"
                            value={newFeatureVi}
                            onChange={(e) => setNewFeatureVi(e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#895D35] focus:border-[#895D35]"
                            placeholder="Thêm tính năng"
                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature('vi'))}
                          />
                          <button
                            type="button"
                            onClick={() => addFeature('vi')}
                            className="px-3 py-2 bg-[#895D35] text-white rounded-lg hover:bg-[#7A4F2A] transition text-sm"
                          >
                            Add
                          </button>
                        </div>
                        {formData.featuresVi.map((feature, index) => (
                          <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded">
                            <span className="text-sm">{feature}</span>
                            <button
                              type="button"
                              onClick={() => removeFeature('vi', index)}
                              className="text-red-500 hover:text-red-700 text-sm"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SEO Tab */}
              {activeTab === 'seo' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Meta Title (English)
                      </label>
                      <input
                        type="text"
                        value={formData.metaTitleEn || ''}
                        onChange={(e) => updateFormData('metaTitleEn', e.target.value || undefined)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#895D35] focus:border-[#895D35]"
                        placeholder="SEO title for search engines"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Meta Title (Vietnamese)
                      </label>
                      <input
                        type="text"
                        value={formData.metaTitleVi || ''}
                        onChange={(e) => updateFormData('metaTitleVi', e.target.value || undefined)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#895D35] focus:border-[#895D35]"
                        placeholder="Tiêu đề SEO cho công cụ tìm kiếm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Meta Description (English)
                      </label>
                      <textarea
                        value={formData.metaDescriptionEn || ''}
                        onChange={(e) => updateFormData('metaDescriptionEn', e.target.value || undefined)}
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#895D35] focus:border-[#895D35]"
                        placeholder="SEO description for search engines"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Meta Description (Vietnamese)
                      </label>
                      <textarea
                        value={formData.metaDescriptionVi || ''}
                        onChange={(e) => updateFormData('metaDescriptionVi', e.target.value || undefined)}
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#895D35] focus:border-[#895D35]"
                        placeholder="Mô tả SEO cho công cụ tìm kiếm"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Advanced Tab */}
              {activeTab === 'advanced' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Long Description (English)
                      </label>
                      <textarea
                        value={formData.longDescriptionEn || ''}
                        onChange={(e) => updateFormData('longDescriptionEn', e.target.value || undefined)}
                        rows={6}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#895D35] focus:border-[#895D35]"
                        placeholder="Detailed product description"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Long Description (Vietnamese)
                      </label>
                      <textarea
                        value={formData.longDescriptionVi || ''}
                        onChange={(e) => updateFormData('longDescriptionVi', e.target.value || undefined)}
                        rows={6}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#895D35] focus:border-[#895D35]"
                        placeholder="Mô tả chi tiết sản phẩm"
                      />
                    </div>
                  </div>

                  {/* Specifications */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Specifications (English)
                      </label>
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={newSpecKeyEn}
                            onChange={(e) => setNewSpecKeyEn(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#895D35] focus:border-[#895D35]"
                            placeholder="Specification name"
                          />
                          <input
                            type="text"
                            value={newSpecValueEn}
                            onChange={(e) => setNewSpecValueEn(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#895D35] focus:border-[#895D35]"
                            placeholder="Value"
                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSpecification('en'))}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => addSpecification('en')}
                          className="w-full px-3 py-2 bg-[#895D35] text-white rounded-lg hover:bg-[#7A4F2A] transition text-sm"
                        >
                          Add Specification
                        </button>
                        {formData.specificationsEn && Object.entries(formData.specificationsEn).map(([key, value]) => (
                          <div key={key} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded">
                            <span className="text-sm"><strong>{key}:</strong> {String(value)}</span>
                            <button
                              type="button"
                              onClick={() => removeSpecification('en', key)}
                              className="text-red-500 hover:text-red-700 text-sm"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Specifications (Vietnamese)
                      </label>
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={newSpecKeyVi}
                            onChange={(e) => setNewSpecKeyVi(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#895D35] focus:border-[#895D35]"
                            placeholder="Tên thông số"
                          />
                          <input
                            type="text"
                            value={newSpecValueVi}
                            onChange={(e) => setNewSpecValueVi(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#895D35] focus:border-[#895D35]"
                            placeholder="Giá trị"
                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSpecification('vi'))}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => addSpecification('vi')}
                          className="w-full px-3 py-2 bg-[#895D35] text-white rounded-lg hover:bg-[#7A4F2A] transition text-sm"
                        >
                          Thêm thông số
                        </button>
                        {formData.specificationsVi && Object.entries(formData.specificationsVi).map(([key, value]) => (
                          <div key={key} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded">
                            <span className="text-sm"><strong>{key}:</strong> {String(value)}</span>
                            <button
                              type="button"
                              onClick={() => removeSpecification('vi', key)}
                              className="text-red-500 hover:text-red-700 text-sm"
                            >
                              Xóa
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => router.push('/admin/products')}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => window.open(`/catalogue/${product.slug}`, '_blank')}
                className="px-6 py-2 border border-[#895D35] text-[#895D35] rounded-lg hover:bg-[#895D35] hover:text-white transition"
              >
                Preview
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-[#895D35] text-white rounded-lg hover:bg-[#7A4F2A] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isSubmitting && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                )}
                <span>{isSubmitting ? 'Updating...' : 'Update Product'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg transition-all ${
          toast.type === 'success' 
            ? 'bg-green-500 text-white' 
            : 'bg-red-500 text-white'
        }`}>
          <div className="flex items-center space-x-2">
            {toast.type === 'success' ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
