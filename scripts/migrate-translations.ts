import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function migrateAndSeedTranslations() {
  console.log("🔄 Migrating existing products and seeding translations...");

  // First, clear existing products to start fresh
  await prisma.productTranslation.deleteMany();
  await prisma.product.deleteMany();

  const productsWithTranslations = [
    {
      slug: "classic-sofa",
      price: 499,
      originalPrice: 599,
      images: ["/images/business-slide1.jpg", "/images/business-slide2.jpg", "/images/business-slide3.jpg"],
      room: "Living Room",
      type: "Sofa",
      combo: "Living Room Set",
      category: "Living Room Furniture",
      inStock: true,
      featured: true,
      specifications: {
        en: {
          "Dimensions": "210cm W x 90cm D x 85cm H",
          "Materials": "Hardwood frame, Premium fabric upholstery",
          "Color Options": "Beige, Gray, Navy Blue",
          "Weight": "65kg",
          "Assembly": "Professional assembly recommended",
          "Warranty": "5 years structural, 2 years fabric"
        },
        vi: {
          "Kích thước": "210cm R x 90cm S x 85cm C",
          "Vật liệu": "Khung gỗ cứng, Vải bọc cao cấp",
          "Tùy chọn màu": "Be, Xám, Xanh navy",
          "Trọng lượng": "65kg",
          "Lắp đặt": "Khuyến nghị lắp đặt chuyên nghiệp",
          "Bảo hành": "5 năm kết cấu, 2 năm vải"
        }
      },
      features: {
        en: [
          "Handcrafted hardwood frame",
          "Premium fabric upholstery",
          "High-density foam cushions",
          "Removable cushion covers",
          "Professional assembly available",
          "5-year structural warranty"
        ],
        vi: [
          "Khung gỗ cứng thủ công",
          "Vải bọc cao cấp",
          "Đệm foam mật độ cao",
          "Vỏ đệm có thể tháo rời",
          "Có dịch vụ lắp đặt chuyên nghiệp",
          "Bảo hành kết cấu 5 năm"
        ]
      },
      translations: {
        en: {
          name: "Classic Sofa",
          description: "A timeless classic sofa that brings comfort and elegance to your living space.",
          longDescription: "Our Classic Sofa represents the perfect blend of traditional craftsmanship and modern comfort. Each piece is meticulously handcrafted using sustainably sourced hardwood frames and premium upholstery materials.",
          metaTitle: "Classic Sofa - Comfortable Living Room Furniture",
          metaDescription: "Premium handcrafted sofa with hardwood frame and luxury upholstery."
        },
        vi: {
          name: "Sofa Cổ Điển",
          description: "Một chiếc sofa cổ điển vượt thời gian mang đến sự thoải mái và thanh lịch cho không gian sống của bạn.",
          longDescription: "Sofa Cổ Điển của chúng tôi thể hiện sự kết hợp hoàn hảo giữa nghề thủ công truyền thống và sự thoải mái hiện đại. Mỗi sản phẩm được chế tác tỉ mỉ bằng khung gỗ cứng bền vững và vật liệu bọc cao cấp.",
          metaTitle: "Sofa Cổ Điển - Nội Thất Phòng Khách Thoải Mái",
          metaDescription: "Sofa thủ công cao cấp với khung gỗ cứng và vải bọc sang trọng."
        }
      }
    },
    {
      slug: "modern-bed",
      price: 799,
      originalPrice: 899,
      images: ["/images/business-slide2.jpg", "/images/business-slide1.jpg", "/images/business-slide3.jpg"],
      room: "Bedroom",
      type: "Bed",
      combo: "Bedroom Combo",
      category: "Bedroom Furniture",
      inStock: true,
      featured: true,
      specifications: {
        en: {
          "Dimensions": "160cm W x 200cm L x 120cm H",
          "Materials": "Solid wood frame, Upholstered headboard",
          "Size Options": "Queen, King",
          "Weight": "45kg",
          "Assembly": "Required (tools included)",
          "Warranty": "10 years frame, 3 years upholstery"
        },
        vi: {
          "Kích thước": "160cm R x 200cm D x 120cm C",
          "Vật liệu": "Khung gỗ nguyên khối, Đầu giường bọc vải",
          "Tùy chọn kích cỡ": "Queen, King",
          "Trọng lượng": "45kg",
          "Lắp đặt": "Cần lắp đặt (có kèm dụng cụ)",
          "Bảo hành": "10 năm khung, 3 năm vải bọc"
        }
      },
      features: {
        en: [
          "Solid wood construction",
          "Upholstered headboard",
          "Platform design (no box spring needed)",
          "Under-bed storage space",
          "Easy assembly",
          "10-year frame warranty"
        ],
        vi: [
          "Kết cấu gỗ nguyên khối",
          "Đầu giường bọc vải",
          "Thiết kế platform (không cần đệm lò xo)",
          "Khoang chứa đồ dưới gầm",
          "Lắp đặt dễ dàng",
          "Bảo hành khung 10 năm"
        ]
      },
      translations: {
        en: {
          name: "Modern Bed",
          description: "Contemporary bed frame with sleek design and superior comfort for a perfect night's sleep.",
          longDescription: "The Modern Bed features a minimalist design that brings contemporary elegance to your bedroom. Built with solid wood construction and upholstered headboard for ultimate comfort and style.",
          metaTitle: "Modern Bed - Contemporary Bedroom Furniture",
          metaDescription: "Stylish platform bed with solid wood construction and upholstered headboard."
        },
        vi: {
          name: "Giường Hiện Đại",
          description: "Khung giường hiện đại với thiết kế bóng bẩy và sự thoải mái vượt trội cho giấc ngủ hoàn hảo.",
          longDescription: "Giường Hiện Đại có thiết kế tối giản mang đến vẻ thanh lịch đương đại cho phòng ngủ của bạn. Được chế tác từ gỗ nguyên khối và đầu giường bọc vải để có sự thoải mái và phong cách tối ưu.",
          metaTitle: "Giường Hiện Đại - Nội Thất Phòng Ngủ Đương Đại",
          metaDescription: "Giường platform phong cách với kết cấu gỗ nguyên khối và đầu giường bọc vải."
        }
      }
    },
    {
      slug: "dining-table",
      price: 599,
      images: ["/images/business-slide3.jpg", "/images/business-slide1.jpg"],
      room: "Kitchen",
      type: "Table",
      combo: "Dining Set",
      category: "Dining Room Furniture",
      inStock: true,
      featured: false,
      specifications: {
        en: {
          "Dimensions": "180cm W x 90cm D x 75cm H",
          "Materials": "Solid wood",
          "Seating Capacity": "6-8 people",
          "Weight": "35kg",
          "Assembly": "Minimal assembly required",
          "Warranty": "5 years"
        },
        vi: {
          "Kích thước": "180cm R x 90cm S x 75cm C",
          "Vật liệu": "Gỗ nguyên khối",
          "Sức chứa": "6-8 người",
          "Trọng lượng": "35kg",
          "Lắp đặt": "Cần lắp đặt tối thiểu",
          "Bảo hành": "5 năm"
        }
      },
      features: {
        en: [
          "Solid wood construction",
          "Seats 6-8 people comfortably",
          "Scratch-resistant finish",
          "Easy to clean surface",
          "Classic design"
        ],
        vi: [
          "Kết cấu gỗ nguyên khối",
          "Chỗ ngồi thoải mái cho 6-8 người",
          "Bề mặt chống trầy xước",
          "Bề mặt dễ vệ sinh",
          "Thiết kế cổ điển"
        ]
      },
      translations: {
        en: {
          name: "Dining Table",
          description: "Elegant dining table perfect for family meals and entertaining guests.",
          longDescription: "This dining table combines functionality with style, featuring a robust construction that can accommodate family gatherings and dinner parties with ease.",
          metaTitle: "Dining Table - Elegant Kitchen Furniture",
          metaDescription: "Spacious dining table that seats 6-8 people, perfect for family meals."
        },
        vi: {
          name: "Bàn Ăn",
          description: "Bàn ăn thanh lịch hoàn hảo cho bữa ăn gia đình và tiếp khách.",
          longDescription: "Chiếc bàn ăn này kết hợp chức năng với phong cách, có kết cấu chắc chắn có thể phục vụ các buổi tụ họp gia đình và tiệc tối một cách dễ dàng.",
          metaTitle: "Bàn Ăn - Nội Thất Bếp Thanh Lịch",
          metaDescription: "Bàn ăn rộng rãi chỗ ngồi cho 6-8 người, hoàn hảo cho bữa ăn gia đình."
        }
      }
    }
  ];

  for (const productData of productsWithTranslations) {
    // Create the main product
    const product = await prisma.product.create({
      data: {
        slug: productData.slug,
        price: productData.price,
        originalPrice: productData.originalPrice,
        images: productData.images,
        room: productData.room,
        type: productData.type,
        combo: productData.combo,
        category: productData.category,
        inStock: productData.inStock,
        featured: productData.featured,
        specifications: productData.specifications,
        features: productData.features,
      },
    });

    // Create translations for each locale
    for (const [locale, translation] of Object.entries(productData.translations)) {
      await prisma.productTranslation.create({
        data: {
          productId: product.id,
          locale,
          name: translation.name,
          description: translation.description,
          longDescription: translation.longDescription,
          metaTitle: translation.metaTitle,
          metaDescription: translation.metaDescription,
        },
      });
    }

    console.log(`✅ Created product: ${productData.translations.en.name} with translations`);
  }

  console.log("🎉 Migration and seeding completed!");
}

migrateAndSeedTranslations()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
