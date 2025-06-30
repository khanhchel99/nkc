import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function seedWholesaleSystem() {
  console.log("🌱 Seeding Wholesale System...\n");

  try {
    // 1. Create Wholesale Roles
    console.log("👥 Creating wholesale roles...");
    
    const roles = [
      {
        name: "ceo",
        displayName: "Chief Executive Officer",
        description: "Full access to all company data and operations",
        permissions: {
          "view_financial_full": true,
          "view_orders": true,
          "place_orders": true,
          "manage_team": true,
          "view_analytics": true,
          "manage_products": true,
          "view_communications": true,
          "approve_orders": true,
          "export_data": true
        }
      },
      {
        name: "purchase",
        displayName: "Purchase Manager",
        description: "Order management and product procurement",
        permissions: {
          "view_financial_limited": true,
          "view_orders": true,
          "place_orders": true,
          "manage_team": false,
          "view_analytics": true,
          "manage_products": true,
          "view_communications": true,
          "approve_orders": false,
          "export_data": true
        }
      },
      {
        name: "qa",
        displayName: "Quality Assurance",
        description: "Quality control and product inspection",
        permissions: {
          "view_financial_full": false,
          "view_orders": true,
          "place_orders": false,
          "manage_team": false,
          "view_analytics": false,
          "manage_products": false,
          "view_communications": true,
          "approve_orders": false,
          "export_data": false
        }
      },
      {
        name: "finance",
        displayName: "Finance Manager",
        description: "Financial tracking and payment management",
        permissions: {
          "view_financial_full": true,
          "view_orders": true,
          "place_orders": false,
          "manage_team": false,
          "view_analytics": true,
          "manage_products": false,
          "view_communications": false,
          "approve_orders": false,
          "export_data": true
        }
      }
    ];

    for (const role of roles) {
      await db.wholesaleRole.upsert({
        where: { name: role.name },
        update: {
          displayName: role.displayName,
          description: role.description,
          permissions: role.permissions,
        },
        create: role,
      });
      console.log(`   ✓ ${role.displayName} role created`);
    }

    // 2. Create Hubsch Company
    console.log("\n🏢 Creating Hubsch company...");
    
    const hubschCompany = await db.wholesaleCompany.upsert({
      where: { code: "HUBSCH" },
      update: {
        name: "Hubsch Interior ApS",
        contactEmail: "orders@hubsch.dk",
        contactPhone: "+45 XX XX XX XX",
        address: "Copenhagen, Denmark",
        taxId: "DK12345678",
        status: "active",
        settings: {
          currency: "EUR",
          language: "en",
          timezone: "Europe/Copenhagen"
        }
      },
      create: {
        name: "Hubsch Interior ApS",
        code: "HUBSCH",
        contactEmail: "orders@hubsch.dk",
        contactPhone: "+45 XX XX XX XX",
        address: "Copenhagen, Denmark",
        taxId: "DK12345678",
        subdomain: "hubsch",
        status: "active",
        settings: {
          currency: "EUR",
          language: "en",
          timezone: "Europe/Copenhagen"
        }
      },
    });

    console.log(`   ✓ ${hubschCompany.name} company created`);

    // 3. Create Test Users for Hubsch
    console.log("\n👤 Creating test users...");
    
    const ceoRole = await db.wholesaleRole.findUnique({ where: { name: "ceo" } });
    const purchaseRole = await db.wholesaleRole.findUnique({ where: { name: "purchase" } });
    const qaRole = await db.wholesaleRole.findUnique({ where: { name: "qa" } });

    if (!ceoRole || !purchaseRole || !qaRole) {
      throw new Error("Roles not found");
    }

    const testUsers = [
      {
        email: "ceo@hubsch.dk",
        name: "Lars Nielsen",
        phone: "+45 XX XX XX XX",
        companyId: hubschCompany.id,
        roleId: ceoRole.id,
        password: "hubsch2024"
      },
      {
        email: "purchase@hubsch.dk",
        name: "Anna Larsen",
        phone: "+45 XX XX XX XX",
        companyId: hubschCompany.id,
        roleId: purchaseRole.id,
        password: "hubsch2024"
      },
      {
        email: "qa@hubsch.dk",
        name: "Erik Hansen",
        phone: "+45 XX XX XX XX",
        companyId: hubschCompany.id,
        roleId: qaRole.id,
        password: "hubsch2024"
      }
    ];

    for (const userData of testUsers) {
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      
      await db.wholesaleUser.upsert({
        where: { email: userData.email },
        update: {
          name: userData.name,
          phone: userData.phone,
          passwordHash: hashedPassword,
        },
        create: {
          email: userData.email,
          name: userData.name,
          phone: userData.phone,
          passwordHash: hashedPassword,
          companyId: userData.companyId,
          roleId: userData.roleId,
        },
      });
      
      console.log(`   ✓ ${userData.name} (${userData.email}) created`);
    }

    // 4. Create Sample Private Products
    console.log("\n📦 Creating sample private products...");
    
    const sampleProducts = [
      {
        name: "Custom Oak Dining Table",
        description: "Handcrafted oak dining table with custom dimensions",
        sku: "HUB-DT-001",
        category: "Dining Room",
        specifications: {
          material: "Premium Oak",
          finish: "Natural Oil",
          dimensions: "200x100x75cm",
          weight: "45kg",
          customizable: true
        },
        images: ["/images/hubsch/dining-table-001.jpg"],
        designFiles: ["/files/hubsch/DT-001-technical.pdf"],
        basePrice: 1200.00,
        notes: "Signature dining table design for Hubsch collection",
        companyId: hubschCompany.id
      },
      {
        name: "Minimalist Office Chair",
        description: "Ergonomic office chair with Hubsch design language",
        sku: "HUB-CH-002",
        category: "Office",
        specifications: {
          material: "Aluminum, Fabric",
          adjustments: "Height, Tilt, Armrests",
          weight_capacity: "120kg",
          colors: ["Black", "Grey", "White"]
        },
        images: ["/images/hubsch/office-chair-002.jpg"],
        designFiles: ["/files/hubsch/CH-002-specs.pdf"],
        basePrice: 450.00,
        notes: "Modern office seating solution",
        companyId: hubschCompany.id
      },
      {
        name: "Modular Shelving System",
        description: "Flexible wall-mounted shelving system",
        sku: "HUB-SH-003",
        category: "Storage",
        specifications: {
          material: "Powder-coated Steel, Oak Shelves",
          modules: "Various sizes available",
          mounting: "Wall-mounted",
          load_capacity: "25kg per shelf"
        },
        images: ["/images/hubsch/shelving-003.jpg"],
        designFiles: ["/files/hubsch/SH-003-assembly.pdf"],
        basePrice: 180.00,
        notes: "Modular design allows for custom configurations",
        companyId: hubschCompany.id
      }
    ];

    for (const product of sampleProducts) {
      await db.privateProduct.upsert({
        where: {
          companyId_sku: {
            companyId: product.companyId,
            sku: product.sku
          }
        },
        update: product,
        create: product,
      });
      
      console.log(`   ✓ ${product.name} (${product.sku}) created`);
    }

    // 5. Create Sample Financial Records
    console.log("\n💰 Creating sample financial records...");
    
    const financialRecords = [
      {
        type: "invoice",
        amount: 15000.00,
        currency: "EUR",
        description: "Q4 2024 Custom Furniture Order",
        reference: "INV-2024-001",
        dueDate: new Date("2024-12-31"),
        status: "paid",
        paidDate: new Date("2024-12-28"),
        companyId: hubschCompany.id
      },
      {
        type: "invoice",
        amount: 8500.00,
        currency: "EUR",
        description: "Q1 2025 Office Furniture",
        reference: "INV-2025-001",
        dueDate: new Date("2025-01-31"),
        status: "pending",
        companyId: hubschCompany.id
      }
    ];

    for (const record of financialRecords) {
      await db.financialRecord.create({
        data: record
      });
      
      console.log(`   ✓ Financial record ${record.reference} created`);
    }

    console.log("\n✅ Wholesale System Seeded Successfully!");
    console.log("\n📋 Test Login Credentials:");
    console.log("=========================");
    console.log("CEO Access:");
    console.log("  Email: ceo@hubsch.dk");
    console.log("  Password: hubsch2024");
    console.log("\nPurchase Manager:");
    console.log("  Email: purchase@hubsch.dk");
    console.log("  Password: hubsch2024");
    console.log("\nQA Manager:");
    console.log("  Email: qa@hubsch.dk");
    console.log("  Password: hubsch2024");

  } catch (error) {
    console.error("❌ Seeding failed:", error);
  } finally {
    await db.$disconnect();
  }
}

// Run the seeding
seedWholesaleSystem().catch(console.error);
