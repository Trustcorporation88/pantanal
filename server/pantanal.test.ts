import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock db module
vi.mock("./db", () => ({
  upsertUser: vi.fn(),
  getUserByOpenId: vi.fn(),
  getCategories: vi.fn(() => Promise.resolve([
    { id: 1, name: "Lanches", slug: "lanches", emoji: "🍔", sortOrder: 1 },
    { id: 2, name: "Bebidas", slug: "bebidas", emoji: "🥤", sortOrder: 2 },
  ])),
  getProducts: vi.fn(() => Promise.resolve([
    { id: 1, categoryId: 1, name: "X-Burguer", description: "Delicioso", price: "18.00", imageUrl: null, badge: "mais_pedido", available: true, stockQty: 999, sortOrder: 1, extras: [], dietaryTags: [] },
  ])),
  getCartItems: vi.fn(() => Promise.resolve([])),
  addToCart: vi.fn(() => Promise.resolve({ id: 1 })),
  updateCartItem: vi.fn(() => Promise.resolve()),
  removeCartItem: vi.fn(() => Promise.resolve()),
  clearCart: vi.fn(() => Promise.resolve()),
  getAddresses: vi.fn(() => Promise.resolve([])),
  upsertAddress: vi.fn(() => Promise.resolve({ id: 1 })),
  getCouponByCode: vi.fn(() => Promise.resolve(null)),
  createOrder: vi.fn(() => Promise.resolve({ id: 1 })),
  getUserOrders: vi.fn(() => Promise.resolve([])),
  getOrderById: vi.fn(() => Promise.resolve(null)),
  getOrderItems: vi.fn(() => Promise.resolve([])),
  getAllOrders: vi.fn(() => Promise.resolve([])),
  getUserAddresses: vi.fn(() => Promise.resolve([])),
  addCartItem: vi.fn(() => Promise.resolve({ id: 1 })),
  getProductById: vi.fn(() => Promise.resolve({ id: 1, name: 'X-Burguer', price: '18.00', stockQty: 999, available: true })),
  getUserReviews: vi.fn(() => Promise.resolve([])),
  getProductReviews: vi.fn(() => Promise.resolve([])),
  addLoyaltyTransaction: vi.fn(() => Promise.resolve()),
  getLoyaltyTransactions: vi.fn(() => Promise.resolve([])),
  deleteAddress: vi.fn(() => Promise.resolve()),
  createReview: vi.fn(() => Promise.resolve({ id: 1 })),
  updateUserProfile: vi.fn(() => Promise.resolve()),
  getAllCoupons: vi.fn(() => Promise.resolve([])),
  getAllProducts: vi.fn(() => Promise.resolve([])),
  getAdminStats: vi.fn(() => Promise.resolve({ totalOrders: 0, totalRevenue: 0, pendingOrders: 0, totalProducts: 0 })),
  updateOrderStatus: vi.fn(() => Promise.resolve()),
  upsertProduct: vi.fn(() => Promise.resolve({ id: 1 })),
  deleteProduct: vi.fn(() => Promise.resolve()),
  upsertCoupon: vi.fn(() => Promise.resolve({ id: 1 })),
  upsertCategory: vi.fn(() => Promise.resolve({ id: 1 })),
  incrementCouponUsage: vi.fn(() => Promise.resolve()),
  addLoyaltyPoints: vi.fn(() => Promise.resolve()),
}));

function createPublicCtx(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function createUserCtx(role: "user" | "admin" = "user"): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user",
      email: "test@example.com",
      name: "Test User",
      loginMethod: "manus",
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("auth", () => {
  it("me returns null for unauthenticated user", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });

  it("me returns user for authenticated user", async () => {
    const caller = appRouter.createCaller(createUserCtx());
    const result = await caller.auth.me();
    expect(result?.email).toBe("test@example.com");
  });

  it("logout clears cookie and returns success", async () => {
    const ctx = createUserCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result.success).toBe(true);
  });
});

describe("catalog", () => {
  it("returns categories list", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    const result = await caller.catalog.categories();
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe("Lanches");
  });

  it("returns products list", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    const result = await caller.catalog.products({});
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("X-Burguer");
  });
});

describe("cart", () => {
  it("get returns empty cart for authenticated user", async () => {
    const caller = appRouter.createCaller(createUserCtx());
    const result = await caller.cart.get();
    expect(result).toEqual([]);
  });

  it("add to cart requires authentication", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    await expect(caller.cart.add({ productId: 1, quantity: 1 })).rejects.toThrow();
  });

  it("add to cart works for authenticated user", async () => {
    const caller = appRouter.createCaller(createUserCtx());
    const result = await caller.cart.add({ productId: 1, quantity: 1 });
    expect(result).toHaveProperty("id");
  });
});

describe("coupon validation", () => {
  it("throws error for invalid coupon", async () => {
    const caller = appRouter.createCaller(createUserCtx());
    await expect(caller.coupon.validate({ code: "INVALID", orderValue: 50 })).rejects.toThrow();
  });
});

describe("admin", () => {
  it("stats requires admin role", async () => {
    const caller = appRouter.createCaller(createUserCtx("user"));
    await expect(caller.admin.stats()).rejects.toThrow();
  });

  it("stats accessible by admin", async () => {
    const caller = appRouter.createCaller(createUserCtx("admin"));
    const result = await caller.admin.stats();
    expect(result).toHaveProperty("totalOrders");
    expect(result).toHaveProperty("totalRevenue");
  });
});

describe("order", () => {
  it("list requires authentication", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    await expect(caller.order.list()).rejects.toThrow();
  });

  it("list returns empty for new user", async () => {
    const caller = appRouter.createCaller(createUserCtx());
    const result = await caller.order.list();
    expect(result).toEqual([]);
  });
});

describe("admin.loginAdmin", () => {
  it("returns success with correct credentials from env", async () => {
    process.env.ADMIN_USERNAME = "pantanal";
    process.env.ADMIN_PASSWORD = "@2026$";
    const caller = appRouter.createCaller(createPublicCtx());
    const result = await caller.admin.loginAdmin({ username: "pantanal", password: "@2026$" });
    expect(result.success).toBe(true);
    expect(result.token).toBeTruthy();
  });

  it("throws UNAUTHORIZED with wrong password", async () => {
    process.env.ADMIN_USERNAME = "pantanal";
    process.env.ADMIN_PASSWORD = "@2026$";
    const caller = appRouter.createCaller(createPublicCtx());
    await expect(
      caller.admin.loginAdmin({ username: "pantanal", password: "wrongpass" })
    ).rejects.toThrow();
  });

  it("throws UNAUTHORIZED with wrong username", async () => {
    process.env.ADMIN_USERNAME = "pantanal";
    process.env.ADMIN_PASSWORD = "@2026$";
    const caller = appRouter.createCaller(createPublicCtx());
    await expect(
      caller.admin.loginAdmin({ username: "hacker", password: "@2026$" })
    ).rejects.toThrow();
  });
});
