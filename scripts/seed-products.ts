import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const products = [
  {
    name: "Classic Sofa",
    slug: "classic-sofa",
    price: 499,
    originalPrice: 599,
    images: [
      "/images/business-slide1.jpg",
      "/images/business-slide2.jpg",
      "/images/business-slide3.jpg",
    ],
    room: "Living Room",
    type: "Sofa",
    combo: "Living Room Set",
    description: "A timeless classic sofa that brings comfort and elegance to your living space. Crafted with premium materials and attention to detail.",
    longDescription: "Our Classic Sofa represents the perfect blend of traditional craftsmanship and modern comfort. Each piece is meticulously handcrafted using sustainably sourced hardwood frames and premium upholstery materials. The deep-seated design ensures maximum comfort for relaxation, while the timeless aesthetic complements any home decor style.",
    specifications: {
      "Dimensions": "210cm W x 90cm D x 85cm H",
      "Materials": "Hardwood frame, Premium fabric upholstery",
      "Color Options": "Beige, Gray, Navy Blue",
      "Weight": "65kg",
      "Assembly": "Professional assembly recommended",
      "Warranty": "5 years structural, 2 years fabric"
    },
    features: [
      "Handcrafted hardwood frame",
      "Premium fabric upholstery",
      "High-density foam cushions",
      "Removable cushion covers",
      "Professional assembly available",      "5-year structural warranty"
    ],
    inStock: true,
    category: "Living Room Furniture",
  },
  {
    name: "Modern Bed",
    slug: "modern-bed",
    price: 799,
    originalPrice: 899,
    images: [
      "/images/business-slide2.jpg",
      "/images/business-slide1.jpg",
      "/images/business-slide3.jpg",
    ],
    room: "Bedroom",
    type: "Bed",
    combo: "Bedroom Combo",
    description: "Contemporary bed frame with sleek design and superior comfort for a perfect night's sleep.",
    longDescription: "The Modern Bed features a minimalist design that brings contemporary elegance to your bedroom. Built with solid wood construction and upholstered headboard for ultimate comfort and style.",
    specifications: {
      "Dimensions": "160cm W x 200cm L x 120cm H",
      "Materials": "Solid wood frame, Upholstered headboard",
      "Size Options": "Queen, King",
      "Weight": "45kg",
      "Assembly": "Required (tools included)",
      "Warranty": "10 years frame, 3 years upholstery"
    },
    features: [
      "Solid wood construction",
      "Upholstered headboard",
      "Platform design (no box spring needed)",
      "Under-bed storage space",
      "Easy assembly",      "10-year frame warranty"
    ],
    inStock: true,
    category: "Bedroom Furniture",
  },
  {
    name: "Dining Table",
    slug: "dining-table",
    price: 599,
    originalPrice: null,
    images: [
      "/images/business-slide3.jpg",
      "/images/business-slide1.jpg",
      "/images/business-slide2.jpg",
    ],
    room: "Kitchen",
    type: "Table",
    combo: "Dining Set",
    description: "Elegant dining table perfect for family meals and entertaining guests.",
    longDescription: "This sophisticated dining table combines functionality with style. Made from high-quality wood with a durable finish that resists scratches and stains. The perfect centerpiece for your dining room.",
    specifications: {
      "Dimensions": "180cm W x 90cm D x 75cm H",
      "Materials": "Solid oak wood",
      "Finish": "Natural wood stain",
      "Weight": "35kg",
      "Seating": "Seats up to 6 people",
      "Warranty": "3 years"
    },
    features: [
      "Solid oak construction",
      "Scratch-resistant finish",
      "Seats up to 6 people",
      "Easy to clean surface",
      "Timeless design",      "3-year warranty"
    ],
    inStock: true,
    category: "Dining Room Furniture",
  },
  {
    name: "Office Chair",
    slug: "office-chair",
    price: 299,
    originalPrice: null,
    images: [
      "/images/business-slide1.jpg",
      "/images/business-slide2.jpg",
    ],
    room: "Office",
    type: "Chair",
    combo: null,
    description: "Ergonomic office chair designed for all-day comfort and productivity.",
    longDescription: "This premium office chair features advanced ergonomic design to support your posture during long work sessions. With adjustable height, lumbar support, and breathable mesh backing.",
    specifications: {
      "Dimensions": "65cm W x 65cm D x 100-110cm H",
      "Materials": "Mesh, Steel frame, Foam padding",
      "Weight Capacity": "120kg",
      "Adjustability": "Height, Armrests, Lumbar support",
      "Warranty": "2 years"
    },
    features: [
      "Ergonomic design",
      "Adjustable height",
      "Lumbar support",
      "Breathable mesh backing",      "360-degree swivel",
      "2-year warranty"
    ],
    inStock: true,
    category: "Office Furniture",
  },
  {
    name: "Wardrobe",
    slug: "wardrobe",
    price: 899,
    originalPrice: 999,
    images: [
      "/images/business-slide2.jpg",
      "/images/business-slide3.jpg",
    ],
    room: "Bedroom",
    type: "Cabinet",
    combo: "Bedroom Combo",
    description: "Spacious wardrobe with multiple compartments for organized storage.",
    longDescription: "This elegant wardrobe offers ample storage space with multiple hanging areas, shelves, and drawers. Perfect for keeping your bedroom organized and clutter-free.",
    specifications: {
      "Dimensions": "120cm W x 60cm D x 200cm H",
      "Materials": "Engineered wood, Metal hardware",
      "Storage": "2 hanging areas, 4 shelves, 2 drawers",
      "Weight": "75kg",
      "Assembly": "Required",
      "Warranty": "5 years"
    },
    features: [
      "Multiple storage compartments",
      "Soft-close doors",
      "Metal hanging rods",
      "Adjustable shelves",
      "Anti-tip safety mechanism",      "5-year warranty"
    ],
    inStock: true,
    category: "Bedroom Furniture",
  },
  {
    name: "Coffee Table",
    slug: "coffee-table",
    price: 299,
    originalPrice: null,
    images: [
      "/images/business-slide3.jpg",
      "/images/business-slide1.jpg",
    ],
    room: "Living Room",
    type: "Table",
    combo: "Living Room Set",
    description: "Stylish coffee table that complements any living room decor.",
    longDescription: "This modern coffee table features a sleek design with storage space underneath. Perfect for magazines, books, and other living room essentials.",
    specifications: {
      "Dimensions": "100cm W x 50cm D x 40cm H",
      "Materials": "Glass top, Metal frame",
      "Storage": "Lower shelf",
      "Weight": "20kg",
      "Assembly": "Minimal assembly required",
      "Warranty": "2 years"
    },
    features: [
      "Tempered glass top",
      "Metal frame construction",
      "Lower storage shelf",
      "Easy to clean",      "Modern design",
      "2-year warranty"
    ],
    inStock: true,
    category: "Living Room Furniture",
  },
];

async function main() {
  console.log("🌱 Seeding products...");
  
  for (const product of products) {
    const result = await prisma.product.upsert({
      where: { slug: product.slug },
      update: product,
      create: product,
    });
    console.log(`✅ Created/Updated product: ${result.name}`);
  }
  
  console.log("🎉 Seeding completed!");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding products:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
