"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { api } from "@/trpc/react";
import { useI18n } from "../i18n";

// Default images and colors for categories
const categoryDefaults = {
  images: [
    "/images/business-slide1.jpg",
    "/images/business-slide2.jpg", 
    "/images/business-slide3.jpg",
    "/images/business-slide5.jpg",
    "/images/business-slide6.jpg"
  ],
  colors: [
    "bg-amber-50 border-amber-200",
    "bg-blue-50 border-blue-200", 
    "bg-green-50 border-green-200",
    "bg-gray-50 border-gray-200",
    "bg-orange-50 border-orange-200",
    "bg-emerald-50 border-emerald-200",
    "bg-purple-50 border-purple-200",
    "bg-rose-50 border-rose-200"
  ]
};

export default function CategoriesPage() {
  const { locale, t, isTranslationsLoaded } = useI18n();

  // Get dynamic categories from database
  const { data: categories, isLoading: categoriesLoading } = api.category.getAll.useQuery();

  // Helper function to get category display name based on locale
  const getCategoryName = (category: any) => {
    return locale === 'vi' ? category.nameVi : category.nameEn;
  };

  // Helper function to get category description based on locale  
  const getCategoryDescription = (category: any) => {
    return locale === 'vi' ? category.descriptionVi : category.descriptionEn;
  };

  // Helper function to get default image and color for category
  const getCategoryDefaults = (index: number) => {
    const imageIndex = index % categoryDefaults.images.length;
    const colorIndex = index % categoryDefaults.colors.length;
    return {
      image: categoryDefaults.images[imageIndex],
      color: categoryDefaults.colors[colorIndex]
    };
  };

  if (categoriesLoading) {
    return (
      <main className="min-h-screen bg-stone-100 py-10">
        <div className="container mx-auto px-4">
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#895D35] mx-auto"></div>
            <p className="mt-4 text-gray-600">
              {isTranslationsLoaded ? t("loading_categories") : "Loading categories..."}
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-stone-100 py-10">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12 py-6">
          <h1 className="text-5xl font-display text-luxury vietnamese-safe mb-8 px-4">{t("furniture_categories")}</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed px-4">
            {t("browse_by_room_desc")}
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {categories?.map((category, index) => {
            const defaults = getCategoryDefaults(index);
            const productCount = category._count.products;
            const displayImage = category.image || defaults.image;
            const displayColor = category.color || defaults.color;
            
            return (
              <Link
                key={category.id}
                href={`/catalogue/category/${category.slug}`}
                className={`${displayColor} border-2 rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 group`}
              >
                {/* Category Image */}
                <div className="relative h-48 w-full overflow-hidden">
                  <Image
                    src={displayImage}
                    alt={getCategoryName(category)}
                    fill
                    style={{ objectFit: "cover" }}
                    className="group-hover:scale-110 transition-transform duration-300"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-300"></div>
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1">
                    <span className="text-sm font-semibold text-[#895D35]">
                      {productCount} {t("products")}
                    </span>
                  </div>
                </div>

                {/* Category Content */}
                <div className="p-6">
                  <h3 className="text-2xl font-heading text-[#895D35] mb-3 group-hover:text-[#7A4F2A] transition-colors">
                    {getCategoryName(category)}
                  </h3>
                  <p className="text-gray-600 mb-4 line-clamp-2 leading-relaxed">
                    {getCategoryDescription(category)}
                  </p>
                  
                  {/* Subcategories Preview */}
                  {category.subcategories && category.subcategories.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {category.subcategories.slice(0, 3).map((subcategory) => (
                        <span
                          key={subcategory.id}
                          className="bg-white/80 text-[#895D35] px-3 py-1 rounded-full text-sm font-medium"
                        >
                          {locale === 'vi' ? subcategory.nameVi : subcategory.nameEn}
                        </span>
                      ))}
                      {category.subcategories.length > 3 && (
                        <span className="bg-white/80 text-[#895D35] px-3 py-1 rounded-full text-sm font-medium">
                          +{category.subcategories.length - 3} {t("more")}
                        </span>
                      )}
                    </div>
                  )}

                  {/* CTA */}
                  <div className="flex items-center justify-between">
                    <span className="text-[#895D35] font-semibold group-hover:text-[#7A4F2A] transition-colors">
                      {t("browse_category")}
                    </span>
                    <svg 
                      className="w-5 h-5 text-[#895D35] group-hover:text-[#7A4F2A] group-hover:translate-x-1 transition-all" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Featured Categories or Quick Actions */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-3xl font-heading text-luxury mb-8 text-center">{t("quick_browse")}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <Link 
              href="/catalogue/featured" 
              className="luxury-gold text-white p-6 rounded-xl text-center hover:scale-105 transition-all duration-300 transform shadow-lg hover:shadow-2xl"
            >
              <div className="text-3xl mb-3">⭐</div>
              <div className="font-heading text-lg">{t("featured_products")}</div>
            </Link>
            <Link 
              href="/catalogue/sale" 
              className="luxury-crimson text-white p-6 rounded-xl text-center hover:scale-105 transition-all duration-300 transform shadow-lg hover:shadow-2xl"
            >
              <div className="text-3xl mb-3">🏷️</div>
              <div className="font-heading text-lg">{t("on_sale")}</div>
            </Link>
            <Link 
              href="/catalogue/new" 
              className="luxury-emerald text-white p-6 rounded-xl text-center hover:scale-105 transition-all duration-300 transform shadow-lg hover:shadow-2xl"
            >
              <div className="text-3xl mb-3">🆕</div>
              <div className="font-heading text-lg">{t("new_arrivals")}</div>
            </Link>
            <Link 
              href="/catalogue/sets" 
              className="luxury-sapphire text-white p-6 rounded-xl text-center hover:scale-105 transition-all duration-300 transform shadow-lg hover:shadow-2xl"
            >
              <div className="text-3xl mb-3">📦</div>
              <div className="font-heading text-lg">{t("furniture_sets")}</div>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
