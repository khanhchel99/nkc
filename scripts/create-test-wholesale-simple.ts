import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/lib/auth-utils';

const prisma = new PrismaClient() as any;

async function createTestWholesaleUser() {
  console.log('Creating test wholesale user...');

  try {
    // First, ensure we have a wholesale company
    let company = await prisma.wholesaleCompany.findFirst({
      where: { code: 'HUBSCH' }
    });

    if (!company) {
      company = await prisma.wholesaleCompany.create({
        data: {
          name: 'Hubsch',
          code: 'HUBSCH',
          contactEmail: 'contact@hubsch.com',
          contactPhone: '+49-123-456-7890',
          address: 'Hamburg, Germany',
          status: 'active',
        }
      });
      console.log('Created wholesale company:', company.name);
    }

    // Get or create wholesale role
    let role = await prisma.wholesaleRole.findFirst({
      where: { name: 'buyer' }
    });

    if (!role) {
      role = await prisma.wholesaleRole.create({
        data: {
          name: 'buyer',
          displayName: 'Buyer',
          permissions: ['view_products', 'place_orders', 'view_orders'],
          description: 'Can view products and place orders'
        }
      });
      console.log('Created wholesale role:', role.name);
    }

    // Create test wholesale user
    const hashedPassword = await hashPassword('password123');
    
    const wholesaleUser = await prisma.wholesaleUser.create({
      data: {
        email: 'buyer@hubsch.com',
        name: 'John Hubsch',
        phone: '+49-123-456-7891',
        passwordHash: hashedPassword,
        companyId: company.id,
        roleId: role.id,
        status: 'active'
      }
    });

    console.log('✅ Created test wholesale user:');
    console.log('  Email:', wholesaleUser.email);
    console.log('  Password: password123');
    console.log('  Company:', company.name);
    console.log('  Role:', role.name);

  } catch (error) {
    console.error('❌ Error creating test wholesale user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestWholesaleUser();
