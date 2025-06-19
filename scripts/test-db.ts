import { db } from '../src/server/db.js';

async function checkProducts() {
  try {
    const products = await db.product.findMany();
    console.log('=== PRODUCT DATA CHECK ===');
    console.log(`Total products: ${products.length}`);
    
    products.forEach((product, index) => {
      console.log(`Product ${index + 1}:`);
      console.log(`  ID: ${product.id}`);
      console.log(`  Slug: ${product.slug}`);
      console.log(`  Name EN: ${product.nameEn}`);
      console.log(`  Name VI: ${product.nameVi}`);
      console.log(`  Description EN: ${product.descriptionEn?.substring(0, 50)}...`);
      console.log(`  Price: ${product.price.toString()}`);
      console.log('---');
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await db.$disconnect();
  }
}

checkProducts();
