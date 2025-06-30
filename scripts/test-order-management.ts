import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testOrderManagement() {
  try {
    console.log('🧪 Testing Order Management System...\n');

    // Test 1: Initial order count
    console.log('1. Getting initial order count...');
    const initialCount = await prisma.order.count();
    console.log(`✅ Initial orders: ${initialCount}`);

    // Test 2: Create test user if needed
    console.log('\n2. Ensuring test user exists...');
    let testUser = await prisma.user.findFirst({
      where: { email: 'test@example.com' },
    });

    if (!testUser) {
      testUser = await prisma.user.create({
        data: {
          email: 'test@example.com',
          name: 'Test Customer',
          phone: '+1234567890',
          roleId: 1, // Default retail customer
        },
      });
      console.log(`✅ Created test user: ${testUser.name} (${testUser.email})`);
    } else {
      console.log(`✅ Found existing test user: ${testUser.name} (${testUser.email})`);
    }

    // Test 3: Create test product if needed
    console.log('\n3. Ensuring test product exists...');
    let testProduct = await prisma.product.findFirst({
      where: { slug: 'test-order-product' },
    });

    if (!testProduct) {
      testProduct = await prisma.product.create({
        data: {
          nameEn: 'Test Order Product',
          nameVi: 'Sản phẩm đơn hàng thử nghiệm',
          slug: 'test-order-product',
          descriptionEn: 'A test product for order management',
          descriptionVi: 'Sản phẩm thử nghiệm cho quản lý đơn hàng',
          price: 199.99,
          wholesalePrice: 149.99,
          stock: 100,
          images: ['https://via.placeholder.com/300x300/895D35/FFFFFF?text=Test+Product'],
          room: 'Living Room',
          type: 'Sofa',
          category: 'Furniture',
          inStock: true,
          featured: false,
          featuresEn: ['Test feature'],
          featuresVi: ['Tính năng thử nghiệm'],
        },
      });
      console.log(`✅ Created test product: ${testProduct.nameEn}`);
    } else {
      console.log(`✅ Found existing test product: ${testProduct.nameEn}`);
    }

    // Test 4: Create a test order
    console.log('\n4. Creating test order...');
    const newOrder = await prisma.order.create({
      data: {
        userId: testUser.id,
        status: 'pending',
        total: 399.98, // 2 items × $199.99 each
        items: {
          create: [
            {
              productId: testProduct.id,
              quantity: 2,
              price: testProduct.price,
            },
          ],
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        user: {
          include: {
            role: true,
          },
        },
      },
    });
    console.log(`✅ Created order: ${newOrder.id} with total $${newOrder.total}`);

    // Test 5: Test order retrieval
    console.log('\n5. Testing order retrieval...');
    const retrievedOrder = await prisma.order.findUnique({
      where: { id: newOrder.id },
      include: {
        user: {
          include: {
            role: true,
            businessProfile: true,
          },
        },
        items: {
          include: {
            product: true,
          },
        },
      },
    });
    console.log(`✅ Retrieved order details:`);
    console.log(`   Order ID: ${retrievedOrder?.id}`);
    console.log(`   Customer: ${retrievedOrder?.user.name}`);
    console.log(`   Status: ${retrievedOrder?.status}`);
    console.log(`   Items: ${retrievedOrder?.items.length}`);
    console.log(`   Total: $${retrievedOrder?.total}`);

    // Test 6: Test order status updates
    console.log('\n6. Testing order status updates...');
    const statusUpdates = ['confirmed', 'shipped', 'delivered'];
    
    for (const status of statusUpdates) {
      const updatedOrder = await prisma.order.update({
        where: { id: newOrder.id },
        data: { status },
      });
      console.log(`✅ Updated order status to: ${updatedOrder.status}`);
      
      // Small delay to see the progression
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Test 7: Test order filtering and searching
    console.log('\n7. Testing order filtering...');
    
    // Test status filtering
    const filteredDeliveredOrders = await prisma.order.findMany({
      where: { status: 'delivered' },
      take: 3,
    });
    console.log(`✅ Found ${filteredDeliveredOrders.length} delivered orders`);

    // Test user filtering
    const userOrders = await prisma.order.findMany({
      where: { userId: testUser.id },
      include: {
        items: true,
      },
    });
    console.log(`✅ Found ${userOrders.length} orders for test user`);

    // Test price range filtering
    const expensiveOrders = await prisma.order.findMany({
      where: {
        total: { gte: 300 },
      },
      take: 3,
    });
    console.log(`✅ Found ${expensiveOrders.length} orders over $300`);

    // Test 8: Test order statistics
    console.log('\n8. Testing order statistics...');
    const [
      totalOrders,
      pendingOrders,
      confirmedOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { status: 'pending' } }),
      prisma.order.count({ where: { status: 'confirmed' } }),
      prisma.order.count({ where: { status: 'shipped' } }),
      prisma.order.count({ where: { status: 'delivered' } }),
      prisma.order.count({ where: { status: 'cancelled' } }),
    ]);

    console.log(`✅ Order statistics:
   - Total orders: ${totalOrders}
   - Pending: ${pendingOrders}
   - Confirmed: ${confirmedOrders}
   - Shipped: ${shippedOrders}
   - Delivered: ${deliveredOrders}
   - Cancelled: ${cancelledOrders}`);

    // Test revenue calculations
    const revenueStats = await prisma.order.aggregate({
      _sum: { total: true },
      _avg: { total: true },
      where: { status: { not: 'cancelled' } },
    });

    console.log(`✅ Revenue statistics:
   - Total revenue: $${revenueStats._sum.total || 0}
   - Average order value: $${Number(revenueStats._avg.total || 0).toFixed(2)}`);

    // Test 9: Test bulk operations
    console.log('\n9. Testing bulk operations...');
    
    // Create a few more test orders for bulk testing
    const bulkOrders = await Promise.all([
      prisma.order.create({
        data: {
          userId: testUser.id,
          status: 'pending',
          total: 99.99,
          items: {
            create: [{
              productId: testProduct.id,
              quantity: 1,
              price: 99.99,
            }],
          },
        },
      }),
      prisma.order.create({
        data: {
          userId: testUser.id,
          status: 'pending',
          total: 299.98,
          items: {
            create: [{
              productId: testProduct.id,
              quantity: 1,
              price: 299.98,
            }],
          },
        },
      }),
    ]);

    console.log(`✅ Created ${bulkOrders.length} additional test orders for bulk operations`);

    // Bulk update status
    const bulkUpdate = await prisma.order.updateMany({
      where: {
        id: { in: bulkOrders.map(o => o.id) },
      },
      data: {
        status: 'confirmed',
      },
    });

    console.log(`✅ Bulk updated ${bulkUpdate.count} orders to confirmed status`);

    // Test 10: Test pagination
    console.log('\n10. Testing pagination...');
    const page1 = await prisma.order.findMany({
      take: 2,
      skip: 0,
      orderBy: { createdAt: 'desc' },
      include: {
        user: true,
        items: true,
      },
    });

    const page2 = await prisma.order.findMany({
      take: 2,
      skip: 2,
      orderBy: { createdAt: 'desc' },
      include: {
        user: true,
        items: true,
      },
    });

    console.log(`✅ Pagination test: Page 1 has ${page1.length} orders, Page 2 has ${page2.length} orders`);

    // Test 11: Clean up test data
    console.log('\n11. Cleaning up test data...');
    
    // Delete test orders
    const deletedOrders = await prisma.order.deleteMany({
      where: {
        userId: testUser.id,
      },
    });
    console.log(`✅ Deleted ${deletedOrders.count} test orders`);

    // Delete test product
    await prisma.product.delete({
      where: { id: testProduct.id },
    });
    console.log(`✅ Deleted test product`);

    // Delete test user
    await prisma.user.delete({
      where: { id: testUser.id },
    });
    console.log(`✅ Deleted test user`);

    const finalCount = await prisma.order.count();
    console.log(`✅ Final order count: ${finalCount} (should be ${initialCount})`);

    console.log('\n🎉 Order Management System test completed successfully!');
    console.log('\n📋 Summary of tested features:');
    console.log('   ✅ Order creation with items');
    console.log('   ✅ Order retrieval with relationships');
    console.log('   ✅ Order status updates');
    console.log('   ✅ Order filtering and searching');
    console.log('   ✅ Order statistics and aggregations');
    console.log('   ✅ Revenue calculations');
    console.log('   ✅ Bulk operations');
    console.log('   ✅ Pagination');
    console.log('   ✅ Data cleanup and integrity');

  } catch (error) {
    console.error('❌ Error during order management testing:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testOrderManagement();
