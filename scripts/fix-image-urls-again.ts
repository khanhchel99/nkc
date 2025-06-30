import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixImageUrlsAgain() {
  console.log('🔧 Fixing image URLs with working placeholders...\n');

  // Get all inspection photos
  const photos = await prisma.inspectionPhoto.findMany();
  
  console.log(`Found ${photos.length} photos to update`);

  for (const photo of photos) {
    // Use placeholder.com instead of via.placeholder.com
    const newUrl = `https://placeholder.com/400x300/${photo.category}`;
    
    await prisma.inspectionPhoto.update({
      where: { id: photo.id },
      data: { imageUrl: newUrl }
    });
    
    console.log(`Updated photo ${photo.id} (${photo.category}) to ${newUrl}`);
  }

  console.log('✅ All image URLs updated successfully!');
}

fixImageUrlsAgain()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
