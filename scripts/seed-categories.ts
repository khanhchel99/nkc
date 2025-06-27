import { db } from "../src/server/db";

async function seedCategories() {
  console.log("Seeding categories...");

  // Create some sample categories
  const categories = [
    {
      nameEn: "Living Room",
      nameVi: "Phòng khách",
      slug: "living-room",
      descriptionEn: "Comfortable and stylish furniture for your living room",
      descriptionVi: "Đồ nội thất thoải mái và phong cách cho phòng khách của bạn",
      image: "/images/business-slide1.jpg",
      color: "bg-amber-50 border-amber-200",
      displayOrder: 1,
      subcategories: [
        {
          nameEn: "Sofas",
          nameVi: "Sofa",
          slug: "sofas",
          descriptionEn: "Comfortable sofas for your living room",
          descriptionVi: "Sofa thoải mái cho phòng khách",
          displayOrder: 1,
        },
        {
          nameEn: "Coffee Tables",
          nameVi: "Bàn cà phê",
          slug: "coffee-tables",
          descriptionEn: "Stylish coffee tables to complement your living room",
          descriptionVi: "Bàn cà phê phong cách để bổ sung cho phòng khách",
          displayOrder: 2,
        },
        {
          nameEn: "TV Stands",
          nameVi: "Kệ tivi",
          slug: "tv-stands",
          descriptionEn: "Modern TV stands and entertainment units",
          descriptionVi: "Kệ tivi và tủ giải trí hiện đại",
          displayOrder: 3,
        },
      ],
    },
    {
      nameEn: "Bedroom",
      nameVi: "Phòng ngủ",
      slug: "bedroom",
      descriptionEn: "Comfortable and peaceful furniture for your bedroom",
      descriptionVi: "Đồ nội thất thoải mái và yên bình cho phòng ngủ",
      image: "/images/business-slide6.jpg",
      color: "bg-blue-50 border-blue-200",
      displayOrder: 2,
      subcategories: [
        {
          nameEn: "Beds",
          nameVi: "Giường",
          slug: "beds",
          descriptionEn: "Comfortable beds for a good night's sleep",
          descriptionVi: "Giường thoải mái cho giấc ngủ ngon",
          displayOrder: 1,
        },
        {
          nameEn: "Wardrobes",
          nameVi: "Tủ quần áo",
          slug: "wardrobes",
          descriptionEn: "Spacious wardrobes for all your clothing",
          descriptionVi: "Tủ quần áo rộng rãi cho tất cả quần áo của bạn",
          displayOrder: 2,
        },
        {
          nameEn: "Nightstands",
          nameVi: "Tủ đầu giường",
          slug: "nightstands",
          descriptionEn: "Convenient nightstands for your bedside",
          descriptionVi: "Tủ đầu giường tiện lợi bên cạnh giường",
          displayOrder: 3,
        },
      ],
    },
    {
      nameEn: "Dining Room",
      nameVi: "Phòng ăn",
      slug: "dining-room",
      descriptionEn: "Elegant dining furniture for memorable meals",
      descriptionVi: "Đồ nội thất phòng ăn thanh lịch cho những bữa ăn đáng nhớ",
      image: "/images/business-slide3.jpg",
      color: "bg-green-50 border-green-200",
      displayOrder: 3,
      subcategories: [
        {
          nameEn: "Dining Tables",
          nameVi: "Bàn ăn",
          slug: "dining-tables",
          descriptionEn: "Beautiful dining tables for family gatherings",
          descriptionVi: "Bàn ăn đẹp cho những buổi tụ họp gia đình",
          displayOrder: 1,
        },
        {
          nameEn: "Dining Chairs",
          nameVi: "Ghế ăn",
          slug: "dining-chairs",
          descriptionEn: "Comfortable dining chairs",
          descriptionVi: "Ghế ăn thoải mái",
          displayOrder: 2,
        },
      ],
    },
    {
      nameEn: "Office",
      nameVi: "Văn phòng",
      slug: "office",
      descriptionEn: "Professional furniture for your home office",
      descriptionVi: "Đồ nội thất chuyên nghiệp cho văn phòng tại nhà",
      image: "/images/business-slide2.jpg",
      color: "bg-gray-50 border-gray-200",
      displayOrder: 4,
      subcategories: [
        {
          nameEn: "Office Desks",
          nameVi: "Bàn làm việc",
          slug: "office-desks",
          descriptionEn: "Functional desks for productive work",
          descriptionVi: "Bàn làm việc chức năng cho công việc hiệu quả",
          displayOrder: 1,
        },
        {
          nameEn: "Office Chairs",
          nameVi: "Ghế văn phòng",
          slug: "office-chairs",
          descriptionEn: "Ergonomic chairs for long work sessions",
          descriptionVi: "Ghế công thái học cho những buổi làm việc dài",
          displayOrder: 2,
        },
      ],
    },
  ];

  for (const categoryData of categories) {
    const { subcategories, ...categoryInfo } = categoryData;
    
    // Create category
    const category = await db.category.create({
      data: {
        ...categoryInfo,
        isActive: true,
      },
    });

    console.log(`Created category: ${category.nameEn}`);

    // Create subcategories
    for (const subcategoryData of subcategories) {
      const subcategory = await db.subcategory.create({
        data: {
          ...subcategoryData,
          categoryId: category.id,
          isActive: true,
        },
      });

      console.log(`  Created subcategory: ${subcategory.nameEn}`);
    }
  }

  console.log("Categories seeded successfully!");
}

seedCategories()
  .catch((error) => {
    console.error("Error seeding categories:", error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
