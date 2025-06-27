"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { api } from "@/trpc/react";
import { useI18n } from "../../i18n";

export default function FeaturedProductsPage() {
  const { locale, t } = useI18n();
  const [sortBy, setSortBy] = useState<'createdAt' | 'price' | 'name'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Get featured products
  const { data: productsData, isLoading } = api.product.getAll.useQuery({
    locale,
    featured: true,
    sortBy,
    sortOrder,
    page: 1,
    limit: 50,
    inStock: true,
  });

  const translateRoomType = (room: string) => {
    const roomMap: Record<string, string> = {
      'Living Room': t("living_room"),
      'Bedroom': t("bedroom"),
      'Kitchen': t("kitchen"),
      'Office': t("office"),
      'Dining Room': t("dining_room"),
      'Outdoor': t("outdoor")
    };
    return roomMap[room] || room;
  };

  const translateFurnitureType = (type: string) => {
    const typeMap: Record<string, string> = {
      'Sofa': t("sofa"),
      'Bed': t("bed"),
      'Table': t("table"),
      'Chair': t("chair"),
      'Cabinet': t("cabinet"),
      'Desk': t("desk"),
      'Storage': t("storage")
    };
    return typeMap[type] || type;
  };

  const products = productsData?.products || [];

  if (isLoading) {
    return (
      <main className="min-h-screen bg-stone-100 py-10">
        <div className="container mx-auto px-4">
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#895D35] mx-auto"></div>
            <p className="mt-4 text-gray-600">{t("loading_products")}</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-stone-100 py-10">
      <div className="container mx-auto px-4">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <ol className="flex items-center space-x-2 text-sm">
            <li>
              <Link href="/catalogue" className="text-[#895D35] hover:underline">
                {t("categories")}
              </Link>
            </li>
            <li className="text-gray-500">/</li>
            <li className="text-gray-700 font-medium">{t("featured_products")}</li>
          </ol>
        </nav>

        {/* Header */}
        <div className="bg-gradient-to-r from-[#895D35] to-[#7A4F2A] rounded-xl shadow-lg p-8 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-4 flex items-center">
                <span className="text-5xl mr-4">⭐</span>
                {t("featured_products")}
              </h1>
              <p className="text-xl opacity-90 mb-4">
                {t("featured_products_desc")}
              </p>
              <div className="text-lg opacity-75">
                {products.length} {t("featured_items_available")}
              </div>
            </div>
          </div>
        </div>

        {/* Sort Controls */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">{t("our_featured_collection")}</h2>
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700">{t("sort_by")}:</label>
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [newSortBy, newSortOrder] = e.target.value.split('-') as [typeof sortBy, typeof sortOrder];
                  setSortBy(newSortBy);
                  setSortOrder(newSortOrder);
                }}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#895D35]"
              >
                <option value="createdAt-desc">{t("newest_first")}</option>
                <option value="createdAt-asc">{t("oldest_first")}</option>
                <option value="price-asc">{t("price_low_high")}</option>
                <option value="price-desc">{t("price_high_low")}</option>
                <option value="name-asc">{t("name_a_z")}</option>
                <option value="name-desc">{t("name_z_a")}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        {products.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-6xl mb-4">⭐</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">{t("no_featured_products")}</h3>
            <p className="text-gray-500 mb-6">{t("check_back_for_featured_items")}</p>
            <Link 
              href="/catalogue" 
              className="bg-[#895D35] text-white px-6 py-3 rounded-lg hover:bg-[#7A4F2A] transition-colors"
            >
              {t("browse_all_categories")}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {products.map((product: any) => (
              <Link
                key={product.id}
                href={`/catalogue/${product.slug}`}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col group transform hover:-translate-y-1 relative"
              >
                {/* Featured Badge */}
                <div className="absolute top-2 left-2 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white px-3 py-1 rounded-full text-xs font-bold z-10 flex items-center">
                  <span className="mr-1">⭐</span>
                  {t("featured")}
                </div>
                
                <div className="relative h-48 w-full overflow-hidden">
                  <Image
                    src={product.images?.[0] || "/images/business-slide1.jpg"}
                    alt={product.name}
                    fill
                    style={{ objectFit: "cover" }}
                    className="rounded-t-lg group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 768px) 100vw, 25vw"
                    loading="lazy"
                  />
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="text-lg font-semibold mb-2 text-[#895D35] group-hover:text-[#7A4F2A] transition-colors line-clamp-2">
                    {product.name}
                  </h3>
                  <div className="text-sm text-gray-500 mb-1">
                    {translateRoomType(product.room)} • {translateFurnitureType(product.type)}
                  </div>
                  {product.combo && (
                    <div className="text-xs text-amber-700 mb-2">
                      {product.combo}
                    </div>
                  )}
                  <div className="mt-auto flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-lg font-bold text-[#895D35]">
                        ${product.price}
                      </span>
                      {product.originalPrice && product.originalPrice > product.price && (
                        <span className="text-sm text-gray-500 line-through">
                          ${product.originalPrice}
                        </span>
                      )}
                    </div>
                    <span className="bg-[#895D35] text-white px-3 py-1 rounded hover:bg-[#7A4F2A] text-sm font-medium transition-colors group-hover:bg-[#7A4F2A]">
                      {t("view_details")}
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
