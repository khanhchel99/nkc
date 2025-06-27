"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@/trpc/react";
import { useI18n } from "../../../i18n";

export default function CategoryPage() {
  const params = useParams();
  const categorySlug = params.categoryId as string;
  const { locale, t, isTranslationsLoaded } = useI18n();
  
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("");
  const [sortBy, setSortBy] = useState<'createdAt' | 'price' | 'name'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // ALL HOOKS MUST BE CALLED FIRST - before any conditional returns
  // Get category information by slug
  const { data: category, isLoading: categoryLoading } = api.category.getBySlug.useQuery({
    slug: categorySlug
  });

  // Get products for this category - always call this hook
  const { data: productsData, isLoading: productsLoading } = api.product.getAll.useQuery({
    locale,
    categoryId: category?.id || "",
    subcategoryId: selectedSubcategory || undefined,
    sortBy,
    sortOrder,
    page: 1,
    limit: 50,
    inStock: true,
  }, {
    enabled: !!category?.id, // Only run query when category is available
  });

  // Helper functions for localized content
  const getCategoryName = (cat: any) => {
    return locale === 'vi' ? cat?.nameVi : cat?.nameEn;
  };

  const getCategoryDescription = (cat: any) => {
    return locale === 'vi' ? cat?.descriptionVi : cat?.descriptionEn;
  };

  const getSubcategoryName = (subcat: any) => {
    return locale === 'vi' ? subcat?.nameVi : subcat?.nameEn;
  };

  // NOW we can do conditional rendering - AFTER all hooks are called
  if (categoryLoading) {
    return (
      <main className="min-h-screen bg-stone-100 py-10">
        <div className="container mx-auto px-4">
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#895D35] mx-auto"></div>
            <p className="mt-4 text-gray-600">
              {isTranslationsLoaded ? t("loading") : "Loading..."}
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (!category) {
    return (
      <main className="min-h-screen bg-stone-100 py-10">
        <div className="container mx-auto px-4">
          <div className="text-center py-16">
            <h1 className="text-2xl font-bold text-red-600 mb-4">{t("category_not_found")}</h1>
            <Link href="/catalogue" className="text-[#895D35] hover:underline">
              {t("back_to_categories")}
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const products = productsData?.products || [];

  if (productsLoading) {
    return (
      <main className="min-h-screen bg-stone-100 py-10">
        <div className="container mx-auto px-4">
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#895D35] mx-auto"></div>
            <p className="mt-4 text-gray-600">
              {isTranslationsLoaded ? t("loading") : "Loading..."}
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-stone-100 py-10">
      <div className="container mx-auto px-4">
        <nav className="mb-6">
          <ol className="flex items-center space-x-2 text-sm">
            <li>
              <Link href="/catalogue" className="text-[#895D35] hover:underline">
                {t("categories")}
              </Link>
            </li>
            <li className="text-gray-500">/</li>
            <li className="text-gray-700 font-medium">{getCategoryName(category)}</li>
          </ol>
        </nav>

        {/* Category Header */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="md:w-2/3">
              <h1 className="text-5xl font-display text-luxury vietnamese-safe mb-8 py-2">
                {getCategoryName(category)}
              </h1>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                {getCategoryDescription(category)}
              </p>
              <div className="flex items-center text-sm text-gray-500">
                <span>{products.length} {t("products_available")}</span>
              </div>
            </div>
            <div className="md:w-1/3 mt-6 md:mt-0">
              <div className="relative h-48 w-full rounded-lg overflow-hidden">
                <Image
                  src={category.image || "/images/business-slide1.jpg"}
                  alt={getCategoryName(category)}
                  fill
                  style={{ objectFit: "cover" }}
                  className="rounded-lg"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Sort */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Subcategory Filter */}
            {category.subcategories && category.subcategories.length > 0 && (
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-gray-700">
                  {isTranslationsLoaded ? t("filter_by_subcategory") : "Filter by Subcategory"}:
                </label>
                <select
                  value={selectedSubcategory}
                  onChange={(e) => setSelectedSubcategory(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#895D35]"
                >
                  <option value="">
                    {isTranslationsLoaded ? t("all_subcategories") : "All Subcategories"}
                  </option>
                  {category.subcategories.map((subcategory: any) => (
                    <option key={subcategory.id} value={subcategory.id}>
                      {getSubcategoryName(subcategory)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Sort */}
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700">
                {isTranslationsLoaded ? t("sort_by") : "Sort by"}:
              </label>
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [newSortBy, newSortOrder] = e.target.value.split('-') as [typeof sortBy, typeof sortOrder];
                  setSortBy(newSortBy);
                  setSortOrder(newSortOrder);
                }}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#895D35]"
              >
                <option value="createdAt-desc">
                  {isTranslationsLoaded ? t("newest_first") : "Newest First"}
                </option>
                <option value="createdAt-asc">
                  {isTranslationsLoaded ? t("oldest_first") : "Oldest First"}
                </option>
                <option value="price-asc">
                  {isTranslationsLoaded ? t("price_low_high") : "Price: Low to High"}
                </option>
                <option value="price-desc">
                  {isTranslationsLoaded ? t("price_high_low") : "Price: High to Low"}
                </option>
                <option value="name-asc">
                  {isTranslationsLoaded ? t("name_a_z") : "Name: A to Z"}
                </option>
                <option value="name-desc">
                  {isTranslationsLoaded ? t("name_z_a") : "Name: Z to A"}
                </option>
              </select>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        {products.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">{t("no_products_in_category")}</h3>
            <p className="text-gray-500 mb-6">{t("check_back_soon_for_new_products")}</p>
            <Link 
              href="/catalogue" 
              className="bg-[#895D35] text-white px-6 py-3 rounded-lg hover:bg-[#7A4F2A] transition-colors"
            >
              {t("browse_other_categories")}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {products.map((product: any) => (
              <Link
                key={product.id}
                href={`/catalogue/${product.slug}`}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col group transform hover:-translate-y-1"
              >
                <div className="relative h-48 w-full overflow-hidden">
                  <Image
                    src={product.images?.[0] || "/images/business-slide1.jpg"}
                    alt={product.name}
                    fill
                    style={{ objectFit: "cover" }}
                    className="group-hover:scale-110 transition-transform duration-300"
                    sizes="(max-width: 768px) 100vw, 25vw"
                  />
                  {product.featured && (
                    <div className="absolute top-2 left-2 bg-[#895D35] text-white text-xs px-2 py-1 rounded">
                      {t("featured")}
                    </div>
                  )}
                  {!product.inStock && (
                    <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                      {t("out_of_stock")}
                    </div>
                  )}
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2 group-hover:text-[#895D35] transition-colors">
                    {product.name}
                  </h3>
                  <p className="text-gray-600 text-sm mb-3 flex-1 line-clamp-2">
                    {product.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-lg font-bold text-[#895D35]">
                        ${product.price.toLocaleString()}
                      </span>
                      {product.originalPrice && product.originalPrice > product.price && (
                        <span className="text-sm text-gray-500 line-through">
                          ${product.originalPrice.toLocaleString()}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {product.room}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}