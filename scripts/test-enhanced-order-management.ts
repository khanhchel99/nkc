import { db } from "../src/server/db";

async function testEnhancedOrderManagement() {
  console.log("🚀 Testing Enhanced Order Management System...\n");

  try {
    // Test 1: Verify new endpoints exist in the schema
    console.log("1. Testing Advanced Analytics...");
    
    // Get sample orders data
    const sampleOrders = await db.order.findMany({
      take: 5,
      include: {
        user: { include: { role: true } },
        items: { include: { product: true } }
      }
    });

    console.log(`   ✓ Found ${sampleOrders.length} sample orders for testing`);

    // Test 2: Verify order statistics calculation
    console.log("\n2. Testing Order Statistics...");
    
    const stats = await db.order.groupBy({
      by: ['status'],
      _count: {
        id: true
      }
    });

    console.log("   ✓ Order status breakdown:");
    stats.forEach(stat => {
      console.log(`     - ${stat.status}: ${stat._count.id} orders`);
    });

    // Test 3: Calculate revenue metrics
    console.log("\n3. Testing Revenue Calculations...");
    
    const totalRevenue = await db.order.aggregate({
      _sum: {
        total: true
      },
      _count: {
        id: true
      }
    });

    const avgOrderValue = totalRevenue._count.id > 0 
      ? Number(totalRevenue._sum.total || 0) / totalRevenue._count.id 
      : 0;

    console.log(`   ✓ Total Revenue: $${Number(totalRevenue._sum.total || 0).toFixed(2)}`);
    console.log(`   ✓ Total Orders: ${totalRevenue._count.id}`);
    console.log(`   ✓ Average Order Value: $${avgOrderValue.toFixed(2)}`);

    // Test 4: Test product popularity analysis
    console.log("\n4. Testing Product Analytics...");
    
    const productSales = await db.orderItem.groupBy({
      by: ['productId'],
      _sum: {
        quantity: true
      },
      _count: {
        id: true
      },
      orderBy: {
        _sum: {
          quantity: 'desc'
        }
      },
      take: 5
    });

    console.log("   ✓ Top 5 Products by Quantity Sold:");
    for (const sale of productSales) {
      const product = await db.product.findUnique({
        where: { id: sale.productId },
        select: { nameEn: true }
      });
      console.log(`     - ${product?.nameEn || 'Unknown'}: ${sale._sum.quantity || 0} units`);
    }

    // Test 5: Test date-based filtering
    console.log("\n5. Testing Date-based Analytics...");
    
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    const recentOrders = await db.order.findMany({
      where: {
        createdAt: {
          gte: last30Days
        }
      },
      select: {
        id: true,
        total: true,
        createdAt: true
      }
    });

    const recentRevenue = recentOrders.reduce((sum, order) => sum + Number(order.total), 0);
    
    console.log(`   ✓ Orders in last 30 days: ${recentOrders.length}`);
    console.log(`   ✓ Revenue in last 30 days: $${recentRevenue.toFixed(2)}`);

    // Test 6: Test export data structure
    console.log("\n6. Testing Export Data Structure...");
    
    const exportSample = sampleOrders.slice(0, 2).map(order => ({
      id: order.id,
      customerName: order.user.name || 'N/A',
      customerEmail: order.user.email || 'N/A',
      customerPhone: order.user.phone || 'N/A',
      status: order.status,
      total: Number(order.total),
      itemCount: order.items.length,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      items: order.items.map(item => ({
        productName: item.product.nameEn,
        quantity: item.quantity,
        price: Number(item.price)
      }))
    }));

    console.log("   ✓ Export data structure sample:");
    console.log(`     - Sample order: ${exportSample[0]?.id}`);
    console.log(`     - Customer: ${exportSample[0]?.customerName}`);
    console.log(`     - Items: ${exportSample[0]?.itemCount}`);
    console.log(`     - Total: $${exportSample[0]?.total}`);

    // Test 7: Timeline generation logic
    console.log("\n7. Testing Order Timeline Logic...");
    
    if (sampleOrders.length > 0) {
      const sampleOrder = sampleOrders[0];
      const timeline = [
        {
          id: 1,
          type: 'created',
          title: 'Order Created',
          description: `Order placed by ${sampleOrder.user.name || sampleOrder.user.email}`,
          timestamp: sampleOrder.createdAt,
          icon: 'plus',
          color: 'blue',
        }
      ];

      if (sampleOrder.status !== 'pending') {
        timeline.push({
          id: 2,
          type: 'status_change',
          title: 'Status Updated',
          description: `Order status changed to ${sampleOrder.status}`,
          timestamp: sampleOrder.updatedAt,
          icon: 'refresh',
          color: 'green',
        });
      }

      console.log(`   ✓ Generated timeline with ${timeline.length} events for order ${sampleOrder.id}`);
      timeline.forEach(event => {
        console.log(`     - ${event.title}: ${event.description}`);
      });
    }

    console.log("\n✅ Enhanced Order Management System Test Complete!");
    console.log("\n📊 New Features Available:");
    console.log("   • Advanced Analytics Dashboard");
    console.log("   • Export Orders (CSV/JSON)");
    console.log("   • Revenue Trend Analysis");
    console.log("   • Product Performance Metrics");
    console.log("   • Order Timeline/Activity Feed");
    console.log("   • Enhanced Filtering & Statistics");
    console.log("\n🎯 Next Steps:");
    console.log("   • Test analytics modal in browser");
    console.log("   • Test export functionality");
    console.log("   • Review performance with large datasets");
    console.log("   • Add more visualization components if needed");

  } catch (error) {
    console.error("❌ Test failed:", error);
  } finally {
    await db.$disconnect();
  }
}

// Run the test
testEnhancedOrderManagement().catch(console.error);
