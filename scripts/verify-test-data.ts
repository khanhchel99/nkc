import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyTestData() {
  console.log('🔍 Verifying test data...\n');

  // Check admin users
  const adminUsers = await prisma.user.findMany({
    where: { 
      role: { 
        name: 'admin' 
      } 
    },
    include: {
      role: true
    }
  });
  console.log(`👤 Admin users: ${adminUsers.length}`);
  adminUsers.forEach(user => {
    console.log(`   - ${user.email} (${user.name}) - Role: ${user.role.name}`);
  });

  // Check wholesale users
  const wholesaleUsers = await prisma.wholesaleUser.findMany({
    include: {
      role: true
    }
  });
  console.log(`\n🏢 Wholesale users: ${wholesaleUsers.length}`);
  wholesaleUsers.forEach(user => {
    console.log(`   - ${user.email} (${user.name}) - Role: ${user.role.name}`);
  });

  // Check wholesale orders
  const orders = await prisma.wholesaleOrder.findMany({
    include: {
      items: {
        include: {
          inspection: {
            include: {
              photos: true
            }
          }
        }
      }
    }
  });
  console.log(`\n📦 Wholesale orders: ${orders.length}`);
  orders.forEach(order => {
    const totalPhotos = order.items.reduce((sum, item) => {
      return sum + (item.inspection?.photos?.length || 0);
    }, 0);
    console.log(`   - Order ${order.id}: ${order.items.length} items, ${totalPhotos} photos`);
    
    order.items.forEach(item => {
      if (item.inspection?.photos && item.inspection.photos.length > 0) {
        console.log(`     * Item ${item.id}: ${item.inspection.photos.length} photos`);
        item.inspection.photos.forEach(photo => {
          console.log(`       - ${photo.category}: ${photo.reviewStatus}`);
        });
      }
    });
  });

  console.log('\n✅ Verification complete!');
}

verifyTestData()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
