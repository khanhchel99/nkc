-- CreateTable
CREATE TABLE "wholesale_companies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "subdomain" TEXT,
    "contactEmail" TEXT NOT NULL,
    "contactPhone" TEXT,
    "address" TEXT,
    "taxId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "settings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wholesale_companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wholesale_roles" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "permissions" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wholesale_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wholesale_users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "passwordHash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "companyId" TEXT NOT NULL,
    "roleId" INTEGER NOT NULL,

    CONSTRAINT "wholesale_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wholesale_sessions" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wholesale_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "private_products" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sku" TEXT NOT NULL,
    "category" TEXT,
    "specifications" JSONB NOT NULL,
    "images" TEXT[],
    "designFiles" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'active',
    "basePrice" DECIMAL(10,2),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "companyId" TEXT NOT NULL,

    CONSTRAINT "private_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wholesale_orders" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "notes" TEXT,
    "internalNotes" TEXT,
    "estimatedDelivery" TIMESTAMP(3),
    "actualDelivery" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "companyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "wholesale_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wholesale_order_items" (
    "id" SERIAL NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "totalPrice" DECIMAL(10,2) NOT NULL,
    "specifications" JSONB,
    "notes" TEXT,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,

    CONSTRAINT "wholesale_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_status_history" (
    "id" SERIAL NOT NULL,
    "status" TEXT NOT NULL,
    "notes" TEXT,
    "changedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "orderId" TEXT NOT NULL,

    CONSTRAINT "order_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financial_records" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "description" TEXT NOT NULL,
    "reference" TEXT,
    "dueDate" TIMESTAMP(3),
    "paidDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "companyId" TEXT NOT NULL,
    "orderId" TEXT,

    CONSTRAINT "financial_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "communication_threads" (
    "id" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "companyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "communication_threads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "communication_messages" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "sender" TEXT NOT NULL,
    "senderName" TEXT NOT NULL,
    "attachments" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "threadId" TEXT NOT NULL,

    CONSTRAINT "communication_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "wholesale_companies_code_key" ON "wholesale_companies"("code");

-- CreateIndex
CREATE UNIQUE INDEX "wholesale_companies_subdomain_key" ON "wholesale_companies"("subdomain");

-- CreateIndex
CREATE UNIQUE INDEX "wholesale_roles_name_key" ON "wholesale_roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "wholesale_users_email_key" ON "wholesale_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "wholesale_sessions_sessionToken_key" ON "wholesale_sessions"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "private_products_companyId_sku_key" ON "private_products"("companyId", "sku");

-- CreateIndex
CREATE UNIQUE INDEX "wholesale_orders_orderNumber_key" ON "wholesale_orders"("orderNumber");

-- AddForeignKey
ALTER TABLE "wholesale_users" ADD CONSTRAINT "wholesale_users_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "wholesale_companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wholesale_users" ADD CONSTRAINT "wholesale_users_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "wholesale_roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wholesale_sessions" ADD CONSTRAINT "wholesale_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "wholesale_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "private_products" ADD CONSTRAINT "private_products_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "wholesale_companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wholesale_orders" ADD CONSTRAINT "wholesale_orders_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "wholesale_companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wholesale_orders" ADD CONSTRAINT "wholesale_orders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "wholesale_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wholesale_order_items" ADD CONSTRAINT "wholesale_order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "wholesale_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wholesale_order_items" ADD CONSTRAINT "wholesale_order_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "private_products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_status_history" ADD CONSTRAINT "order_status_history_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "wholesale_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_records" ADD CONSTRAINT "financial_records_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "wholesale_companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_records" ADD CONSTRAINT "financial_records_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "wholesale_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communication_threads" ADD CONSTRAINT "communication_threads_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "wholesale_companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communication_threads" ADD CONSTRAINT "communication_threads_userId_fkey" FOREIGN KEY ("userId") REFERENCES "wholesale_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communication_messages" ADD CONSTRAINT "communication_messages_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "communication_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
