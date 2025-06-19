const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  try {
    console.log("Starting to seed products...");
    
    // Simple test insert
    const product = await prisma.product.create({
      data: {
        name: "Classic Sofa",
        slug: "classic-sofa",
        price: 499,
        originalPrice: 599,
        images: ["/images/business-slide1.jpg", "/images/business-slide2.jpg"],
        room: "Living Room",
        type: "Sofa",
        combo: "Living Room Set",
        description: "A timeless classic sofa that brings comfort and elegance to your living space.",
        longDescription: "Our Classic Sofa represents the perfect blend of traditional craftsmanship and modern comfort.",
        specifications: {"Dimensions": "210cm W x 90cm D x 85cm H"},
        features: ["Handcrafted hardwood frame", "Premium fabric upholstery"],
        inStock: true,
      }
    });
    
    console.log("Created product:", product.name);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
