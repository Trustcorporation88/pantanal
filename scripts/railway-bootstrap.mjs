/**
 * Bootstrap Railway MySQL: apply schema + seed menu with local image paths.
 * Run inside the web container:
 *   node scripts/railway-bootstrap.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mysql from "mysql2/promise";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL missing");
  process.exit(1);
}

const IMG = (file) => `/images/${file}`;

const categories = [
  { name: "Porções", slug: "porcoes", emoji: "🍔", sortOrder: 1 },
  { name: "Lanches no Pão de Hambúrguer", slug: "lanchesPaoHamburguer", emoji: "🍔", sortOrder: 2 },
  { name: "Lanches no Pão Francês", slug: "lanchesPaoFrances", emoji: "🥖", sortOrder: 3 },
  { name: "Beirutes no Pão Sírio", slug: "beirutePaoSirio", emoji: "🫓", sortOrder: 4 },
];

const products = [
  { cat: "porcoes", name: "Porção Mista", menuNumber: 26, description: "1/2 de calabresa acebolada + 1/2 de batata com cheddar e bacon. Acompanha pão francês", price: "39.99", badge: "especialidade", sort: 1, image: "porcao-mista-clean_4fe44faa.jpg" },
  { cat: "lanchesPaoHamburguer", name: "X Egg", menuNumber: 1, description: "Ovo, hambúrguer 100g, queijo, tomate e alface", price: "23.99", badge: null, sort: 1, image: "x-egg_30999834.jpg" },
  { cat: "lanchesPaoHamburguer", name: "X Egg Bacon", menuNumber: 2, description: "Ovo, hambúrguer 100g, bacon, queijo, tomate e alface", price: "28.99", badge: null, sort: 2, image: "x-bacon_3ac40523.jpg" },
  { cat: "lanchesPaoHamburguer", name: "X Egg Bacon Cremoso", menuNumber: 3, description: "Ovo, hambúrguer 100g, bacon, queijo, requeijão, tomate e alface", price: "34.99", badge: "destaque", sort: 3, image: "x-egg-bacon-cremoso_7516d71b.jpg" },
  { cat: "lanchesPaoHamburguer", name: "X Egg Calabresa", menuNumber: 4, description: "Ovo, hambúrguer 100g, calabresa, queijo, tomate e alface", price: "28.99", badge: null, sort: 4, image: "x-egg-calabresa_f76d5a35.jpg" },
  { cat: "lanchesPaoHamburguer", name: "X Bacon", menuNumber: 5, description: "Hambúrguer 100g, bacon, queijo, tomate e alface", price: "27.99", badge: null, sort: 5, image: "x-bacon_3ac40523.jpg" },
  { cat: "lanchesPaoHamburguer", name: "X Bacon Cremoso", menuNumber: 6, description: "Hambúrguer 100g, bacon, queijo, requeijão, tomate e alface", price: "30.99", badge: null, sort: 6, image: "x-bacon-cremoso_e3370fd9.jpg" },
  { cat: "lanchesPaoHamburguer", name: "X Calabresa", menuNumber: 7, description: "Hambúrguer 100g, calabresa, queijo, tomate e alface", price: "27.99", badge: null, sort: 7, image: "x-calabresa_38023922.jpg" },
  { cat: "lanchesPaoHamburguer", name: "X Calabresa Cremoso", menuNumber: 8, description: "Hambúrguer 100g, calabresa, queijo, requeijão, tomate e alface", price: "30.99", badge: null, sort: 8, image: "x-calabresa-cremoso_9b743a04.jpg" },
  { cat: "lanchesPaoHamburguer", name: "X Tudo", menuNumber: 9, description: "Ovo, hambúrguer 100g, bacon, calabresa, presunto, queijo, tomate e alface", price: "36.99", badge: "mais_pedido", sort: 9, image: "x-tudo_80ff91f6.jpg" },
  { cat: "lanchesPaoHamburguer", name: "X Pantanal", menuNumber: 10, description: "2 hambúrgueres 100g, 2 ovos, calabresa, bacon, presunto, requeijão, queijo, filé de frango, tomate e alface", price: "44.99", badge: "premium", sort: 10, image: "x-pantanal_4eff8b91.jpg" },
  { cat: "lanchesPaoHamburguer", name: "X Frango", menuNumber: 12, description: "Filé de frango, milho, queijo, requeijão, tomate e alface", price: "29.99", badge: "destaque", sort: 12, image: "x-frango_44856e28.jpg" },
  { cat: "lanchesPaoHamburguer", name: "X Burguer", menuNumber: 19, description: "Hambúrguer 100g, queijo, tomate e alface", price: "21.99", badge: null, sort: 19, image: "x-burguer_464f26b8.jpg" },
  { cat: "lanchesPaoHamburguer", name: "X Burguer Cremoso", menuNumber: 20, description: "Hambúrguer 100g, queijo, requeijão, tomate e alface", price: "24.99", badge: null, sort: 20, image: "x-burguer-cremoso_52037d3a.jpg" },
  { cat: "lanchesPaoHamburguer", name: "X Salada", menuNumber: 21, description: "Hambúrguer 100g, alface, tomate e queijo", price: "22.99", badge: null, sort: 21, image: "x-salada_c760b454.jpg" },
  { cat: "lanchesPaoHamburguer", name: "Cachorro Quente Simples", menuNumber: 22, description: "Salsicha, molho, mostarda e ketchup", price: "12.99", badge: null, sort: 22, image: "cachorro-quente-simples_9c5fca7c.jpg" },
  { cat: "lanchesPaoHamburguer", name: "Cachorro Quente Especial", menuNumber: 23, description: "Salsicha, bacon, queijo, milho, ervilha e batata palha", price: "18.99", badge: null, sort: 23, image: "cachorro-quente-especial_a17c8357.jpg" },
  { cat: "lanchesPaoHamburguer", name: "Fast Pig", menuNumber: 25, description: "Pernil defumado, queijo, tomate e alface", price: "32.99", badge: null, sort: 25, image: "x-pernil-defumado_dd067e4c.jpg" },
  { cat: "lanchesPaoFrances", name: "Paulista", menuNumber: 13, description: "Filé mignon, queijo e tomate (pão francês)", price: "41.99", badge: "destaque", sort: 1, image: "paulista_f62a0ec3.jpg" },
  { cat: "lanchesPaoFrances", name: "Caipira", menuNumber: 14, description: "Filé de frango, requeijão, queijo e tomate (pão francês)", price: "28.99", badge: null, sort: 2, image: "caipira_d1bd0890.jpg" },
  { cat: "beirutePaoSirio", name: "Beirute de Filé Mignon", menuNumber: 15, description: "Filé mignon, requeijão, queijo, tomate e alface (pão sírio)", price: "59.99", badge: "premium", sort: 1, image: "beirute-file-mignon_a493d6c1.jpg" },
  { cat: "beirutePaoSirio", name: "Beirute de Filé de Frango", menuNumber: 17, description: "Filé de frango, requeijão, queijo, tomate e alface (pão sírio)", price: "39.99", badge: "destaque", sort: 2, image: "beirute-file-frango_4a8b5c00.jpg" },
  { cat: "beirutePaoSirio", name: "Beirute Misto", menuNumber: 18, description: "Presunto, queijo, requeijão, tomate e alface (pão sírio)", price: "24.99", badge: null, sort: 3, image: "beirute-misto_805dd39a.jpg" },
];

async function applySqlFile(conn, filePath) {
  if (!fs.existsSync(filePath)) {
    console.warn("skip missing", filePath);
    return;
  }
  const raw = fs.readFileSync(filePath, "utf8");
  const statements = raw
    .split(/-->\s*statement-breakpoint/)
    .map((s) => s.trim())
    .filter(Boolean);
  for (const stmt of statements) {
    try {
      await conn.query(stmt);
    } catch (err) {
      // ignore already-exists errors so bootstrap is idempotent
      if (err.code === "ER_TABLE_EXISTS_ERROR" || err.errno === 1050) {
        console.log("  (exists)", stmt.slice(0, 40).replace(/\s+/g, " "), "...");
        continue;
      }
      if (err.code === "ER_DUP_FIELDNAME" || err.errno === 1060) {
        console.log("  (dup column)", err.message);
        continue;
      }
      throw err;
    }
  }
}

async function main() {
  console.log("Connecting...");
  const conn = await mysql.createConnection(DATABASE_URL);

  console.log("Applying schema...");
  await applySqlFile(conn, path.join(root, "drizzle", "0000_handy_hairball.sql"));
  await applySqlFile(conn, path.join(root, "drizzle", "0001_jittery_sharon_ventura.sql"));

  // Ensure columns from current schema exist
  const alters = [
    "ALTER TABLE users ADD COLUMN phone varchar(20)",
    "ALTER TABLE users ADD COLUMN loyaltyPoints int NOT NULL DEFAULT 0",
    "ALTER TABLE products ADD COLUMN menuNumber int",
  ];
  for (const a of alters) {
    try {
      await conn.query(a);
    } catch (err) {
      if (err.errno !== 1060) throw err;
    }
  }

  console.log("Seeding categories...");
  await conn.query("SET FOREIGN_KEY_CHECKS=0");
  await conn.query("DELETE FROM cart_items");
  await conn.query("DELETE FROM order_items");
  await conn.query("DELETE FROM reviews");
  await conn.query("DELETE FROM products");
  await conn.query("DELETE FROM categories");
  await conn.query("SET FOREIGN_KEY_CHECKS=1");

  const catIds = {};
  for (const c of categories) {
    const [res] = await conn.query(
      "INSERT INTO categories (name, slug, emoji, sortOrder, active) VALUES (?, ?, ?, ?, 1)",
      [c.name, c.slug, c.emoji, c.sortOrder]
    );
    catIds[c.slug] = res.insertId;
    console.log("  cat", c.name, catIds[c.slug]);
  }

  console.log("Seeding products...");
  for (const p of products) {
    await conn.query(
      `INSERT INTO products
        (categoryId, name, description, price, imageUrl, badge, available, stockQty, extras, dietaryTags, menuNumber, sortOrder)
       VALUES (?, ?, ?, ?, ?, ?, 1, 999, ?, ?, ?, ?)`,
      [
        catIds[p.cat],
        p.name,
        p.description,
        p.price,
        IMG(p.image),
        p.badge,
        JSON.stringify([]),
        JSON.stringify([]),
        p.menuNumber,
        p.sort,
      ]
    );
    console.log("  product", p.menuNumber, p.name);
  }

  await conn.end();
  console.log("Bootstrap done:", products.length, "products");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
