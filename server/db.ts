import { and, desc, eq, gte, inArray, like, lte, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  addresses,
  cartItems,
  categories,
  coupons,
  loyaltyTransactions,
  orderItems,
  orders,
  products,
  reviews,
  users,
  type InsertUser,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ────────────────────────────────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};

  const textFields = ["name", "email", "loginMethod"] as const;
  for (const field of textFields) {
    const value = user[field];
    if (value === undefined) continue;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  }
  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function updateUserProfile(userId: number, data: { name?: string; phone?: string; email?: string }) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set(data).where(eq(users.id, userId));
}

// ─── Categories ───────────────────────────────────────────────────────────────
export async function getCategories() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(categories).where(eq(categories.active, true)).orderBy(categories.sortOrder);
}

export async function upsertCategory(data: { id?: number; name: string; slug: string; emoji?: string; sortOrder?: number }) {
  const db = await getDb();
  if (!db) return;
  if (data.id) {
    await db.update(categories).set(data).where(eq(categories.id, data.id));
  } else {
    await db.insert(categories).values(data);
  }
}

// ─── Products ─────────────────────────────────────────────────────────────────
export async function getProducts(filters?: {
  categoryId?: number;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  available?: boolean;
  dietaryTag?: string;
}) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [];
  if (filters?.categoryId) conditions.push(eq(products.categoryId, filters.categoryId));
  if (filters?.search) conditions.push(like(products.name, `%${filters.search}%`));
  if (filters?.minPrice !== undefined) conditions.push(gte(products.price, String(filters.minPrice)));
  if (filters?.maxPrice !== undefined) conditions.push(lte(products.price, String(filters.maxPrice)));
  if (filters?.available !== undefined) conditions.push(eq(products.available, filters.available));

  const rows = await db
    .select()
    .from(products)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(products.sortOrder, products.name);

  if (filters?.dietaryTag) {
    return rows.filter((p) => {
      const tags = p.dietaryTags as string[] | null;
      return tags?.includes(filters.dietaryTag!);
    });
  }
  return rows;
}

export async function getProductById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return result[0];
}

export async function upsertProduct(data: {
  id?: number;
  categoryId: number;
  name: string;
  description?: string;
  price: string;
  imageUrl?: string;
  badge?: string;
  available?: boolean;
  stockQty?: number;
  extras?: unknown;
  dietaryTags?: unknown;
  sortOrder?: number;
}) {
  const db = await getDb();
  if (!db) return;
  if (data.id) {
    const { id, ...rest } = data;
    await db.update(products).set(rest as never).where(eq(products.id, id));
  } else {
    await db.insert(products).values(data as never);
  }
}

export async function deleteProduct(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(products).set({ available: false }).where(eq(products.id, id));
}

// ─── Cart ─────────────────────────────────────────────────────────────────────
export async function getCartItems(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(cartItems).where(eq(cartItems.userId, userId));
}

export async function addCartItem(data: {
  userId: number;
  productId: number;
  quantity: number;
  extras?: unknown;
  observations?: string;
}) {
  const db = await getDb();
  if (!db) return;
  await db.insert(cartItems).values(data as never);
}

export async function updateCartItem(id: number, userId: number, data: { quantity?: number; extras?: unknown; observations?: string }) {
  const db = await getDb();
  if (!db) return;
  await db.update(cartItems).set(data as never).where(and(eq(cartItems.id, id), eq(cartItems.userId, userId)));
}

export async function removeCartItem(id: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(cartItems).where(and(eq(cartItems.id, id), eq(cartItems.userId, userId)));
}

export async function clearCart(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(cartItems).where(eq(cartItems.userId, userId));
}

// ─── Addresses ────────────────────────────────────────────────────────────────
export async function getUserAddresses(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(addresses).where(eq(addresses.userId, userId));
}

export async function upsertAddress(data: {
  id?: number;
  userId: number;
  label?: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city?: string;
  state?: string;
  zipCode?: string;
  isDefault?: boolean;
}) {
  const db = await getDb();
  if (!db) return;
  if (data.isDefault) {
    await db.update(addresses).set({ isDefault: false }).where(eq(addresses.userId, data.userId));
  }
  if (data.id) {
    const { id, ...rest } = data;
    await db.update(addresses).set(rest).where(and(eq(addresses.id, id), eq(addresses.userId, data.userId)));
  } else {
    await db.insert(addresses).values(data as never);
  }
}

export async function deleteAddress(id: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(addresses).where(and(eq(addresses.id, id), eq(addresses.userId, userId)));
}

// ─── Coupons ──────────────────────────────────────────────────────────────────
export async function getCouponByCode(code: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(coupons).where(eq(coupons.code, code.toUpperCase())).limit(1);
  return result[0];
}

export async function getAllCoupons() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(coupons).orderBy(desc(coupons.createdAt));
}

export async function upsertCoupon(data: {
  id?: number;
  code: string;
  description?: string;
  discountType: "percent" | "fixed";
  discountValue: string;
  minOrderValue?: string;
  maxUses?: number;
  active?: boolean;
  expiresAt?: Date;
}) {
  const db = await getDb();
  if (!db) return;
  if (data.id) {
    const { id, ...rest } = data;
    await db.update(coupons).set(rest as never).where(eq(coupons.id, id));
  } else {
    await db.insert(coupons).values({ ...data, code: data.code.toUpperCase() } as never);
  }
}

export async function incrementCouponUsage(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(coupons).set({ usedCount: sql`usedCount + 1` }).where(eq(coupons.id, id));
}

// ─── Orders ───────────────────────────────────────────────────────────────────
export async function createOrder(data: {
  userId: number;
  paymentMethod: "pix_whatsapp" | "cartao" | "dinheiro";
  subtotal: string;
  deliveryFee: string;
  discount: string;
  total: string;
  couponId?: number;
  couponCode?: string;
  addressId?: number;
  addressSnapshot?: unknown;
  notes?: string;
  loyaltyPointsEarned: number;
  loyaltyPointsUsed: number;
  items: Array<{
    productId: number;
    productName: string;
    productPrice: string;
    quantity: number;
    extras?: unknown;
    observations?: string;
    itemTotal: string;
  }>;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  const { items, ...orderData } = data;
  const [result] = await db.insert(orders).values(orderData as never);
  const orderId = (result as { insertId: number }).insertId;

  await db.insert(orderItems).values(items.map((item) => ({ ...item, orderId })) as never);

  return orderId;
}

export async function getUserOrders(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(orders).where(eq(orders.userId, userId)).orderBy(desc(orders.createdAt));
}

export async function getOrderById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  return result[0];
}

export async function getOrderItems(orderId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
}

export async function getAllOrders(filters?: { status?: string; limit?: number }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters?.status) conditions.push(eq(orders.status, filters.status as never));
  return db
    .select()
    .from(orders)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(orders.createdAt))
    .limit(filters?.limit ?? 100);
}

export async function updateOrderStatus(
  id: number,
  status: "recebido" | "em_preparo" | "saiu_para_entrega" | "entregue" | "cancelado"
) {
  const db = await getDb();
  if (!db) return;
  await db.update(orders).set({ status }).where(eq(orders.id, id));
}

// ─── Reviews ──────────────────────────────────────────────────────────────────
export async function getProductReviews(productId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(reviews).where(eq(reviews.productId, productId)).orderBy(desc(reviews.createdAt));
}

export async function createReview(data: {
  userId: number;
  productId: number;
  orderId?: number;
  rating: number;
  comment?: string;
}) {
  const db = await getDb();
  if (!db) return;
  await db.insert(reviews).values(data as never);
}

export async function getUserReviews(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(reviews).where(eq(reviews.userId, userId)).orderBy(desc(reviews.createdAt));
}

// ─── Loyalty ──────────────────────────────────────────────────────────────────
export async function addLoyaltyTransaction(data: {
  userId: number;
  orderId?: number;
  type: "earn" | "redeem";
  points: number;
  description?: string;
}) {
  const db = await getDb();
  if (!db) return;
  await db.insert(loyaltyTransactions).values(data as never);
  const delta = data.type === "earn" ? data.points : -data.points;
  await db.update(users).set({ loyaltyPoints: sql`loyaltyPoints + ${delta}` }).where(eq(users.id, data.userId));
}

export async function getLoyaltyTransactions(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(loyaltyTransactions).where(eq(loyaltyTransactions.userId, userId)).orderBy(desc(loyaltyTransactions.createdAt));
}

// ─── Admin Stats ──────────────────────────────────────────────────────────────
export async function getAdminStats() {
  const db = await getDb();
  if (!db) return { totalOrders: 0, totalRevenue: 0, pendingOrders: 0, totalProducts: 0 };

  const [ordersCount] = await db.select({ count: sql<number>`count(*)` }).from(orders);
  const [revenue] = await db.select({ sum: sql<string>`sum(total)` }).from(orders).where(eq(orders.status, "entregue"));
  const [pending] = await db
    .select({ count: sql<number>`count(*)` })
    .from(orders)
    .where(inArray(orders.status, ["recebido", "em_preparo", "saiu_para_entrega"]));
  const [productsCount] = await db.select({ count: sql<number>`count(*)` }).from(products).where(eq(products.available, true));

  return {
    totalOrders: ordersCount?.count ?? 0,
    totalRevenue: parseFloat(revenue?.sum ?? "0"),
    pendingOrders: pending?.count ?? 0,
    totalProducts: productsCount?.count ?? 0,
  };
}
