import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addPhotosToAllOrders() {
  console.log('📸 Adding inspection photos to all orders...\n');

  // Get all orders with their items
  const orders = await prisma.wholesaleOrder.findMany({
    include: {
      items: {
        include: {
          inspection: true
        }
      }
    }
  });

  console.log(`Found ${orders.length} orders`);

  for (const order of orders) {
    console.log(`\nProcessing order ${order.orderNumber} with ${order.items.length} items`);

    for (const item of order.items) {
      let inspection = item.inspection;
      
      // Create inspection if it doesn't exist
      if (!inspection) {
        inspection = await prisma.productInspection.create({
          data: {
            orderItemId: item.id,
            status: 'pending',
          }
        });
        console.log(`  Created inspection for item ${item.id}`);
      }

      // Add photos for this inspection
      const photoCategories = [
        'master_box_front',
        'master_box_side', 
        'product_overall',
        'product_detail'
      ];

      for (const category of photoCategories) {
        // Check if photo already exists for this category
        const existingPhoto = await prisma.inspectionPhoto.findFirst({
          where: {
            inspectionId: inspection.id,
            category: category
          }
        });

        if (!existingPhoto) {
          const categorySeeds = {
            'master_box_front': 100,
            'master_box_side': 200,
            'product_overall': 300,
            'product_detail': 400
          };
          
          const seed = categorySeeds[category as keyof typeof categorySeeds] || 500;
          
          await prisma.inspectionPhoto.create({
            data: {
              inspectionId: inspection.id,
              category: category,
              imageUrl: `https://picsum.photos/seed/${seed}/400/300`,
              caption: `${category.replace('_', ' ')} photo for item ${item.id}`,
              reviewStatus: 'pending_review'
            }
          });
          console.log(`    Added ${category} photo for item ${item.id}`);
        } else {
          console.log(`    ${category} photo already exists for item ${item.id}`);
        }
      }
    }
  }

  console.log('\n✅ All photos added successfully!');
}

addPhotosToAllOrders()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
