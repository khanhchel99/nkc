import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addMoreInspectionPhotos() {
  console.log('📸 Adding more inspection photos for testing...\n');

  // Get the first order with items
  const order = await prisma.wholesaleOrder.findFirst({
    include: {
      items: {
        include: {
          inspection: true
        }
      }
    }
  });

  if (!order || !order.items.length) {
    console.log('❌ No orders found');
    return;
  }

  console.log(`Found order ${order.orderNumber} with ${order.items.length} items`);

  // Add photos to each item
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
      console.log(`Created inspection for item ${item.id}`);
    }

    // Add multiple photos to this inspection
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
        await prisma.inspectionPhoto.create({
          data: {
            inspectionId: inspection.id,
            category: category,
            imageUrl: `https://via.placeholder.com/400x300/cccccc/666666?text=${encodeURIComponent(category.replace('_', ' '))}`,
            caption: `${category.replace('_', ' ')} photo for item ${item.id}`,
            reviewStatus: 'pending_review'
          }
        });
        console.log(`Added ${category} photo for item ${item.id}`);
      }
    }
  }

  console.log('✅ Photos added successfully!');
}

addMoreInspectionPhotos()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
