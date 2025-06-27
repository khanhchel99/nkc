import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding authentication data...');

  // Create roles
  const retailRole = await prisma.role.upsert({
    where: { name: 'retail' },
    update: {},
    create: {
      name: 'retail',
      description: 'Retail customer with standard shopping privileges',
    },
  });

  const wholesaleRole = await prisma.role.upsert({
    where: { name: 'wholesale' },
    update: {},
    create: {
      name: 'wholesale',
      description: 'Wholesale customer with bulk ordering and special pricing',
    },
  });

  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: {
      name: 'admin',
      description: 'Administrator with full system access',
    },
  });

  // Create permissions
  const permissions = [
    { name: 'view_products', description: 'View product catalog' },
    { name: 'place_order', description: 'Place orders' },
    { name: 'view_order_history', description: 'View order history' },
    { name: 'manage_profile', description: 'Manage user profile' },
    { name: 'manage_addresses', description: 'Manage shipping addresses' },
    { name: 'manage_payment_methods', description: 'Manage payment methods' },
    { name: 'bulk_order', description: 'Place bulk orders' },
    { name: 'view_wholesale_prices', description: 'View wholesale pricing' },
    { name: 'manage_business_profile', description: 'Manage business information' },
    { name: 'view_invoices', description: 'View and download invoices' },
    { name: 'manage_users', description: 'Manage user accounts' },
    { name: 'manage_products', description: 'Manage product catalog' },
    { name: 'manage_orders', description: 'Manage all orders' },
    { name: 'view_analytics', description: 'View business analytics' },
    { name: 'manage_content', description: 'Manage website content' },
  ];

  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: { name: permission.name },
      update: {},
      create: permission,
    });
  }

  // Assign permissions to roles
  const retailPermissions = ['view_products', 'place_order', 'view_order_history', 'manage_profile', 'manage_addresses', 'manage_payment_methods'];
  const wholesalePermissions = [...retailPermissions, 'bulk_order', 'view_wholesale_prices', 'manage_business_profile', 'view_invoices'];
  const adminPermissions = permissions.map(p => p.name); // All permissions

  // Clear existing role permissions
  await prisma.rolePermission.deleteMany();

  // Assign retail permissions
  for (const permissionName of retailPermissions) {
    const permission = await prisma.permission.findUnique({ where: { name: permissionName } });
    if (permission) {
      await prisma.rolePermission.create({
        data: {
          roleId: retailRole.id,
          permissionId: permission.id,
        },
      });
    }
  }

  // Assign wholesale permissions
  for (const permissionName of wholesalePermissions) {
    const permission = await prisma.permission.findUnique({ where: { name: permissionName } });
    if (permission) {
      await prisma.rolePermission.create({
        data: {
          roleId: wholesaleRole.id,
          permissionId: permission.id,
        },
      });
    }
  }

  // Assign admin permissions
  for (const permissionName of adminPermissions) {
    const permission = await prisma.permission.findUnique({ where: { name: permissionName } });
    if (permission) {
      await prisma.rolePermission.create({
        data: {
          roleId: adminRole.id,
          permissionId: permission.id,
        },
      });
    }
  }

  console.log('Authentication data seeded successfully!');
  console.log(`Created roles: ${retailRole.name}, ${wholesaleRole.name}, ${adminRole.name}`);
  console.log(`Created ${permissions.length} permissions`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
