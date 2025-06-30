import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkWholesaleData() {
  try {
    console.log('=== WHOLESALE COMPANIES ===');
    const companies = await prisma.wholesaleCompany.findMany({
      include: {
        users: true,
        orders: true,
      },
    });
    
    companies.forEach((company, index) => {
      console.log(`${index + 1}. ${company.name} (${company.code})`);
      console.log(`   - Status: ${company.status}`);
      console.log(`   - Users: ${company.users.length}`);
      console.log(`   - Orders: ${company.orders.length}`);
      console.log(`   - Created: ${company.createdAt}`);
      console.log('');
    });

    console.log('=== WHOLESALE ORDERS ===');
    const orders = await prisma.wholesaleOrder.findMany({
      include: {
        company: true,
        user: true,
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    orders.forEach((order, index) => {
      console.log(`${index + 1}. Order #${order.orderNumber}`);
      console.log(`   - Company: ${order.company.name}`);
      console.log(`   - User: ${order.user.name} (${order.user.email})`);
      console.log(`   - Status: ${order.status}`);
      console.log(`   - Total: $${order.totalAmount}`);
      console.log(`   - Items: ${order.items.length}`);
      console.log(`   - Created: ${order.createdAt}`);
      console.log('');
    });

    console.log(`\nTotal Companies: ${companies.length}`);
    console.log(`Total Orders: ${orders.length}`);

  } catch (error) {
    console.error('Error checking wholesale data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkWholesaleData();
