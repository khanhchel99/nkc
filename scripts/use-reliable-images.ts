import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function useReliableImages() {
  console.log('🔧 Setting up reliable test images...\n');

  // Get all inspection photos
  const photos = await prisma.inspectionPhoto.findMany();
  
  console.log(`Found ${photos.length} photos to update`);

  // Use different seeds for different categories to get variety
  const categorySeeds = {
    'master_box_front': 100,
    'master_box_side': 200,
    'product_overall': 300,
    'product_detail': 400
  };

  for (const photo of photos) {
    const seed = categorySeeds[photo.category as keyof typeof categorySeeds] || 500;
    // Use Picsum with a specific seed to ensure stable URLs
    const newUrl = `https://picsum.photos/seed/${seed}/400/300`;
    
    await prisma.inspectionPhoto.update({
      where: { id: photo.id },
      data: { imageUrl: newUrl }
    });
    
    console.log(`Updated photo ${photo.id} (${photo.category}) to ${newUrl}`);
  }

  console.log('✅ All image URLs updated with reliable Picsum URLs!');
}

useReliableImages()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
