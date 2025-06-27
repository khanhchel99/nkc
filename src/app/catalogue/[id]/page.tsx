"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useI18n } from "../../i18n";
import { api } from "@/trpc/react";

export default function ProductDetailPage() {
  const params = useParams();
  const productSlug = params.id as string;
  const { t, locale } = useI18n();
  
  // Translation helper functions
  const translateRoomType = (room: string) => {
    const roomMap: Record<string, string> = {
      'Living Room': t("living_room"),
      'Bedroom': t("bedroom"),
      'Kitchen': t("kitchen"),
      'Office': t("office"),
      'Dining Room': t("dining_room")
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
      'Desk': t("desk")
    };
    return typeMap[type] || type;
  };

  const translateComboType = (combo: string) => {
    const comboMap: Record<string, string> = {
      'Dining Set': t("dining_set"),
      'Bedroom Combo': t("bedroom_combo"),
      'Living Room Set': t("living_room_set"),
      'Office Set': t("office_set")
    };
    return comboMap[combo] || combo;
  };
  
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedTab, setSelectedTab] = useState("description");  const [quantity, setQuantity] = useState(1);

  // Fetch product data from database using TRPC
  const { data: product, isLoading, error } = api.product.getBySlug.useQuery({ 
    slug: productSlug,
    locale: locale || 'en'
  });
  const { data: allProductsData } = api.product.getAll.useQuery({ 
    locale: locale || 'en'
  });
  // Get related products (same room type, excluding current product)
  const relatedProducts = (allProductsData?.products || [])
    .filter((p: any) => p.room === product?.room && p.slug !== productSlug)
    .slice(0, 3);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#895D35] mx-auto"></div>
          <p className="mt-4 text-gray-600">{t("loading_product")}</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center">
        <div className="text-center">          <h1 className="text-4xl font-bold text-gray-800 mb-4">{t("product_not_found")}</h1>
          <p className="text-gray-600 mb-8">{t("product_not_found_desc")}</p>
          <Link href="/catalogue" className="bg-[#895D35] text-white px-6 py-3 rounded hover:bg-[#7A4F2A]">
            {t("back_to_catalogue")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-stone-100">      {/* Breadcrumb */}
      <div className="bg-white py-4 border-b">
        <div className="container mx-auto px-4">
          <nav className="flex items-center space-x-2 text-sm text-gray-600">
            <Link href="/" className="hover:text-[#895D35]">{t("home")}</Link>
            <span>/</span>
            <Link href="/catalogue" className="hover:text-[#895D35]">{t("catalogue")}</Link>
            <span>/</span>
            <span className="text-[#895D35] font-medium">{product.name}</span>
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div className="space-y-4">            {/* Main Image */}
            <div className="relative h-96 md:h-[500px] bg-white rounded-lg overflow-hidden shadow-md">
              <Image
                src={product.images[selectedImage] || "/images/business-slide1.jpg"}
                alt={product.name}
                fill
                style={{ objectFit: "cover" }}
                className="transition-opacity duration-300"
              />              {!product.inStock && (
                <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded text-sm font-medium">
                  {t("out_of_stock")}
                </div>
              )}
            </div>
            
            {/* Thumbnail Images */}
            <div className="flex space-x-2">
              {product.images.map((image: string, index: number) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`relative w-20 h-20 rounded-md overflow-hidden border-2 transition-colors ${
                    selectedImage === index ? "border-[#895D35]" : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <Image
                    src={image}
                    alt={`${product.name} ${index + 1}`}
                    fill
                    style={{ objectFit: "cover" }}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>              <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                <span>{translateRoomType(product.room)}</span>
                <span>•</span>
                <span>{translateFurnitureType(product.type)}</span>
                {product.combo && (
                  <>
                    <span>•</span>
                    <span className="text-amber-700 font-medium">{translateComboType(product.combo)}</span>
                  </>
                )}
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{product.name}</h1>
              <p className="text-gray-700 text-lg leading-relaxed">{product.description}</p>
            </div>            {/* Price */}
            <div className="flex items-baseline space-x-3">
              <span className="text-3xl font-bold text-[#895D35]">${Number(product.price)}</span>
              {product.originalPrice && (
                <span className="text-xl text-gray-500 line-through">${Number(product.originalPrice)}</span>
              )}
              {product.originalPrice && (                <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm font-medium">
                  {t("save_percentage")} {((Number(product.originalPrice) - Number(product.price)) / Number(product.originalPrice) * 100).toFixed(0)}%
                </span>
              )}
            </div>

            {/* Quantity and Add to Cart */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center border border-gray-300 rounded">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-2 hover:bg-gray-100"
                >
                  -
                </button>
                <span className="px-4 py-2 border-x border-gray-300">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-3 py-2 hover:bg-gray-100"
                >
                  +
                </button>
              </div>
              <button
                disabled={!product.inStock}
                className={`flex-1 py-3 px-6 rounded font-semibold transition ${
                  product.inStock
                    ? "bg-[#895D35] text-white hover:bg-[#7A4F2A]"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}              >
                {product.inStock ? t("add_to_cart") : t("out_of_stock")}
              </button>
            </div>            {/* Action Buttons */}
            <div className="flex space-x-4">
              <button className="flex-1 border border-[#895D35] text-[#895D35] py-2 px-4 rounded hover:bg-[#895D35] hover:text-white transition">
                {t("add_to_wishlist")}
              </button>
              <button className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-50 transition">
                {t("share")}
              </button>
            </div>            {/* Quick Info */}
            <div className="bg-amber-50 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">{t("category")}:</span>
                  <span className="ml-2 text-gray-600">{translateRoomType(product.room)} {translateFurnitureType(product.type)}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">{t("stock_status")}:</span>
                  <span className={`ml-2 ${product.inStock ? "text-green-600" : "text-red-600"}`}>
                    {product.inStock ? t("yes") : t("no")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="mt-16">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8">
              {["description", "specifications", "features"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setSelectedTab(tab)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm capitalize transition ${
                    selectedTab === tab
                      ? "border-[#895D35] text-[#895D35]"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}                >
                  {t(tab)}
                </button>
              ))}
            </nav>
          </div>

          <div className="py-8">
            {selectedTab === "description" && (
              <div className="prose max-w-none">
                <p className="text-lg text-gray-700 leading-relaxed">{product.longDescription}</p>
              </div>
            )}            {selectedTab === "specifications" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {product.specifications && typeof product.specifications === 'object' && 
                  Object.entries(product.specifications).map(([key, value]) => (
                    <div key={key} className="flex justify-between py-3 border-b border-gray-200">
                      <span className="font-medium text-gray-700">{key}:</span>
                      <span className="text-gray-600">{String(value)}</span>
                    </div>
                  ))
                }                {!product.specifications && (
                  <p className="text-gray-600">{t("no_specifications")}</p>
                )}
              </div>
            )}

            {selectedTab === "features" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {product.features && Array.isArray(product.features) && 
                  product.features.map((feature: string, index: number) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-[#895D35] rounded-full"></div>
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))
                }                {(!product.features || product.features.length === 0) && (
                  <p className="text-gray-600">{t("no_features")}</p>
                )}
              </div>
            )}
          </div>
        </div>        {/* Related Products */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">{t("related_products")}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedProducts.map((relatedProduct: any) => (
              <Link
                key={relatedProduct.id}
                href={`/catalogue/${relatedProduct.slug}`}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow"
              >
                <div className="relative h-48">
                  <Image
                    src={relatedProduct.images[0] || "/images/business-slide1.jpg"}
                    alt={relatedProduct.name}
                    fill
                    style={{ objectFit: "cover" }}
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">{relatedProduct.name}</h3>
                  <p className="text-[#895D35] font-bold">${Number(relatedProduct.price)}</p>
                </div>
              </Link>
            ))}
          </div>          {relatedProducts.length === 0 && (
            <p className="text-gray-600 text-center">{t("no_related_products")}</p>
          )}
        </div>
      </div>
    </main>
  );
}
