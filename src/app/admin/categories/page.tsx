"use client";

import { useState } from "react";
import { api } from "@/trpc/react";
import { useI18n } from "../../i18n";
import Link from "next/link";
import { FiPlus, FiEdit, FiTrash2, FiEye, FiEyeOff } from "react-icons/fi";

export default function CategoriesAdminPage() {
  const { t, locale } = useI18n();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [showCreateSubcategoryForm, setShowCreateSubcategoryForm] = useState<string | null>(null);

  // Get categories for admin
  const { data: categories, isLoading, refetch } = api.category.getAllForAdmin.useQuery();

  // Create category mutation
  const createCategoryMutation = api.category.create.useMutation({
    onSuccess: () => {
      refetch();
      setShowCreateForm(false);
    },
  });

  // Update category mutation
  const updateCategoryMutation = api.category.update.useMutation({
    onSuccess: () => {
      refetch();
      setEditingCategory(null);
    },
  });

  // Delete category mutation
  const deleteCategoryMutation = api.category.delete.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  // Create subcategory mutation
  const createSubcategoryMutation = api.category.subcategory.create.useMutation({
    onSuccess: () => {
      refetch();
      setShowCreateSubcategoryForm(null);
    },
  });

  // Delete subcategory mutation
  const deleteSubcategoryMutation = api.category.subcategory.delete.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const handleCreateCategory = (formData: FormData) => {
    const data = {
      nameEn: formData.get("nameEn") as string,
      nameVi: formData.get("nameVi") as string,
      slug: formData.get("slug") as string,
      descriptionEn: formData.get("descriptionEn") as string,
      descriptionVi: formData.get("descriptionVi") as string,
      image: formData.get("image") as string,
      color: formData.get("color") as string,
      icon: formData.get("icon") as string,
      displayOrder: parseInt(formData.get("displayOrder") as string) || 0,
    };

    createCategoryMutation.mutate(data);
  };

  const handleUpdateCategory = (formData: FormData) => {
    if (!editingCategory) return;

    const data = {
      id: editingCategory.id,
      nameEn: formData.get("nameEn") as string,
      nameVi: formData.get("nameVi") as string,
      slug: formData.get("slug") as string,
      descriptionEn: formData.get("descriptionEn") as string,
      descriptionVi: formData.get("descriptionVi") as string,
      image: formData.get("image") as string,
      color: formData.get("color") as string,
      icon: formData.get("icon") as string,
      displayOrder: parseInt(formData.get("displayOrder") as string) || 0,
      isActive: formData.get("isActive") === "true",
    };

    updateCategoryMutation.mutate(data);
  };

  const handleCreateSubcategory = (formData: FormData, categoryId: string) => {
    const data = {
      nameEn: formData.get("nameEn") as string,
      nameVi: formData.get("nameVi") as string,
      slug: formData.get("slug") as string,
      descriptionEn: formData.get("descriptionEn") as string,
      descriptionVi: formData.get("descriptionVi") as string,
      categoryId,
      displayOrder: parseInt(formData.get("displayOrder") as string) || 0,
    };

    createSubcategoryMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-100 py-10">
        <div className="container mx-auto px-4">
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#895D35] mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading categories...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100 py-10">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-display text-luxury mb-2">Category Management</h1>
            <p className="text-gray-600">Manage product categories and subcategories</p>
          </div>
          <div className="flex gap-4">
            <Link
              href="/admin"
              className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Back to Admin
            </Link>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-[#895D35] text-white px-4 py-2 rounded-lg hover:bg-[#7A4F2A] transition-colors flex items-center gap-2"
            >
              <FiPlus /> Create Category
            </button>
          </div>
        </div>

        {/* Create Category Form */}
        {showCreateForm && (
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-heading text-[#895D35] mb-6">Create New Category</h2>
            <form action={handleCreateCategory} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">English Name</label>
                <input
                  type="text"
                  name="nameEn"
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#895D35]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Vietnamese Name</label>
                <input
                  type="text"
                  name="nameVi"
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#895D35]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Slug</label>
                <input
                  type="text"
                  name="slug"
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#895D35]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Display Order</label>
                <input
                  type="number"
                  name="displayOrder"
                  defaultValue={0}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#895D35]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Image URL</label>
                <input
                  type="text"
                  name="image"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#895D35]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Color (CSS class)</label>
                <input
                  type="text"
                  name="color"
                  placeholder="bg-blue-50 border-blue-200"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#895D35]"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">English Description</label>
                <textarea
                  name="descriptionEn"
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#895D35]"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Vietnamese Description</label>
                <textarea
                  name="descriptionVi"
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#895D35]"
                />
              </div>
              <div className="md:col-span-2 flex gap-4">
                <button
                  type="submit"
                  disabled={createCategoryMutation.isPending}
                  className="bg-[#895D35] text-white px-6 py-2 rounded-lg hover:bg-[#7A4F2A] transition-colors disabled:opacity-50"
                >
                  {createCategoryMutation.isPending ? "Creating..." : "Create Category"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Categories List */}
        <div className="space-y-6">
          {categories?.map((category) => (
            <div key={category.id} className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-heading text-[#895D35] mb-2">
                    {locale === "vi" ? category.nameVi : category.nameEn}
                    {!category.isActive && <span className="text-red-500 ml-2">(Inactive)</span>}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Slug: {category.slug} | Products: {category._count.products} | Order: {category.displayOrder}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingCategory(category)}
                    className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                  >
                    <FiEdit />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("Are you sure you want to delete this category?")) {
                        deleteCategoryMutation.mutate({ id: category.id });
                      }
                    }}
                    className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                    disabled={category._count.products > 0}
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </div>

              {/* Subcategories */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lg font-medium text-gray-700">Subcategories</h4>
                  <button
                    onClick={() => setShowCreateSubcategoryForm(category.id)}
                    className="text-sm bg-green-500 text-white px-3 py-1 rounded-lg hover:bg-green-600 transition-colors flex items-center gap-1"
                  >
                    <FiPlus size={14} /> Add Subcategory
                  </button>
                </div>

                {/* Create Subcategory Form */}
                {showCreateSubcategoryForm === category.id && (
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <form
                      action={(formData) => handleCreateSubcategory(formData, category.id)}
                      className="grid grid-cols-1 md:grid-cols-2 gap-4"
                    >
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">English Name</label>
                        <input
                          type="text"
                          name="nameEn"
                          required
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#895D35]"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Vietnamese Name</label>
                        <input
                          type="text"
                          name="nameVi"
                          required
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#895D35]"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                        <input
                          type="text"
                          name="slug"
                          required
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#895D35]"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
                        <input
                          type="number"
                          name="displayOrder"
                          defaultValue={0}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#895D35]"
                        />
                      </div>
                      <div className="md:col-span-2 flex gap-2">
                        <button
                          type="submit"
                          disabled={createSubcategoryMutation.isPending}
                          className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 text-sm"
                        >
                          {createSubcategoryMutation.isPending ? "Creating..." : "Create"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowCreateSubcategoryForm(null)}
                          className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {category.subcategories.map((subcategory) => (
                    <div
                      key={subcategory.id}
                      className="bg-gray-50 rounded-lg p-3 flex justify-between items-center"
                    >
                      <div>
                        <div className="font-medium text-gray-800">
                          {locale === "vi" ? subcategory.nameVi : subcategory.nameEn}
                          {!subcategory.isActive && <span className="text-red-500 text-xs ml-1">(Inactive)</span>}
                        </div>
                        <div className="text-xs text-gray-500">
                          {subcategory.slug} | Products: {subcategory._count?.products || 0}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          if (confirm("Are you sure you want to delete this subcategory?")) {
                            deleteSubcategoryMutation.mutate({ id: subcategory.id });
                          }
                        }}
                        className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                        disabled={(subcategory._count?.products || 0) > 0}
                      >
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Edit Category Modal */}
        {editingCategory && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-heading text-[#895D35] mb-6">Edit Category</h2>
              <form action={handleUpdateCategory} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">English Name</label>
                  <input
                    type="text"
                    name="nameEn"
                    defaultValue={editingCategory.nameEn}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#895D35]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Vietnamese Name</label>
                  <input
                    type="text"
                    name="nameVi"
                    defaultValue={editingCategory.nameVi}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#895D35]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Slug</label>
                  <input
                    type="text"
                    name="slug"
                    defaultValue={editingCategory.slug}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#895D35]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Display Order</label>
                  <input
                    type="number"
                    name="displayOrder"
                    defaultValue={editingCategory.displayOrder}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#895D35]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Image URL</label>
                  <input
                    type="text"
                    name="image"
                    defaultValue={editingCategory.image || ""}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#895D35]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Color (CSS class)</label>
                  <input
                    type="text"
                    name="color"
                    defaultValue={editingCategory.color || ""}
                    placeholder="bg-blue-50 border-blue-200"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#895D35]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    name="isActive"
                    defaultValue={editingCategory.isActive.toString()}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#895D35]"
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">English Description</label>
                  <textarea
                    name="descriptionEn"
                    defaultValue={editingCategory.descriptionEn || ""}
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#895D35]"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Vietnamese Description</label>
                  <textarea
                    name="descriptionVi"
                    defaultValue={editingCategory.descriptionVi || ""}
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#895D35]"
                  />
                </div>
                <div className="md:col-span-2 flex gap-4">
                  <button
                    type="submit"
                    disabled={updateCategoryMutation.isPending}
                    className="bg-[#895D35] text-white px-6 py-2 rounded-lg hover:bg-[#7A4F2A] transition-colors disabled:opacity-50"
                  >
                    {updateCategoryMutation.isPending ? "Updating..." : "Update Category"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingCategory(null)}
                    className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
