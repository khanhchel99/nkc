import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function createTestWholesaleOrders() {
  console.log("🛒 Creating test wholesale orders...\n");

  try {
    // Get the test company and users
    const hubschCompany = await db.wholesaleCompany.findUnique({
      where: { code: "HUBSCH" }
    });

    if (!hubschCompany) {
      console.log("❌ Hubsch company not found. Run seed-wholesale.ts first.");
      return;
    }

    const ceoUser = await db.wholesaleUser.findUnique({
      where: { email: "ceo@hubsch.dk" }
    });

    if (!ceoUser) {
      console.log("❌ CEO user not found. Run seed-wholesale.ts first.");
      return;
    }

    // Get some private products
    const products = await db.privateProduct.findMany({
      where: { companyId: hubschCompany.id },
      take: 3
    });

    if (products.length === 0) {
      console.log("❌ No private products found. Run seed-wholesale.ts first.");
      return;
    }

    // Create test orders
    const testOrders = [
      {
        orderNumber: "WS-2025-001",
        status: "pending",
        priority: "normal",
        totalAmount: 2500.00,
        currency: "EUR",
        notes: "Urgent delivery requested",
        estimatedDelivery: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      },
      {
        orderNumber: "WS-2025-002", 
        status: "confirmed",
        priority: "high",
        totalAmount: 4800.00,
        currency: "EUR",
        notes: "Custom specifications required",
        estimatedDelivery: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 days from now
      },
      {
        orderNumber: "WS-2025-003",
        status: "shipped",
        priority: "normal", 
        totalAmount: 1200.00,
        currency: "EUR",
        actualDelivery: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      }
    ];

    for (const orderData of testOrders) {
      // Create the order
      const order = await db.wholesaleOrder.create({
        data: {
          ...orderData,
          companyId: hubschCompany.id,
          userId: ceoUser.id,
        },
      });

      console.log(`   ✓ Created order: ${order.orderNumber}`);

      // Create order items
      const selectedProducts = products.slice(0, Math.floor(Math.random() * 3) + 1);
      
      for (const product of selectedProducts) {
        const quantity = Math.floor(Math.random() * 5) + 1;
        const unitPrice = product.basePrice || 100;
        const totalPrice = Number(unitPrice) * quantity;

        await db.wholesaleOrderItem.create({
          data: {
            orderId: order.id,
            productId: product.id,
            quantity,
            unitPrice,
            totalPrice,
            specifications: {
              finish: "Standard",
              customization: "None"
            },
            notes: `Quantity: ${quantity} units`
          },
        });
      }

      // Create status history
      await db.orderStatusHistory.create({
        data: {
          orderId: order.id,
          status: orderData.status,
          notes: `Order ${orderData.status}`,
          changedBy: ceoUser.id,
        },
      });

      // Create financial record
      await db.financialRecord.create({
        data: {
          orderId: order.id,
          companyId: hubschCompany.id,
          type: "debit",
          amount: orderData.totalAmount,
          description: `Invoice for order ${order.orderNumber}`,
          currency: orderData.currency,
        },
      });
    }

    console.log("\n✅ Test wholesale orders created successfully!");
    console.log("📊 You can now view these orders in:");
    console.log("   - Wholesale dashboard: http://localhost:3000/wholesale/dashboard");
    console.log("   - Admin order management (when implemented)");

  } catch (error) {
    console.error("❌ Error creating test orders:", error);
  } finally {
    await db.$disconnect();
  }
}

createTestWholesaleOrders();
