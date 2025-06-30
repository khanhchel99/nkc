import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testWholesaleOrdersQuery() {
  try {
    console.log('=== TESTING WHOLESALE ORDERS QUERY ===');
    
    // Simulate the exact query from the orderManagement router
    const where = {}; // No filters for now
    
    // Get total count
    const total = await prisma.wholesaleOrder.count({ where });
    console.log(`Total wholesale orders: ${total}`);

    // Get orders (same query as in getWholesaleOrders)
    const orders = await prisma.wholesaleOrder.findMany({
      where,
      include: {
        company: {
          select: {
            id: true,
            name: true,
            code: true,
            contactEmail: true,
            status: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
              },
            },
          },
        },
        _count: {
          select: {
            items: true,
            statusHistory: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: 0,
      take: 20,
    });

    console.log('\n=== ORDERS RESULT ===');
    orders.forEach((order, index) => {
      console.log(`${index + 1}. Order #${order.orderNumber}`);
      console.log(`   - ID: ${order.id}`);
      console.log(`   - Company: ${order.company.name} (${order.company.code})`);
      console.log(`   - User: ${order.user.name} (${order.user.email})`);
      console.log(`   - Status: ${order.status}`);
      console.log(`   - Total: $${order.totalAmount}`);
      console.log(`   - Items count: ${order._count.items}`);
      console.log(`   - Created: ${order.createdAt}`);
      console.log('   - Items:');
      order.items.forEach((item, itemIndex) => {
        console.log(`     ${itemIndex + 1}. ${item.product.name} - Qty: ${item.quantity}, Unit Price: $${item.unitPrice}, Total: $${item.totalPrice}`);
      });
      console.log('');
    });

    // Test the mapping that should happen in the router
    const mappedOrders = orders.map(order => ({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      totalAmount: Number(order.totalAmount),
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      user: order.user,
      company: order.company,
      items: order.items.map(item => ({
        id: item.id,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice),
        product: item.product,
      })),
      _count: order._count,
    }));

    console.log('\n=== MAPPED RESULT (what frontend should receive) ===');
    console.log(JSON.stringify(mappedOrders, null, 2));

  } catch (error) {
    console.error('Error testing wholesale orders query:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testWholesaleOrdersQuery();
