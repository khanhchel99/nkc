import { userRouter } from "@/server/api/routers/user";
import { productRouter } from "@/server/api/routers/product";
import { categoryRouter } from "@/server/api/routers/category";
import { inquiryListRouter } from "@/server/api/routers/inquiryList";
import { adminRouter } from "@/server/api/routers/admin";
import { productManagementRouter } from "@/server/api/routers/productManagement";
import { orderManagementRouter } from "@/server/api/routers/orderManagement";
import { wholesaleRouter } from "@/server/api/routers/wholesale";
import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  user: userRouter,
  product: productRouter,
  category: categoryRouter,
  inquiryList: inquiryListRouter,
  admin: adminRouter,
  productManagement: productManagementRouter,
  orderManagement: orderManagementRouter,
  wholesale: wholesaleRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.user.getCurrentUser();
 */
export const createCaller = createCallerFactory(appRouter);
