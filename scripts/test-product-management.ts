import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testProductManagement() {
  try {
    console.log('🧪 Testing Product Management...\n');

    // Test 1: Get all products
    console.log('1. Testing getProducts...');
    const products = await prisma.product.findMany({
      include: {
        categoryRef: true,
        subcategoryRef: true,
      },
      take: 5,
    });
    console.log(`✅ Found ${products.length} products`);
    if (products.length > 0) {
      console.log(`   Sample product: ${products[0].nameEn}`);
    }

    // Test 2: Get product statistics
    console.log('\n2. Testing product statistics...');
    const [
      totalProducts,
      inStockProducts,
      outOfStockProducts,
      featuredProducts,
    ] = await Promise.all([
      prisma.product.count(),
      prisma.product.count({ where: { inStock: true } }),
      prisma.product.count({ where: { inStock: false } }),
      prisma.product.count({ where: { featured: true } }),
    ]);

    console.log(`✅ Statistics:
   - Total products: ${totalProducts}
   - In stock: ${inStockProducts}
   - Out of stock: ${outOfStockProducts}
   - Featured: ${featuredProducts}`);

    // Test 3: Get filter options
    console.log('\n3. Testing filter options...');
    const [categories, rooms, types] = await Promise.all([
      prisma.category.findMany({
        where: { isActive: true },
        take: 3,
      }),
      prisma.product.findMany({
        select: { room: true },
        distinct: ['room'],
        take: 3,
      }),
      prisma.product.findMany({
        select: { type: true },
        distinct: ['type'],
        take: 3,
      }),
    ]);

    console.log(`✅ Filter options:
   - Categories: ${categories.map(c => c.nameEn).join(', ')}
   - Rooms: ${rooms.map(r => r.room).join(', ')}
   - Types: ${types.map(t => t.type).join(', ')}`);

    // Test 4: Create a test product (if none exist)
    if (totalProducts === 0) {
      console.log('\n4. Creating test product...');
      const testProduct = await prisma.product.create({
        data: {
          nameEn: 'Test Product',
          nameVi: 'Sản phẩm thử nghiệm',
          slug: 'test-product-' + Date.now(),
          descriptionEn: 'This is a test product',
          descriptionVi: 'Đây là sản phẩm thử nghiệm',
          price: 100,
          stock: 10,
          images: ['https://via.placeholder.com/300x300'],
          room: 'Living Room',
          type: 'Chair',
          category: 'Furniture',
          inStock: true,
          featured: false,
          featuresEn: ['Test feature'],
          featuresVi: ['Tính năng thử nghiệm'],
        },
      });
      console.log(`✅ Created test product: ${testProduct.nameEn} (ID: ${testProduct.id})`);
    }

    console.log('\n🎉 Product management tests completed successfully!');

  } catch (error) {
    console.error('❌ Error during product management testing:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testProductManagement();
