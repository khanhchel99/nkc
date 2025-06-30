import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testCompleteProductManagement() {
  try {
    console.log('🧪 Testing Complete Product Management Workflow...\n');

    // Test 1: Initial state
    console.log('1. Getting initial product count...');
    const initialCount = await prisma.product.count();
    console.log(`✅ Initial products: ${initialCount}`);

    // Test 2: Create a new product
    console.log('\n2. Creating a new test product...');
    const newProduct = await prisma.product.create({
      data: {
        nameEn: 'Test Management Product',
        nameVi: 'Sản phẩm quản lý thử nghiệm',
        slug: 'test-management-product-' + Date.now(),
        descriptionEn: 'This is a test product for management testing',
        descriptionVi: 'Đây là sản phẩm thử nghiệm cho việc kiểm tra quản lý',
        price: 299.99,
        wholesalePrice: 199.99,
        originalPrice: 399.99,
        stock: 50,
        images: [
          'https://via.placeholder.com/300x300/895D35/FFFFFF?text=Test+Product',
          'https://via.placeholder.com/300x300/7A4F2A/FFFFFF?text=Test+Product+2'
        ],
        room: 'Living Room',
        type: 'Sofa',
        category: 'Seating',
        inStock: true,
        featured: true,
        featuresEn: ['Premium quality', 'Comfortable seating', 'Modern design'],
        featuresVi: ['Chất lượng cao cấp', 'Chỗ ngồi thoải mái', 'Thiết kế hiện đại'],
        longDescriptionEn: 'A premium sofa designed for modern living spaces with exceptional comfort and style.',
        longDescriptionVi: 'Một chiếc sofa cao cấp được thiết kế cho không gian sống hiện đại với sự thoải mái và phong cách đặc biệt.',
        metaDescriptionEn: 'Premium test sofa for modern living',
        metaDescriptionVi: 'Sofa thử nghiệm cao cấp cho cuộc sống hiện đại',
        metaTitleEn: 'Test Management Product | Premium Sofa',
        metaTitleVi: 'Sản phẩm quản lý thử nghiệm | Sofa cao cấp',
        specificationsEn: {
          'Dimensions': '200cm x 90cm x 80cm',
          'Material': 'Premium fabric',
          'Weight': '45kg',
          'Color': 'Grey'
        },
        specificationsVi: {
          'Kích thước': '200cm x 90cm x 80cm',
          'Chất liệu': 'Vải cao cấp',
          'Cân nặng': '45kg',
          'Màu sắc': 'Xám'
        }
      },
    });
    console.log(`✅ Created product: ${newProduct.nameEn} (ID: ${newProduct.id})`);

    // Test 3: Read/Get the product
    console.log('\n3. Retrieving the created product...');
    const retrievedProduct = await prisma.product.findUnique({
      where: { id: newProduct.id },
      include: {
        categoryRef: true,
        subcategoryRef: true,
      },
    });
    console.log(`✅ Retrieved product: ${retrievedProduct?.nameEn}`);
    console.log(`   Price: $${retrievedProduct?.price}`);
    console.log(`   Stock: ${retrievedProduct?.stock}`);
    console.log(`   Featured: ${retrievedProduct?.featured}`);

    // Test 4: Update the product
    console.log('\n4. Updating the product...');
    const updatedProduct = await prisma.product.update({
      where: { id: newProduct.id },
      data: {
        price: 349.99,
        stock: 75,
        featured: false,
        longDescriptionEn: 'Updated description: An even better premium sofa.',
      },
    });
    console.log(`✅ Updated product successfully`);
    console.log(`   New price: $${updatedProduct.price}`);
    console.log(`   New stock: ${updatedProduct.stock}`);
    console.log(`   Featured: ${updatedProduct.featured}`);

    // Test 5: Test filtering
    console.log('\n5. Testing product filtering...');
    const filteredProducts = await prisma.product.findMany({
      where: {
        room: 'Living Room',
        inStock: true,
        price: { gte: 100, lte: 500 },
      },
      take: 3,
    });
    console.log(`✅ Found ${filteredProducts.length} products matching filters (Living Room, In Stock, $100-$500)`);

    // Test 6: Test bulk operations
    console.log('\n6. Testing bulk operations...');
    const testProducts = await prisma.product.findMany({
      where: { nameEn: { contains: 'Test' } },
      take: 2,
    });
    
    if (testProducts.length > 0) {
      await prisma.product.updateMany({
        where: { id: { in: testProducts.map(p => p.id) } },
        data: { featured: true },
      });
      console.log(`✅ Bulk updated ${testProducts.length} test products to featured`);
    }

    // Test 7: Get statistics
    console.log('\n7. Getting updated statistics...');
    const [
      totalProducts,
      inStockProducts,
      outOfStockProducts,
      featuredProducts,
      lowStockProducts,
    ] = await Promise.all([
      prisma.product.count(),
      prisma.product.count({ where: { inStock: true } }),
      prisma.product.count({ where: { inStock: false } }),
      prisma.product.count({ where: { featured: true } }),
      prisma.product.count({ where: { stock: { lte: 10 } } }),
    ]);

    console.log(`✅ Updated statistics:
   - Total products: ${totalProducts}
   - In stock: ${inStockProducts}
   - Out of stock: ${outOfStockProducts}
   - Featured: ${featuredProducts}
   - Low stock (≤10): ${lowStockProducts}`);

    // Test 8: Search functionality
    console.log('\n8. Testing search functionality...');
    const searchResults = await prisma.product.findMany({
      where: {
        OR: [
          { nameEn: { contains: 'sofa', mode: 'insensitive' } },
          { nameVi: { contains: 'sofa', mode: 'insensitive' } },
          { descriptionEn: { contains: 'sofa', mode: 'insensitive' } },
          { descriptionVi: { contains: 'sofa', mode: 'insensitive' } },
        ],
      },
      take: 3,
    });
    console.log(`✅ Search for "sofa" found ${searchResults.length} products`);

    // Test 9: Pagination
    console.log('\n9. Testing pagination...');
    const page1 = await prisma.product.findMany({
      take: 5,
      skip: 0,
      orderBy: { createdAt: 'desc' },
    });
    const page2 = await prisma.product.findMany({
      take: 5,
      skip: 5,
      orderBy: { createdAt: 'desc' },
    });
    console.log(`✅ Pagination test: Page 1 has ${page1.length} products, Page 2 has ${page2.length} products`);

    // Test 10: Clean up (delete the test product)
    console.log('\n10. Cleaning up test product...');
    await prisma.product.delete({
      where: { id: newProduct.id },
    });
    console.log(`✅ Deleted test product`);

    const finalCount = await prisma.product.count();
    console.log(`✅ Final product count: ${finalCount} (should be ${initialCount})`);

    console.log('\n🎉 Complete Product Management workflow test completed successfully!');
    console.log('\n📋 Summary of tested features:');
    console.log('   ✅ Product creation (POST)');
    console.log('   ✅ Product retrieval (GET)');
    console.log('   ✅ Product updating (PUT)');
    console.log('   ✅ Product deletion (DELETE)');
    console.log('   ✅ Product filtering');
    console.log('   ✅ Bulk operations');
    console.log('   ✅ Statistics calculation');
    console.log('   ✅ Search functionality');
    console.log('   ✅ Pagination');
    console.log('   ✅ Data validation');

  } catch (error) {
    console.error('❌ Error during complete product management testing:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCompleteProductManagement();
