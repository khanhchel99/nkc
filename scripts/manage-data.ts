import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function clearAllData() {
  console.log("🧹 Clearing all data from the database...");
  
  try {
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
    
    console.log("✅ All data cleared successfully!");
  } catch (error) {
    console.error("❌ Error clearing data:", error);
  } finally {
    await prisma.$disconnect();
  }
}

async function showDataSummary() {
  console.log("📊 Current Database Summary:");
  
  try {
    const userCount = await prisma.user.count();
    const productCount = await prisma.product.count();
    const orderCount = await prisma.order.count();
    const inquiryCount = await prisma.inquiryForm.count();
    const cartCount = await prisma.cart.count();
    const businessProfileCount = await prisma.businessProfile.count();
    
    console.log(`👥 Users: ${userCount}`);
    console.log(`🛋️ Products: ${productCount}`);
    console.log(`📦 Orders: ${orderCount}`);
    console.log(`📝 Inquiries: ${inquiryCount}`);
    console.log(`🛒 Shopping Carts: ${cartCount}`);
    console.log(`🏢 Business Profiles: ${businessProfileCount}`);
    
    // Show users by role
    const retailUsers = await prisma.user.count({ where: { roleId: 1 } });
    const wholesaleUsers = await prisma.user.count({ where: { roleId: 2 } });
    const adminUsers = await prisma.user.count({ where: { roleId: 3 } });
    
    console.log(`\n👥 Users by Role:`);
    console.log(`   🛍️ Retail: ${retailUsers}`);
    console.log(`   🏢 Wholesale: ${wholesaleUsers}`);
    console.log(`   👨‍💼 Admin: ${adminUsers}`);
    
    // Show orders by status
    const pendingOrders = await prisma.order.count({ where: { status: 'pending' } });
    const confirmedOrders = await prisma.order.count({ where: { status: 'confirmed' } });
    const shippedOrders = await prisma.order.count({ where: { status: 'shipped' } });
    const deliveredOrders = await prisma.order.count({ where: { status: 'delivered' } });
    
    console.log(`\n📦 Orders by Status:`);
    console.log(`   ⏳ Pending: ${pendingOrders}`);
    console.log(`   ✅ Confirmed: ${confirmedOrders}`);
    console.log(`   🚚 Shipped: ${shippedOrders}`);
    console.log(`   📋 Delivered: ${deliveredOrders}`);
    
  } catch (error) {
    console.error("❌ Error getting data summary:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Get command line argument
const command = process.argv[2];

switch (command) {
  case 'clear':
    clearAllData();
    break;
  case 'summary':
  case 'stats':
    showDataSummary();
    break;
  default:
    console.log("📋 Available commands:");
    console.log("  npm run data:clear    - Clear all data from database");
    console.log("  npm run data:summary  - Show current data summary");
    console.log("  npm run data:create   - Create dummy data (use create-dummy-data.ts)");
}
