import { PrismaClient } from '@prisma/client';
import bcryptjs from 'bcryptjs';

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    const adminRole = await prisma.role.findFirst({ where: { name: 'admin' } });
    if (!adminRole) {
      console.log('❌ Admin role not found');
      return;
    }

    // Check if admin already exists
    const existingAdmin = await prisma.user.findFirst({
      where: { email: 'admin@nkc.com' }
    });

    if (existingAdmin) {
      console.log('✅ Admin user already exists: admin@nkc.com');
      return;
    }

    const hashedPassword = await bcryptjs.hash('admin123', 12);
    
    const admin = await prisma.user.create({
      data: {
        email: 'admin@nkc.com',
        name: 'Admin User',
        passwordHash: hashedPassword,
        roleId: adminRole.id,
        status: 'active'
      }
    });
    
    console.log('✅ Admin user created:');
    console.log('   Email: admin@nkc.com');
    console.log('   Password: admin123');
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();
