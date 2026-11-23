import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { formatBRL, formatPhoneBR, phoneDigits } from "@shared/format";
import { DELIVERY_FEE, STORE_INFO, isStoreOpen } from "@shared/store";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  addCartItem,
  addLoyaltyTransaction,
  clearCart,
  createOrder,
  createReview,
  deleteAddress,
  deleteProduct,
  getAllCoupons,
  getAllOrders,
  getAdminStats,
  getCartItems,
  getCategories,
  getCouponByCode,
  getLoyaltyTransactions,
  getOrderById,
  getOrderItems,
  getProductById,
  getProductReviews,
  getProducts,
  getUserAddresses,
  getUserOrders,
  getUserReviews,
  incrementCouponUsage,
  removeCartItem,
  updateCartItem,
  updateOrderStatus,
  updateUserProfile,
  upsertAddress,
  upsertCategory,
  upsertCoupon,
  upsertProduct,
} from "./db";
import { notifyOwner } from "./_core/notification";

// Admin guard middleware
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito a administradores." });
  return next({ ctx });
});

// ─── Catalog Router ───────────────────────────────────────────────────────────
const catalogRouter = router({
  categories: publicProcedure.query(() => getCategories()),

  products: publicProcedure
    .input(
      z.object({
        categoryId: z.number().optional(),
        search: z.string().optional(),
        minPrice: z.number().optional(),
        maxPrice: z.number().optional(),
        dietaryTag: z.string().optional(),
      }).optional()
    )
    .query(({ input }) => getProducts({ ...input, available: true })),

  productById: publicProcedure.input(z.number()).query(({ input }) => getProductById(input)),

  reviews: publicProcedure.input(z.number()).query(({ input }) => getProductReviews(input)),
});

// ─── Cart Router ──────────────────────────────────────────────────────────────
const cartRouter = router({
  get: protectedProcedure.query(async ({ ctx }) => {
    const items = await getCartItems(ctx.user.id);
    const productIds = Array.from(new Set(items.map((i) => i.productId)));
    const productList = await Promise.all(productIds.map((id) => getProductById(id)));
    const productMap = Object.fromEntries(productList.filter(Boolean).map((p) => [p!.id, p!]));
    return items.map((item) => ({
      ...item,
      product: productMap[item.productId],
    }));
  }),

  add: protectedProcedure
    .input(
      z.object({
        productId: z.number(),
        quantity: z.number().min(1).default(1),
        extras: z.array(z.object({ name: z.string(), price: z.number() })).optional(),
        observations: z.string().optional(),
      })
    )
    .mutation(({ ctx, input }) =>
      addCartItem({ userId: ctx.user.id, ...input, extras: input.extras ?? null })
    ),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        quantity: z.number().min(1).optional(),
        extras: z.array(z.object({ name: z.string(), price: z.number() })).optional(),
        observations: z.string().optional(),
      })
    )
    .mutation(({ ctx, input }) => {
      const { id, ...data } = input;
      return updateCartItem(id, ctx.user.id, data);
    }),

  remove: protectedProcedure.input(z.number()).mutation(({ ctx, input }) => removeCartItem(input, ctx.user.id)),

  clear: protectedProcedure.mutation(({ ctx }) => clearCart(ctx.user.id)),

  // Limpa o carrinho ao iniciar uma nova sessão (chamado no carregamento inicial do app)
  clearOnLogin: protectedProcedure.mutation(({ ctx }) => clearCart(ctx.user.id)),
});

// ─── Address Router ───────────────────────────────────────────────────────────
const addressRouter = router({
  list: protectedProcedure.query(({ ctx }) => getUserAddresses(ctx.user.id)),

  upsert: protectedProcedure
    .input(
      z.object({
        id: z.number().optional(),
        label: z.string().optional(),
        street: z.string().min(3),
        number: z.string().min(1),
        complement: z.string().optional(),
        neighborhood: z.string().min(2),
        city: z.string().default("Bauru"),
        state: z.string().default("SP"),
        zipCode: z.string().optional(),
        isDefault: z.boolean().optional(),
      })
    )
    .mutation(({ ctx, input }) => upsertAddress({ userId: ctx.user.id, ...input })),

  delete: protectedProcedure.input(z.number()).mutation(({ ctx, input }) => deleteAddress(input, ctx.user.id)),
});

// ─── Coupon Router ────────────────────────────────────────────────────────────
const couponRouter = router({
  validate: protectedProcedure
    .input(z.object({ code: z.string(), orderValue: z.number() }))
    .mutation(async ({ input }) => {
      const coupon = await getCouponByCode(input.code);
      if (!coupon) throw new TRPCError({ code: "NOT_FOUND", message: "Cupom não encontrado." });
      if (!coupon.active) throw new TRPCError({ code: "BAD_REQUEST", message: "Cupom inativo." });
      if (coupon.expiresAt && coupon.expiresAt < new Date())
        throw new TRPCError({ code: "BAD_REQUEST", message: "Cupom expirado." });
      if (coupon.maxUses && coupon.usedCount >= coupon.maxUses)
        throw new TRPCError({ code: "BAD_REQUEST", message: "Cupom esgotado." });
      const minVal = parseFloat(coupon.minOrderValue ?? "0");
      if (input.orderValue < minVal)
        throw new TRPCError({ code: "BAD_REQUEST", message: `Pedido mínimo de ${formatBRL(minVal)} para este cupom.` });

      const discountVal = parseFloat(coupon.discountValue);
      const discount =
        coupon.discountType === "percent"
          ? (input.orderValue * discountVal) / 100
          : Math.min(discountVal, input.orderValue);

      return { coupon, discount: parseFloat(discount.toFixed(2)) };
    }),
});

// ─── Order Router ─────────────────────────────────────────────────────────────
const orderRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const userOrders = await getUserOrders(ctx.user.id);
    return userOrders;
  }),

  detail: protectedProcedure.input(z.number()).query(async ({ ctx, input }) => {
    const order = await getOrderById(input);
    if (!order || order.userId !== ctx.user.id)
      throw new TRPCError({ code: "NOT_FOUND", message: "Pedido não encontrado." });
    const items = await getOrderItems(input);
    return { ...order, items };
  }),

  create: protectedProcedure
    .input(
      z.object({
        paymentMethod: z.enum(["pix_whatsapp", "cartao", "dinheiro"]),
        fulfillment: z.enum(["entrega", "retirada"]).default("entrega"),
        addressId: z.number().optional(),
        couponCode: z.string().optional(),
        notes: z.string().optional(),
        usePoints: z.number().min(0).default(0),
        customerName: z.string().trim().min(2, "Informe seu nome."),
        customerPhone: z.string().trim().min(8, "Informe um telefone com DDD."),
        cashChange: z.number().positive().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!isStoreOpen()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `A loja está fechada no momento. Funcionamos de ${STORE_INFO.hoursLong}.`,
        });
      }

      const contactPhone = formatPhoneBR(input.customerPhone);
      if (phoneDigits(input.customerPhone).length < 10 || phoneDigits(input.customerPhone).length > 11) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Informe um telefone com DDD." });
      }

      const cartData = await getCartItems(ctx.user.id);
      if (cartData.length === 0) throw new TRPCError({ code: "BAD_REQUEST", message: "Carrinho vazio." });

      const productList = await Promise.all(cartData.map((i) => getProductById(i.productId)));
      const productMap = Object.fromEntries(productList.filter(Boolean).map((p) => [p!.id, p!]));

      const items = cartData.map((item) => {
        const product = productMap[item.productId];
        if (!product) throw new TRPCError({ code: "BAD_REQUEST", message: "Produto não encontrado." });
        const extras = (item.extras as Array<{ name: string; price: number }> | null) ?? [];
        const extrasTotal = extras.reduce((sum, e) => sum + e.price, 0);
        const unitPrice = parseFloat(product.price) + extrasTotal;
        return {
          productId: item.productId,
          productName: product.name,
          menuNumber: product.menuNumber ?? null,
          productPrice: unitPrice.toFixed(2),
          quantity: item.quantity,
          extras: item.extras,
          observations: item.observations ?? undefined,
          itemTotal: (unitPrice * item.quantity).toFixed(2),
        };
      });

      const subtotal = items.reduce((sum, i) => sum + parseFloat(i.itemTotal), 0);

      const deliveryFee = input.fulfillment === "retirada" ? 0 : DELIVERY_FEE;

      // Coupon discount
      let discount = 0;
      let couponId: number | undefined;
      if (input.couponCode) {
        const coupon = await getCouponByCode(input.couponCode);
        if (coupon && coupon.active) {
          const discountVal = parseFloat(coupon.discountValue);
          discount =
            coupon.discountType === "percent"
              ? (subtotal * discountVal) / 100
              : Math.min(discountVal, subtotal);
          couponId = coupon.id;
          await incrementCouponUsage(coupon.id);
        }
      }

      // Loyalty points redemption (100 pts = R$5)
      const pointsDiscount = Math.min(input.usePoints, ctx.user.loyaltyPoints ?? 0) / 100 * 5;
      discount += pointsDiscount;

      const total = Math.max(0, subtotal + deliveryFee - discount);
      const pointsEarned = Math.floor(total); // 1 point per R$1

      if (input.paymentMethod === "dinheiro" && input.cashChange != null && input.cashChange + 0.001 < total) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `O valor para troco precisa ser maior ou igual ao total de ${formatBRL(total)}.`,
        });
      }

      let addressSnapshot = null;
      let addressId: number | undefined;
      if (input.fulfillment === "entrega") {
        if (!input.addressId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Selecione um endereço de entrega." });
        }
        const addrs = await getUserAddresses(ctx.user.id);
        const addr = addrs.find((a) => a.id === input.addressId);
        if (!addr) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Endereço de entrega não encontrado." });
        }
        addressSnapshot = addr;
        addressId = addr.id;
      }

      const noteLines = [
        input.fulfillment === "retirada" ? "Retirada na loja" : "Entrega",
        `Cliente: ${input.customerName.trim()}`,
        `Telefone: ${contactPhone}`,
      ];
      if (input.paymentMethod === "dinheiro") {
        noteLines.push(
          input.cashChange
            ? `Troco para ${formatBRL(input.cashChange)} (devolver ${formatBRL(input.cashChange - total)})`
            : "Troco: valor exato"
        );
      }
      const customerNotes = input.notes?.trim();
      const notes = customerNotes ? `${noteLines.join("\n")}\n\nObservações: ${customerNotes}` : noteLines.join("\n");

      await updateUserProfile(ctx.user.id, {
        name: input.customerName.trim(),
        phone: contactPhone,
      });

      const orderId = await createOrder({
        userId: ctx.user.id,
        paymentMethod: input.paymentMethod,
        subtotal: subtotal.toFixed(2),
        deliveryFee: deliveryFee.toFixed(2),
        discount: discount.toFixed(2),
        total: total.toFixed(2),
        couponId,
        couponCode: input.couponCode,
        addressId,
        addressSnapshot,
        notes,
        loyaltyPointsEarned: pointsEarned,
        loyaltyPointsUsed: input.usePoints,
        items: items.map(({ menuNumber: _menuNumber, ...item }) => item),
      });

      // Loyalty transactions
      if (pointsEarned > 0) {
        await addLoyaltyTransaction({
          userId: ctx.user.id,
          orderId,
          type: "earn",
          points: pointsEarned,
          description: `Pedido #${orderId}`,
        });
      }
      if (input.usePoints > 0) {
        await addLoyaltyTransaction({
          userId: ctx.user.id,
          orderId,
          type: "redeem",
          points: input.usePoints,
          description: `Resgate no pedido #${orderId}`,
        });
      }

      await clearCart(ctx.user.id);

      // Notify owner
      await notifyOwner({
        title: `🛒 Novo pedido #${orderId}`,
        content: `Pedido de ${input.customerName.trim()} (${contactPhone}) — ${input.fulfillment === "retirada" ? "retirada" : "entrega"} — ${formatBRL(total)} — ${input.paymentMethod}`,
      });

      return {
        orderId,
        total: total.toFixed(2),
        subtotal: subtotal.toFixed(2),
        deliveryFee: deliveryFee.toFixed(2),
        discount: discount.toFixed(2),
        paymentMethod: input.paymentMethod,
        fulfillment: input.fulfillment,
        customerName: input.customerName.trim(),
        customerPhone: contactPhone,
        cashChange: input.paymentMethod === "dinheiro" ? input.cashChange ?? null : null,
        notes: customerNotes ?? null,
        addressSnapshot,
        items: items.map((i) => ({
          productName: i.productName,
          menuNumber: i.menuNumber,
          quantity: i.quantity,
          itemTotal: i.itemTotal,
          observations: i.observations,
        })),
      };
    }),
});

// ─── Review Router ────────────────────────────────────────────────────────────
const reviewRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        productId: z.number(),
        orderId: z.number().optional(),
        rating: z.number().min(1).max(5),
        comment: z.string().optional(),
      })
    )
    .mutation(({ ctx, input }) => createReview({ userId: ctx.user.id, ...input })),

  myReviews: protectedProcedure.query(({ ctx }) => getUserReviews(ctx.user.id)),
});

// ─── Loyalty Router ───────────────────────────────────────────────────────────
const loyaltyRouter = router({
  transactions: protectedProcedure.query(({ ctx }) => getLoyaltyTransactions(ctx.user.id)),
});

// ─── User Router ──────────────────────────────────────────────────────────────
const userRouter = router({
  updateProfile: protectedProcedure
    .input(z.object({ name: z.string().optional(), phone: z.string().optional(), email: z.string().email().optional() }))
    .mutation(({ ctx, input }) => updateUserProfile(ctx.user.id, input)),
});

// ─── Admin Router ─────────────────────────────────────────────────────────────
const adminRouter = router({
  stats: adminProcedure.query(() => getAdminStats()),

  orders: adminProcedure
    .input(z.object({ status: z.string().optional(), limit: z.number().optional() }).optional())
    .query(({ input }) => getAllOrders(input ?? {})),

  orderDetail: adminProcedure.input(z.number()).query(async ({ input }) => {
    const order = await getOrderById(input);
    if (!order) throw new TRPCError({ code: "NOT_FOUND" });
    const items = await getOrderItems(input);
    return { ...order, items };
  }),

  updateOrderStatus: adminProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["recebido", "em_preparo", "saiu_para_entrega", "entregue", "cancelado"]),
      })
    )
    .mutation(({ input }) => updateOrderStatus(input.id, input.status)),

  products: adminProcedure.query(() => getProducts()),

  upsertProduct: adminProcedure
    .input(
      z.object({
        id: z.number().optional(),
        categoryId: z.number(),
        name: z.string().min(1),
        description: z.string().optional(),
        price: z.string(),
        imageUrl: z.string().optional(),
        badge: z.enum(["favorito", "destaque", "promocao", "premium", "especialidade", "mais_pedido"]).optional(),
        available: z.boolean().optional(),
        stockQty: z.number().optional(),
        extras: z.array(z.object({ name: z.string(), price: z.number() })).optional(),
        dietaryTags: z.array(z.string()).optional(),
        sortOrder: z.number().optional(),
      })
    )
    .mutation(({ input }) => upsertProduct(input as never)),

  deleteProduct: adminProcedure.input(z.number()).mutation(({ input }) => deleteProduct(input)),

  coupons: adminProcedure.query(() => getAllCoupons()),

  upsertCoupon: adminProcedure
    .input(
      z.object({
        id: z.number().optional(),
        code: z.string().min(3).max(30),
        description: z.string().optional(),
        discountType: z.enum(["percent", "fixed"]),
        discountValue: z.string(),
        minOrderValue: z.string().optional(),
        maxUses: z.number().optional(),
        active: z.boolean().optional(),
        expiresAt: z.date().optional(),
      })
    )
    .mutation(({ input }) => upsertCoupon(input as never)),

  categories: adminProcedure.query(() => getCategories()),

  upsertCategory: adminProcedure
    .input(
      z.object({
        id: z.number().optional(),
        name: z.string().min(1),
        slug: z.string().min(1),
        emoji: z.string().optional(),
        sortOrder: z.number().optional(),
      })
    )
    .mutation(({ input }) => upsertCategory(input)),

  // PIN de confirmação do painel admin
  verifyPin: protectedProcedure
    .input(z.object({ pin: z.string().min(4).max(6) }))
    .mutation(({ ctx, input }) => {
      if (ctx.user.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso restrito.' });
      const correctPin = process.env.ADMIN_PIN ?? '2446';
      return { valid: input.pin === correctPin };
    }),

  // Login admin independente com usuário e senha próprios (sem Manus Auth)
  loginAdmin: publicProcedure
    .input(z.object({ username: z.string(), password: z.string() }))
    .mutation(({ input }) => {
      const correctUser = process.env.ADMIN_USERNAME ?? 'pantanal';
      const correctPass = process.env.ADMIN_PASSWORD ?? '@2026$';
      if (input.username === correctUser && input.password === correctPass) {
        return { success: true, token: Buffer.from(`${correctUser}:${Date.now()}`).toString('base64') };
      }
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Usuário ou senha incorretos.' });
    }),
});

// ─── App Router ───────────────────────────────────────────────────────────────
export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  user: userRouter,
  catalog: catalogRouter,
  cart: cartRouter,
  address: addressRouter,
  coupon: couponRouter,
  order: orderRouter,
  review: reviewRouter,
  loyalty: loyaltyRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
