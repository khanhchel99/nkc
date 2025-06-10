"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useI18n } from "../../i18n";

// Mock data for demonstration - in real app this would come from API/database
const PRODUCTS = {
  "1": {
    id: 1,
    name: "Classic Sofa",
    price: "$499",
    originalPrice: "$599",
    images: [
      "/images/business-slide1.jpg",
      "/images/business-slide2.jpg",
      "/images/business-slide3.jpg",
    ],
    room: "Living Room",
    type: "Sofa",
    combo: "Living Room Set",
    description: "A timeless classic sofa that brings comfort and elegance to your living space. Crafted with premium materials and attention to detail.",
    longDescription: "Our Classic Sofa represents the perfect blend of traditional craftsmanship and modern comfort. Each piece is meticulously handcrafted using sustainably sourced hardwood frames and premium upholstery materials. The deep-seated design ensures maximum comfort for relaxation, while the timeless aesthetic complements any home decor style.",
    specifications: {
      "Dimensions": "210cm W x 90cm D x 85cm H",
      "Materials": "Hardwood frame, Premium fabric upholstery",
      "Color Options": "Beige, Gray, Navy Blue",
      "Weight": "65kg",
      "Assembly": "Professional assembly recommended",
      "Warranty": "5 years structural, 2 years fabric"
    },
    features: [
      "Handcrafted hardwood frame",
      "Premium fabric upholstery",
      "High-density foam cushions",
      "Removable cushion covers",
      "Professional assembly available",
      "5-year structural warranty"
    ],
    inStock: true,
    category: "Living Room Furniture"
  },
  "2": {
    id: 2,
    name: "Modern Bed",
    price: "$799",
    originalPrice: "$899",
    images: [
      "/images/business-slide2.jpg",
      "/images/business-slide1.jpg",
      "/images/business-slide3.jpg",
    ],
    room: "Bedroom",
    type: "Bed",
    combo: "Bedroom Combo",
    description: "Contemporary bed frame with sleek design and superior comfort for a perfect night's sleep.",
    longDescription: "The Modern Bed features a minimalist design that brings contemporary elegance to your bedroom. Built with solid wood construction and upholstered headboard for ultimate comfort and style.",
    specifications: {
      "Dimensions": "160cm W x 200cm L x 120cm H",
      "Materials": "Solid wood frame, Upholstered headboard",
      "Size Options": "Queen, King",
      "Weight": "45kg",
      "Assembly": "Required (tools included)",
      "Warranty": "10 years frame, 3 years upholstery"
    },
    features: [
      "Solid wood construction",
      "Upholstered headboard",
      "Platform design (no box spring needed)",
      "Under-bed storage space",
      "Easy assembly",
      "10-year frame warranty"
    ],
    inStock: true,
    category: "Bedroom Furniture"
  }
};

const RELATED_PRODUCTS = [
  { id: 3, name: "Coffee Table", price: "$299", image: "/images/business-slide3.jpg" },
  { id: 4, name: "Armchair", price: "$399", image: "/images/business-slide1.jpg" },
  { id: 5, name: "Side Table", price: "$199", image: "/images/business-slide2.jpg" },
];

export default function ProductDetailPage() {
  const params = useParams();
  const productId = params.id as string;
  const { t } = useI18n();
  
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedTab, setSelectedTab] = useState("description");
  const [quantity, setQuantity] = useState(1);

  // Get product data (in real app, this would be fetched from API)
  const product = PRODUCTS[productId as keyof typeof PRODUCTS];

  if (!product) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Product Not Found</h1>
          <p className="text-gray-600 mb-8">The product you're looking for doesn't exist.</p>
          <Link href="/catalogue" className="bg-[#895D35] text-white px-6 py-3 rounded hover:bg-[#7A4F2A]">
            Back to Catalogue
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-stone-100">
      {/* Breadcrumb */}
      <div className="bg-white py-4 border-b">
        <div className="container mx-auto px-4">
          <nav className="flex items-center space-x-2 text-sm text-gray-600">
            <Link href="/" className="hover:text-[#895D35]">Home</Link>
            <span>/</span>
            <Link href="/catalogue" className="hover:text-[#895D35]">Catalogue</Link>
            <span>/</span>
            <span className="text-[#895D35] font-medium">{product.name}</span>
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative h-96 md:h-[500px] bg-white rounded-lg overflow-hidden shadow-md">
              <Image
                src={product.images[selectedImage]}
                alt={product.name}
                fill
                style={{ objectFit: "cover" }}
                className="transition-opacity duration-300"
              />
              {!product.inStock && (
                <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded text-sm font-medium">
                  Out of Stock
                </div>
              )}
            </div>
            
            {/* Thumbnail Images */}
            <div className="flex space-x-2">
              {product.images.map((image, index) => (
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
            <div>
              <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                <span>{product.room}</span>
                <span>•</span>
                <span>{product.type}</span>
                {product.combo && (
                  <>
                    <span>•</span>
                    <span className="text-amber-700 font-medium">{product.combo}</span>
                  </>
                )}
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{product.name}</h1>
              <p className="text-gray-700 text-lg leading-relaxed">{product.description}</p>
            </div>

            {/* Price */}
            <div className="flex items-baseline space-x-3">
              <span className="text-3xl font-bold text-[#895D35]">{product.price}</span>
              {product.originalPrice && (
                <span className="text-xl text-gray-500 line-through">{product.originalPrice}</span>
              )}
              {product.originalPrice && (
                <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm font-medium">
                  Save {((parseFloat(product.originalPrice.slice(1)) - parseFloat(product.price.slice(1))) / parseFloat(product.originalPrice.slice(1)) * 100).toFixed(0)}%
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
                }`}
              >
                {product.inStock ? "Add to Cart" : "Out of Stock"}
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4">
              <button className="flex-1 border border-[#895D35] text-[#895D35] py-2 px-4 rounded hover:bg-[#895D35] hover:text-white transition">
                Add to Wishlist
              </button>
              <button className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-50 transition">
                Share
              </button>
            </div>

            {/* Quick Info */}
            <div className="bg-amber-50 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Category:</span>
                  <span className="ml-2 text-gray-600">{product.category}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">In Stock:</span>
                  <span className={`ml-2 ${product.inStock ? "text-green-600" : "text-red-600"}`}>
                    {product.inStock ? "Yes" : "No"}
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
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>

          <div className="py-8">
            {selectedTab === "description" && (
              <div className="prose max-w-none">
                <p className="text-lg text-gray-700 leading-relaxed">{product.longDescription}</p>
              </div>
            )}

            {selectedTab === "specifications" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(product.specifications).map(([key, value]) => (
                  <div key={key} className="flex justify-between py-3 border-b border-gray-200">
                    <span className="font-medium text-gray-700">{key}:</span>
                    <span className="text-gray-600">{value}</span>
                  </div>
                ))}
              </div>
            )}

            {selectedTab === "features" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {product.features.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-[#895D35] rounded-full"></div>
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Related Products */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Related Products</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {RELATED_PRODUCTS.map((relatedProduct) => (
              <Link
                key={relatedProduct.id}
                href={`/catalogue/${relatedProduct.id}`}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow"
              >
                <div className="relative h-48">
                  <Image
                    src={relatedProduct.image}
                    alt={relatedProduct.name}
                    fill
                    style={{ objectFit: "cover" }}
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">{relatedProduct.name}</h3>
                  <p className="text-[#895D35] font-bold">{relatedProduct.price}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
