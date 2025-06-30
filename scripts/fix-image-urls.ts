import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixImageUrls() {
  console.log('🔧 Fixing image URLs...\n');

  // Get all inspection photos
  const photos = await prisma.inspectionPhoto.findMany();
  
  console.log(`Found ${photos.length} photos to update`);

  for (const photo of photos) {
    const newUrl = `https://via.placeholder.com/400x300/cccccc/666666?text=${encodeURIComponent(photo.category.replace('_', ' '))}`;
    
    await prisma.inspectionPhoto.update({
      where: { id: photo.id },
      data: { imageUrl: newUrl }
    });
    
    console.log(`Updated photo ${photo.id} (${photo.category})`);
  }

  console.log('✅ All image URLs updated successfully!');
}

fixImageUrls()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
