import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function analyzeCategories() {
  try {
    const products = await prisma.product.findMany({
      select: { room: true, type: true, category: true, combo: true }
    });
    
    const roomCategories: Record<string, {
      types: Set<string>;
      categories: Set<string>;
      combos: Set<string>;
      count: number;
    }> = {};
    
    products.forEach(p => {
      if (!roomCategories[p.room]) {
        roomCategories[p.room] = {
          types: new Set(),
          categories: new Set(),
          combos: new Set(),
          count: 0
        };
      }
      roomCategories[p.room].types.add(p.type);
      roomCategories[p.room].categories.add(p.category);
      if (p.combo) roomCategories[p.room].combos.add(p.combo);
      roomCategories[p.room].count++;
    });
    
    console.log('📊 Current Product Categories Analysis:');
    console.log(`Total Products: ${products.length}\n`);
    
    Object.entries(roomCategories).forEach(([room, data]) => {
      console.log(`🏠 ${room} (${data.count} products):`);
      console.log(`  Types: ${Array.from(data.types).join(', ')}`);
      console.log(`  Categories: ${Array.from(data.categories).join(', ')}`);
      if (data.combos.size > 0) {
        console.log(`  Combos: ${Array.from(data.combos).join(', ')}`);
      }
      console.log('');
    });
    
    // Suggest category structure
    console.log('💡 Suggested Category Structure:');
    Object.entries(roomCategories).forEach(([room, data]) => {
      console.log(`\n📂 ${room} Furniture`);
      Array.from(data.types).forEach(type => {
        console.log(`  ├── ${type}`);
      });
      if (data.combos.size > 0) {
        console.log(`  └── Sets & Combos`);
        Array.from(data.combos).forEach(combo => {
          console.log(`      ├── ${combo}`);
        });
      }
    });
    
  } catch (error) {
    console.error('Error analyzing categories:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeCategories();
