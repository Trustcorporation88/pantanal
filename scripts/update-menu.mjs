import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const db = await mysql.createConnection(process.env.DATABASE_URL);

console.log("🗑️  Removendo dados antigos...");
await db.execute("DELETE FROM cart_items");
await db.execute("DELETE FROM reviews");
await db.execute("DELETE FROM products");
await db.execute("DELETE FROM categories");
console.log("✅ Dados antigos removidos.");

// ── Categorias ────────────────────────────────────────────────
const cats = [
  { name: "Lanches no Pão de Hambúrguer", slug: "lanchesPaoHamburguer", emoji: "🍔", sortOrder: 1 },
  { name: "Lanches no Pão Francês",       slug: "lanchesPaoFrances",    emoji: "🥖", sortOrder: 2 },
  { name: "Beirutes no Pão Sírio",        slug: "beirutePaoSirio",      emoji: "🫓", sortOrder: 3 },
];

console.log("📂 Inserindo categorias...");
const catIds = {};
for (const c of cats) {
  await db.execute(
    "INSERT INTO categories (name, slug, emoji, sortOrder) VALUES (?, ?, ?, ?)",
    [c.name, c.slug, c.emoji, c.sortOrder]
  );
  const [rows] = await db.execute("SELECT id FROM categories WHERE slug = ?", [c.slug]);
  catIds[c.slug] = rows[0].id;
  console.log(`  ✅ ${c.name} (id=${catIds[c.slug]})`);
}

// ── Produtos ──────────────────────────────────────────────────
const products = [
  // ── Lanches no Pão de Hambúrguer ──────────────────────────
  { cat: "lanchesPaoHamburguer", name: "X Egg",                slug: "x-egg",                description: "Hambúrguer de 100g, ovo, queijo, tomate e alface",                                                              price: "23.90", badge: null,          sort: 1  },
  { cat: "lanchesPaoHamburguer", name: "X Egg Bacon",          slug: "x-egg-bacon",          description: "Hambúrguer de 100g, queijo, bacon, ovo, tomate e alface",                                                        price: "28.90", badge: null,          sort: 2  },
  { cat: "lanchesPaoHamburguer", name: "X Egg Bacon Cremoso",  slug: "x-egg-bacon-cremoso",  description: "Hambúrguer de 100g, bacon, ovo, queijo, requeijão, tomate e alface",                                             price: "31.90", badge: "destaque",    sort: 3  },
  { cat: "lanchesPaoHamburguer", name: "X Egg Calabresa",      slug: "x-egg-calabresa",      description: "Hambúrguer de 100g, calabresa, ovo, queijo, tomate e alface",                                                    price: "28.90", badge: null,          sort: 4  },
  { cat: "lanchesPaoHamburguer", name: "X Bacon",              slug: "x-bacon",              description: "Hambúrguer de 100g, bacon, queijo, tomate e alface",                                                              price: "27.90", badge: null,          sort: 5  },
  { cat: "lanchesPaoHamburguer", name: "X Bacon Cremoso",      slug: "x-bacon-cremoso",      description: "Hambúrguer de 100g, bacon, queijo, requeijão, tomate e alface",                                                  price: "30.90", badge: null,          sort: 6  },
  { cat: "lanchesPaoHamburguer", name: "X Calabresa",          slug: "x-calabresa",          description: "Hambúrguer de 100g, calabresa, queijo, tomate e alface",                                                          price: "27.90", badge: null,          sort: 7  },
  { cat: "lanchesPaoHamburguer", name: "X Calabresa Cremoso",  slug: "x-calabresa-cremoso",  description: "Hambúrguer de 100g, calabresa, queijo, requeijão, tomate e alface",                                              price: "30.90", badge: null,          sort: 8  },
  { cat: "lanchesPaoHamburguer", name: "X Tudo",               slug: "x-tudo",               description: "Hambúrguer de 100g, calabresa, bacon, ovo, presunto, queijo, tomate e alface",                                   price: "32.90", badge: "mais_pedido",  sort: 9  },
  { cat: "lanchesPaoHamburguer", name: "X Pantanal",           slug: "x-pantanal",           description: "2 hambúrgueres de 100g, 2 ovos, calabresa, bacon, presunto, requeijão, queijo, filé de frango, tomate e alface",  price: "44.90", badge: "premium",     sort: 10 },
  { cat: "lanchesPaoHamburguer", name: "Misto Quente",         slug: "misto-quente",         description: "Presunto e queijo",                                                                                                price: "18.90", badge: null,          sort: 11 },
  { cat: "lanchesPaoHamburguer", name: "X Frango",             slug: "x-frango",             description: "Filé de frango, requeijão, milho, queijo, tomate e alface",                                                       price: "26.90", badge: "destaque",    sort: 12 },

  // ── Lanches no Pão Francês ────────────────────────────────
  { cat: "lanchesPaoFrances", name: "Paulista",   slug: "paulista",   description: "Filé mignon, queijo, tomate",                              price: "39.90", badge: "destaque", sort: 1 },
  { cat: "lanchesPaoFrances", name: "Caipira",    slug: "caipira",    description: "Filé de frango, requeijão, queijo, tomate",                price: "28.90", badge: null,       sort: 2 },
  { cat: "lanchesPaoFrances", name: "Americano",  slug: "americano",  description: "Filé mignon, presunto, ovo, queijo, tomate",               price: "44.90", badge: "premium",  sort: 3 },

  // ── Beirutes no Pão Sírio ─────────────────────────────────
  { cat: "beirutePaoSirio", name: "Beirute de Filé Mignon",    slug: "beirute-file-mignon",  description: "400g de filé mignon, requeijão, queijo, tomate e alface",    price: "59.90", badge: "premium",  sort: 1 },
  { cat: "beirutePaoSirio", name: "Beirute de Filé de Frango", slug: "beirute-file-frango",  description: "350g de filé de frango, requeijão, queijo, tomate e alface",  price: "39.90", badge: "destaque", sort: 2 },
  { cat: "beirutePaoSirio", name: "Beirute Misto",             slug: "beirute-misto",        description: "Presunto, queijo, requeijão, tomate e alface",                price: "24.90", badge: null,       sort: 3 },
];

console.log("\n🍔 Inserindo produtos...");
for (const p of products) {
  const catId = catIds[p.cat];
  await db.execute(
    `INSERT INTO products (categoryId, name, description, price, badge, available, stockQty, sortOrder)
     VALUES (?, ?, ?, ?, ?, 1, 100, ?)`,
    [catId, p.name, p.description, p.price, p.badge ?? null, p.sort]
  );
  console.log(`  ✅ ${p.name} — R$ ${p.price}`);
}

await db.end();
console.log("\n🎉 Cardápio atualizado com sucesso! Total:", products.length, "produtos em", cats.length, "categorias.");
