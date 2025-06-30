import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAdminUsers() {
  try {
    console.log('=== ADMIN USERS ===');
    const users = await prisma.user.findMany({
      include: {
        role: true,
      },
    });
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email})`);
      console.log(`   - Role: ${user.role?.name || 'No role'}`);
      console.log(`   - Status: ${user.status}`);
      console.log(`   - Created: ${user.createdAt}`);
      console.log('');
    });

    console.log(`\nTotal Users: ${users.length}`);

    // Check if there's an admin role
    const roles = await prisma.role.findMany();
    console.log('\n=== ROLES ===');
    roles.forEach((role) => {
      console.log(`- ${role.name} (ID: ${role.id})`);
    });

  } catch (error) {
    console.error('Error checking admin users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdminUsers();
