import { db } from "../src/server/db";

async function assignProductsToCategories() {
  console.log("Assigning products to categories...");

  // Get all categories and subcategories
  const categories = await db.category.findMany({
    include: {
      subcategories: true,
    },
  });

  // Get all products
  const products = await db.product.findMany();

  console.log(`Found ${categories.length} categories and ${products.length} products`);

  // Create mapping from old room/type to new category/subcategory
  const categoryMapping: Record<string, { categoryId: string; subcategoryId?: string }> = {};

  categories.forEach(category => {
    // Map room names to categories
    if (category.slug === 'living-room') {
      categoryMapping['Living Room'] = { categoryId: category.id };
      // Map specific types to subcategories
      category.subcategories.forEach(sub => {
        if (sub.slug === 'sofas') {
          categoryMapping['Living Room-Sofa'] = { categoryId: category.id, subcategoryId: sub.id };
        } else if (sub.slug === 'coffee-tables') {
          categoryMapping['Living Room-Table'] = { categoryId: category.id, subcategoryId: sub.id };
        } else if (sub.slug === 'tv-stands') {
          categoryMapping['Living Room-Cabinet'] = { categoryId: category.id, subcategoryId: sub.id };
        }
      });
    } else if (category.slug === 'bedroom') {
      categoryMapping['Bedroom'] = { categoryId: category.id };
      category.subcategories.forEach(sub => {
        if (sub.slug === 'beds') {
          categoryMapping['Bedroom-Bed'] = { categoryId: category.id, subcategoryId: sub.id };
        } else if (sub.slug === 'wardrobes') {
          categoryMapping['Bedroom-Cabinet'] = { categoryId: category.id, subcategoryId: sub.id };
        } else if (sub.slug === 'nightstands') {
          categoryMapping['Bedroom-Table'] = { categoryId: category.id, subcategoryId: sub.id };
        }
      });
    } else if (category.slug === 'dining-room') {
      categoryMapping['Dining Room'] = { categoryId: category.id };
      category.subcategories.forEach(sub => {
        if (sub.slug === 'dining-tables') {
          categoryMapping['Dining Room-Table'] = { categoryId: category.id, subcategoryId: sub.id };
        } else if (sub.slug === 'dining-chairs') {
          categoryMapping['Dining Room-Chair'] = { categoryId: category.id, subcategoryId: sub.id };
        }
      });
    } else if (category.slug === 'office') {
      categoryMapping['Office'] = { categoryId: category.id };
      category.subcategories.forEach(sub => {
        if (sub.slug === 'office-desks') {
          categoryMapping['Office-Desk'] = { categoryId: category.id, subcategoryId: sub.id };
        } else if (sub.slug === 'office-chairs') {
          categoryMapping['Office-Chair'] = { categoryId: category.id, subcategoryId: sub.id };
        }
      });
    }
  });

  console.log("Category mapping:", categoryMapping);

  // Update products
  let updatedCount = 0;
  for (const product of products) {
    const roomTypeKey = `${product.room}-${product.type}`;
    const roomKey = product.room;
    
    let mapping = categoryMapping[roomTypeKey] || categoryMapping[roomKey];
    
    if (mapping) {
      await db.product.update({
        where: { id: product.id },
        data: {
          categoryId: mapping.categoryId,
          subcategoryId: mapping.subcategoryId || null,
        },
      });
      
      console.log(`Updated product "${product.nameEn}" -> Category: ${mapping.categoryId}, Subcategory: ${mapping.subcategoryId || 'none'}`);
      updatedCount++;
    } else {
      console.log(`No mapping found for product "${product.nameEn}" (${product.room}-${product.type})`);
    }
  }

  console.log(`Successfully updated ${updatedCount} products`);
}

assignProductsToCategories()
  .catch((error) => {
    console.error("Error assigning products to categories:", error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
