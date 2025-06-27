import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function createDummyData() {
  console.log("🌱 Creating dummy data for the entire system...");

  try {
    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log("🧹 Clearing existing data...");
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.cartItem.deleteMany();
    await prisma.cart.deleteMany();
    await prisma.businessProfile.deleteMany();
    await prisma.inquiryForm.deleteMany();
    await prisma.product.deleteMany();
    await prisma.user.deleteMany();
    await prisma.rolePermission.deleteMany();
    await prisma.permission.deleteMany();
    await prisma.role.deleteMany();

    // Create roles
    console.log("👥 Creating roles...");
    const retailRole = await prisma.role.create({
      data: {
        id: 1,
        name: "retail",
        description: "Regular retail customers"
      }
    });

    const wholesaleRole = await prisma.role.create({
      data: {
        id: 2,
        name: "wholesale",
        description: "Wholesale business customers"
      }
    });

    const adminRole = await prisma.role.create({
      data: {
        id: 3,
        name: "admin",
        description: "System administrators"
      }
    });

    // Create permissions
    console.log("🔐 Creating permissions...");
    const permissions = await Promise.all([
      prisma.permission.create({ data: { name: "manage_users", description: "Manage user accounts" } }),
      prisma.permission.create({ data: { name: "manage_products", description: "Manage product catalog" } }),
      prisma.permission.create({ data: { name: "manage_orders", description: "Manage customer orders" } }),
      prisma.permission.create({ data: { name: "view_reports", description: "View business reports" } }),
      prisma.permission.create({ data: { name: "manage_wholesale", description: "Manage wholesale accounts" } }),
    ]);

    // Assign permissions to roles
    console.log("🔗 Assigning permissions to roles...");
    // Admin gets all permissions
    for (const permission of permissions) {
      await prisma.rolePermission.create({
        data: {
          roleId: adminRole.id,
          permissionId: permission.id
        }
      });
    }

    // Wholesale gets limited permissions
    await prisma.rolePermission.create({
      data: {
        roleId: wholesaleRole.id,
        permissionId: permissions.find(p => p.name === "view_reports")!.id
      }
    });

    // Create admin user
    console.log("👨‍💼 Creating admin user...");
    const hashedAdminPassword = await bcrypt.hash("admin123", 10);
    const adminUser = await prisma.user.create({
      data: {
        name: "System Administrator",
        email: "admin@nkc.com",
        passwordHash: hashedAdminPassword,
        roleId: adminRole.id,
        status: "active",
        phone: "+1234567890"
      }
    });

    // Create dummy retail users
    console.log("🛍️ Creating retail customers...");
    const retailUsers: any[] = [];
    const retailUserData = [
      { name: "Alice Johnson", email: "alice@example.com", phone: "+1234567891" },
      { name: "Bob Smith", email: "bob@example.com", phone: "+1234567892" },
      { name: "Carol Davis", email: "carol@example.com", phone: "+1234567893" },
      { name: "David Wilson", email: "david@example.com", phone: "+1234567894" },
      { name: "Eva Brown", email: "eva@example.com", phone: "+1234567895" },
      { name: "Frank Miller", email: "frank@example.com", phone: "+1234567896" },
      { name: "Grace Taylor", email: "grace@example.com", phone: "+1234567897" },
      { name: "Henry Anderson", email: "henry@example.com", phone: "+1234567898" },
    ];

    for (const userData of retailUserData) {
      const hashedPassword = await bcrypt.hash("password123", 10);
      const user = await prisma.user.create({
        data: {
          ...userData,
          passwordHash: hashedPassword,
          roleId: retailRole.id,
          status: "active"
        }
      });
      retailUsers.push(user);
    }

    // Create dummy wholesale users
    console.log("🏢 Creating wholesale customers...");
    const wholesaleUsers: any[] = [];
    const wholesaleUserData = [
      { name: "John Corporate", email: "john@bigstore.com", phone: "+1234567899", company: "Big Store Inc." },
      { name: "Sarah Business", email: "sarah@furniture-plus.com", phone: "+1234567800", company: "Furniture Plus LLC" },
      { name: "Mike Wholesale", email: "mike@bulk-buyers.com", phone: "+1234567801", company: "Bulk Buyers Co." },
      { name: "Lisa Enterprise", email: "lisa@office-solutions.com", phone: "+1234567802", company: "Office Solutions Ltd." },
    ];

    for (const userData of wholesaleUserData) {
      const hashedPassword = await bcrypt.hash("password123", 10);
      const { company, ...userDataWithoutCompany } = userData;
      const user = await prisma.user.create({
        data: {
          ...userDataWithoutCompany,
          passwordHash: hashedPassword,
          roleId: wholesaleRole.id,
          status: "active"
        }
      });

      // Create business profile for wholesale users
      await prisma.businessProfile.create({
        data: {
          userId: user.id,
          companyName: company,
          taxId: `TAX${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
          verified: Math.random() > 0.5,
          documents: [`/documents/${company.toLowerCase().replace(/\s+/g, '-')}-license.pdf`]
        }
      });

      wholesaleUsers.push(user);
    }

    // Create dummy products
    console.log("🛋️ Creating products...");
    const products: any[] = [];
    const productData = [
      {
        slug: "modern-sofa-grey",
        nameEn: "Modern Grey Sofa",
        nameVi: "Sofa Xám Hiện Đại",
        descriptionEn: "Comfortable modern sofa with grey upholstery",
        descriptionVi: "Sofa hiện đại thoải mái với bọc da màu xám",
        price: 599.99,
        originalPrice: 799.99,
        images: ["/images/business-slide1.jpg", "/images/business-slide2.jpg"],
        room: "Living Room",
        type: "Sofa",
        category: "Furniture",
        inStock: true,
        stock: 15,
        featured: true,
        featuresEn: ["3-seater", "Comfortable cushions", "Durable fabric"],
        featuresVi: ["3 chỗ ngồi", "Đệm thoải mái", "Vải bền"],
        longDescriptionEn: "This modern grey sofa is perfect for any contemporary living room. Made with high-quality materials and designed for comfort.",
        longDescriptionVi: "Chiếc sofa xám hiện đại này hoàn hảo cho bất kỳ phòng khách đương đại nào. Được làm từ vật liệu chất lượng cao và thiết kế để thoải mái.",
        specificationsEn: { "Width": "220cm", "Depth": "90cm", "Height": "85cm", "Material": "Fabric" },
        specificationsVi: { "Chiều rộng": "220cm", "Chiều sâu": "90cm", "Chiều cao": "85cm", "Chất liệu": "Vải" }
      },
      {
        slug: "oak-dining-table",
        nameEn: "Oak Dining Table",
        nameVi: "Bàn Ăn Gỗ Sồi",
        descriptionEn: "Solid oak dining table for 6 people",
        descriptionVi: "Bàn ăn gỗ sồi nguyên khối cho 6 người",
        price: 899.99,
        originalPrice: 1199.99,
        images: ["/images/business-slide3.jpg", "/images/business-slide5.jpg"],
        room: "Dining Room",
        type: "Table",
        category: "Furniture",
        inStock: true,
        stock: 8,
        featured: true,
        featuresEn: ["Solid oak", "Seats 6", "Natural finish"],
        featuresVi: ["Gỗ sồi nguyên khối", "6 chỗ ngồi", "Hoàn thiện tự nhiên"],
        longDescriptionEn: "Beautiful solid oak dining table that can comfortably seat 6 people. Perfect for family meals and entertaining.",
        longDescriptionVi: "Bàn ăn gỗ sồi nguyên khối đẹp có thể ngồi thoải mái cho 6 người. Hoàn hảo cho bữa ăn gia đình và tiếp khách.",
        specificationsEn: { "Length": "180cm", "Width": "90cm", "Height": "75cm", "Material": "Solid Oak" },
        specificationsVi: { "Chiều dài": "180cm", "Chiều rộng": "90cm", "Chiều cao": "75cm", "Chất liệu": "Gỗ Sồi Nguyên Khối" }
      },
      {
        slug: "king-size-bed",
        nameEn: "King Size Bed Frame",
        nameVi: "Khung Giường King Size",
        descriptionEn: "Elegant king size bed frame with headboard",
        descriptionVi: "Khung giường king size thanh lịch với đầu giường",
        price: 749.99,
        originalPrice: 999.99,
        images: ["/images/business-slide6.jpg", "/images/business-slide1.jpg"],
        room: "Bedroom",
        type: "Bed",
        category: "Furniture",
        inStock: true,
        stock: 12,
        featured: false,
        featuresEn: ["King size", "Upholstered headboard", "Sturdy construction"],
        featuresVi: ["Kích thước king", "Đầu giường bọc nệm", "Cấu trúc chắc chắn"],
        longDescriptionEn: "This elegant king size bed frame features a beautiful upholstered headboard and sturdy construction for lasting comfort.",
        longDescriptionVi: "Khung giường king size thanh lịch này có đầu giường bọc nệm đẹp và cấu trúc chắc chắn để thoải mái lâu dài.",
        specificationsEn: { "Size": "King (180x200cm)", "Height": "120cm", "Material": "Wood + Fabric" },
        specificationsVi: { "Kích thước": "King (180x200cm)", "Chiều cao": "120cm", "Chất liệu": "Gỗ + Vải" }
      },
      {
        slug: "office-chair-ergonomic",
        nameEn: "Ergonomic Office Chair",
        nameVi: "Ghế Văn Phòng Ergonomic",
        descriptionEn: "Comfortable ergonomic office chair with lumbar support",
        descriptionVi: "Ghế văn phòng ergonomic thoải mái với hỗ trợ thắt lưng",
        price: 299.99,
        originalPrice: 399.99,
        images: ["/images/business-slide2.jpg", "/images/business-slide3.jpg"],
        room: "Office",
        type: "Chair",
        category: "Furniture",
        inStock: true,
        stock: 25,
        featured: false,
        featuresEn: ["Lumbar support", "Adjustable height", "Breathable mesh"],
        featuresVi: ["Hỗ trợ thắt lưng", "Điều chỉnh độ cao", "Lưới thoáng khí"],
        longDescriptionEn: "Professional ergonomic office chair designed for long working hours with excellent lumbar support and breathable materials.",
        longDescriptionVi: "Ghế văn phòng ergonomic chuyên nghiệp được thiết kế cho thời gian làm việc dài với hỗ trợ thắt lưng tuyệt vời và vật liệu thoáng khí.",
        specificationsEn: { "Height": "Adjustable 42-52cm", "Width": "65cm", "Material": "Mesh + Plastic" },
        specificationsVi: { "Chiều cao": "Điều chỉnh 42-52cm", "Chiều rộng": "65cm", "Chất liệu": "Lưới + Nhựa" }
      },
      {
        slug: "bookshelf-wooden",
        nameEn: "5-Tier Wooden Bookshelf",
        nameVi: "Kệ Sách Gỗ 5 Tầng",
        descriptionEn: "Spacious 5-tier wooden bookshelf for storage",
        descriptionVi: "Kệ sách gỗ 5 tầng rộng rãi để lưu trữ",
        price: 199.99,
        originalPrice: 249.99,
        images: ["/images/business-slide5.jpg", "/images/business-slide6.jpg"],
        room: "Study",
        type: "Storage",
        category: "Furniture",
        inStock: true,
        stock: 20,
        featured: false,
        featuresEn: ["5 shelves", "Solid wood", "Easy assembly"],
        featuresVi: ["5 kệ", "Gỗ nguyên khối", "Dễ lắp ráp"],
        longDescriptionEn: "This spacious 5-tier bookshelf provides ample storage space for books, decorations, and other items.",
        longDescriptionVi: "Kệ sách 5 tầng rộng rãi này cung cấp không gian lưu trữ rộng cho sách, đồ trang trí và các vật dụng khác.",
        specificationsEn: { "Height": "180cm", "Width": "80cm", "Depth": "30cm", "Material": "Pine Wood" },
        specificationsVi: { "Chiều cao": "180cm", "Chiều rộng": "80cm", "Chiều sâu": "30cm", "Chất liệu": "Gỗ Thông" }
      },
      {
        slug: "coffee-table-glass",
        nameEn: "Glass Coffee Table",
        nameVi: "Bàn Cà Phê Kính",
        descriptionEn: "Modern glass coffee table with metal legs",
        descriptionVi: "Bàn cà phê kính hiện đại với chân kim loại",
        price: 349.99,
        originalPrice: 449.99,
        images: ["/images/business-slide1.jpg", "/images/business-slide3.jpg"],
        room: "Living Room",
        type: "Table",
        category: "Furniture",
        inStock: false,
        stock: 0,
        featured: false,
        featuresEn: ["Tempered glass", "Chrome legs", "Easy to clean"],
        featuresVi: ["Kính cường lực", "Chân chrome", "Dễ vệ sinh"],
        longDescriptionEn: "Sleek modern coffee table with tempered glass top and stylish chrome legs, perfect for contemporary living rooms.",
        longDescriptionVi: "Bàn cà phê hiện đại bóng bẩy với mặt kính cường lực và chân chrome thời trang, hoàn hảo cho phòng khách đương đại.",
        specificationsEn: { "Length": "120cm", "Width": "60cm", "Height": "45cm", "Material": "Glass + Chrome" },
        specificationsVi: { "Chiều dài": "120cm", "Chiều rộng": "60cm", "Chiều cao": "45cm", "Chất liệu": "Kính + Chrome" }
      }
    ];

    for (const productInfo of productData) {
      const product = await prisma.product.create({
        data: productInfo
      });
      products.push(product);
    }

    // Create shopping carts for some users
    console.log("🛒 Creating shopping carts...");
    for (let i = 0; i < 5; i++) {
      const user = retailUsers[i];
      const cart = await prisma.cart.create({
        data: {
          userId: user.id
        }
      });

      // Add random items to cart (ensure no duplicates)
      const numItems = Math.floor(Math.random() * 3) + 1;
      const usedProductIds = new Set();
      
      for (let j = 0; j < numItems; j++) {
        let randomProduct;
        let attempts = 0;
        
        // Find a product that hasn't been added to this cart yet
        do {
          randomProduct = products[Math.floor(Math.random() * products.length)];
          attempts++;
        } while (usedProductIds.has(randomProduct.id) && attempts < 10);
        
        if (!usedProductIds.has(randomProduct.id)) {
          usedProductIds.add(randomProduct.id);
          await prisma.cartItem.create({
            data: {
              cartId: cart.id,
              productId: randomProduct.id,
              quantity: Math.floor(Math.random() * 3) + 1
            }
          });
        }
      }
    }

    // Create orders
    console.log("📦 Creating orders...");
    const orderStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
    const allUsers = [...retailUsers, ...wholesaleUsers];

    for (let i = 0; i < 15; i++) {
      const randomUser = allUsers[Math.floor(Math.random() * allUsers.length)];
      const status = orderStatuses[Math.floor(Math.random() * orderStatuses.length)];
      
      // Create order
      const order = await prisma.order.create({
        data: {
          userId: randomUser.id,
          status,
          total: 0, // Will calculate below
          createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Random date within last 30 days
        }
      });

      // Add order items
      const numItems = Math.floor(Math.random() * 4) + 1;
      let orderTotal = 0;
      const usedProductIds = new Set();

      for (let j = 0; j < numItems; j++) {
        let randomProduct;
        let attempts = 0;
        
        // Find a product that hasn't been added to this order yet
        do {
          randomProduct = products[Math.floor(Math.random() * products.length)];
          attempts++;
        } while (usedProductIds.has(randomProduct.id) && attempts < 10);
        
        if (!usedProductIds.has(randomProduct.id)) {
          usedProductIds.add(randomProduct.id);
          const quantity = Math.floor(Math.random() * 3) + 1;
          const price = Number(randomProduct.price);

          await prisma.orderItem.create({
            data: {
              orderId: order.id,
              productId: randomProduct.id,
              quantity,
              price
            }
          });

          orderTotal += price * quantity;
        }
      }

      // Update order total
      await prisma.order.update({
        where: { id: order.id },
        data: { total: orderTotal }
      });
    }

    // Create inquiry forms
    console.log("📝 Creating inquiry forms...");
    const inquiryServices = [
      'general-inquiry',
      'product-consultation',
      'bulk-order',
      'wholesale-account',
      'custom-design',
      'delivery-service'
    ];

    const inquiryData = [
      {
        name: "Jennifer Wilson",
        email: "jennifer@example.com",
        mobile: "+1234567810",
        service: "wholesale-account",
        note: "I'm interested in setting up a wholesale account for my furniture store chain. We have 5 locations and are looking for reliable suppliers.",
        companyName: "Wilson Furniture Stores",
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
      },
      {
        name: "Michael Chen",
        email: "michael@designstudio.com",
        mobile: "+1234567811",
        service: "custom-design",
        note: "We need custom furniture pieces for a hotel project. Looking for modern designs that can be manufactured in bulk.",
        companyName: "Chen Design Studio",
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      },
      {
        name: "Rachel Green",
        email: "rachel@homestore.com",
        mobile: "+1234567812",
        service: "bulk-order",
        note: "Interested in bulk pricing for office furniture. Need approximately 50 chairs and 20 desks for our new office.",
        companyName: "Home & Office Store",
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      },
      {
        name: "Tom Anderson",
        email: "tom@example.com",
        mobile: "+1234567813",
        service: "product-consultation",
        note: "Need help choosing the right sofa for my living room. Looking for something modern but comfortable.",
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      },
      {
        name: "Lisa Martinez",
        email: "lisa@hotelgroup.com",
        mobile: "+1234567814",
        service: "wholesale-account",
        note: "We operate a boutique hotel chain and are looking for furniture suppliers for our upcoming renovations.",
        companyName: "Boutique Hotel Group",
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
      },
      {
        name: "David Kim",
        email: "david@example.com",
        mobile: "+1234567815",
        service: "delivery-service",
        note: "What are your delivery options for large furniture items? I'm located about 50 miles from the city.",
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      }
    ];

    for (const inquiry of inquiryData) {
      await prisma.inquiryForm.create({
        data: inquiry
      });
    }

    console.log("✅ Dummy data creation completed successfully!");
    console.log("\n📊 Summary:");
    console.log(`👥 Users created: ${retailUsers.length + wholesaleUsers.length + 1} (${retailUsers.length} retail, ${wholesaleUsers.length} wholesale, 1 admin)`);
    console.log(`🛋️ Products created: ${products.length}`);
    console.log(`📦 Orders created: 15`);
    console.log(`🛒 Shopping carts created: 5`);
    console.log(`📝 Inquiries created: ${inquiryData.length}`);
    console.log(`🏢 Business profiles created: ${wholesaleUsers.length}`);
    console.log("\n🔑 Admin Login:");
    console.log("Email: admin@nkc.com");
    console.log("Password: admin123");
    console.log("\n🛍️ Sample Customer Login:");
    console.log("Email: alice@example.com");
    console.log("Password: password123");
    console.log("\n🏢 Sample Wholesale Login:");
    console.log("Email: john@bigstore.com");
    console.log("Password: password123");

  } catch (error) {
    console.error("❌ Error creating dummy data:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createDummyData()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
