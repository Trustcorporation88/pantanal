import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as dotenv from "dotenv";
dotenv.config();

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

// Import tables dynamically
const { categories, products } = await import("../drizzle/schema.js").catch(async () => {
  // fallback: use raw SQL
  return {};
});

// Use raw SQL for seeding
async function seed() {
  console.log("🌱 Seeding database...");

  // Categories
  await connection.execute(`
    INSERT IGNORE INTO categories (name, slug, emoji, sortOrder) VALUES
    ('Lanches', 'lanches', '🍔', 1),
    ('Beirutes', 'beirutes', '🥪', 2),
    ('Pão Francês', 'pao-frances', '🥖', 3),
    ('Bebidas', 'bebidas', '🥤', 4)
  `);
  console.log("✅ Categories seeded");

  // Get category IDs
  const [cats] = await connection.execute("SELECT id, slug FROM categories");
  const catMap = {};
  for (const cat of cats) catMap[cat.slug] = cat.id;

  // Products - Lanches
  const lanchesId = catMap["lanches"];
  await connection.execute(`
    INSERT IGNORE INTO products (categoryId, name, description, price, badge, available, stockQty, sortOrder, extras, dietaryTags) VALUES
    (${lanchesId}, 'X-Burguer', 'Hambúrguer artesanal, queijo, alface, tomate e molho especial', 18.00, 'mais_pedido', true, 999, 1, '[{"name":"Bacon extra","price":3.00},{"name":"Ovo","price":2.00},{"name":"Queijo duplo","price":2.50}]', '[]'),
    (${lanchesId}, 'X-Bacon', 'Hambúrguer artesanal, bacon crocante, queijo, alface e tomate', 22.00, 'favorito', true, 999, 2, '[{"name":"Bacon extra","price":3.00},{"name":"Ovo","price":2.00},{"name":"Queijo duplo","price":2.50}]', '[]'),
    (${lanchesId}, 'X-Tudo', 'Hambúrguer duplo, bacon, ovo, queijo, presunto, alface e tomate', 28.00, 'destaque', true, 999, 3, '[{"name":"Bacon extra","price":3.00},{"name":"Queijo duplo","price":2.50}]', '[]'),
    (${lanchesId}, 'X-Frango', 'Frango grelhado, queijo, alface, tomate e maionese', 20.00, 'especialidade', true, 999, 4, '[{"name":"Bacon extra","price":3.00},{"name":"Ovo","price":2.00}]', '[]'),
    (${lanchesId}, 'X-Salada', 'Hambúrguer, alface, tomate, pepino e molho de iogurte', 16.00, NULL, true, 999, 5, '[{"name":"Queijo","price":2.00},{"name":"Ovo","price":2.00}]', '["vegetariano"]'),
    (${lanchesId}, 'X-Especial Tucano', 'Hambúrguer duplo artesanal, bacon, ovo, queijo brie, rúcula e geleia de pimenta', 35.00, 'premium', true, 999, 6, '[{"name":"Bacon extra","price":3.00}]', '[]'),
    (${lanchesId}, 'Cachorro Quente Simples', 'Salsicha, molho de tomate, mostarda e ketchup', 10.00, NULL, true, 999, 7, '[{"name":"Bacon","price":2.50},{"name":"Queijo","price":1.50}]', '[]'),
    (${lanchesId}, 'Cachorro Quente Especial', 'Salsicha dupla, bacon, queijo, milho, ervilha e batata palha', 16.00, 'mais_pedido', true, 999, 8, '[{"name":"Bacon extra","price":2.50}]', '[]')
  `);

  // Products - Beirutes
  const beirutesId = catMap["beirutes"];
  await connection.execute(`
    INSERT IGNORE INTO products (categoryId, name, description, price, badge, available, stockQty, sortOrder, extras, dietaryTags) VALUES
    (${beirutesId}, 'Beirute de Frango', 'Pão sírio, frango desfiado temperado, queijo, alface e tomate', 22.00, 'favorito', true, 999, 1, '[{"name":"Bacon","price":3.00},{"name":"Ovo","price":2.00}]', '[]'),
    (${beirutesId}, 'Beirute Misto', 'Pão sírio, presunto, queijo, alface e tomate', 18.00, NULL, true, 999, 2, '[{"name":"Bacon","price":3.00},{"name":"Ovo","price":2.00}]', '[]'),
    (${beirutesId}, 'Beirute de Carne', 'Pão sírio, carne moída temperada, queijo, alface e tomate', 24.00, 'destaque', true, 999, 3, '[{"name":"Bacon","price":3.00},{"name":"Queijo duplo","price":2.50}]', '[]'),
    (${beirutesId}, 'Beirute Vegetariano', 'Pão sírio, grão-de-bico, legumes grelhados, queijo e molho tahine', 20.00, 'especialidade', true, 999, 4, '[{"name":"Queijo duplo","price":2.50}]', '["vegetariano"]')
  `);

  // Products - Pão Francês
  const paoId = catMap["pao-frances"];
  await connection.execute(`
    INSERT IGNORE INTO products (categoryId, name, description, price, badge, available, stockQty, sortOrder, extras, dietaryTags) VALUES
    (${paoId}, 'Pão com Ovo', 'Pão francês com ovo mexido', 8.00, NULL, true, 999, 1, '[{"name":"Queijo","price":1.50},{"name":"Presunto","price":2.00}]', '[]'),
    (${paoId}, 'Pão com Manteiga', 'Pão francês com manteiga', 6.00, NULL, true, 999, 2, '[{"name":"Queijo","price":1.50}]', '["vegetariano"]'),
    (${paoId}, 'Misto Quente', 'Pão francês com presunto e queijo grelhado', 10.00, 'mais_pedido', true, 999, 3, '[{"name":"Ovo","price":2.00},{"name":"Bacon","price":2.50}]', '[]'),
    (${paoId}, 'Pão com Carne', 'Pão francês com carne moída temperada', 14.00, 'favorito', true, 999, 4, '[{"name":"Queijo","price":1.50},{"name":"Ovo","price":2.00}]', '[]')
  `);

  // Products - Bebidas
  const bebidasId = catMap["bebidas"];
  await connection.execute(`
    INSERT IGNORE INTO products (categoryId, name, description, price, badge, available, stockQty, sortOrder, extras, dietaryTags) VALUES
    (${bebidasId}, 'Refrigerante Lata', 'Coca-Cola, Guaraná ou Sprite (350ml)', 6.00, NULL, true, 999, 1, '[]', '[]'),
    (${bebidasId}, 'Suco Natural', 'Laranja, limão ou maracujá (300ml)', 8.00, 'favorito', true, 999, 2, '[]', '["vegetariano"]'),
    (${bebidasId}, 'Água Mineral', 'Garrafa 500ml com ou sem gás', 4.00, NULL, true, 999, 3, '[]', '["vegetariano"]'),
    (${bebidasId}, 'Milkshake', 'Chocolate, morango ou baunilha (400ml)', 14.00, 'destaque', true, 999, 4, '[]', '[]'),
    (${bebidasId}, 'Cerveja', 'Long neck 355ml (Heineken, Brahma ou Skol)', 10.00, NULL, true, 999, 5, '[]', '[]')
  `);

  console.log("✅ Products seeded");

  // Sample coupon
  await connection.execute(`
    INSERT IGNORE INTO coupons (code, description, discountType, discountValue, minOrderValue, maxUses, active) VALUES
    ('BEMVINDO10', '10% de desconto para novos clientes', 'percent', 10.00, 20.00, 100, true),
    ('FRETE5', 'R$5 de desconto no frete', 'fixed', 5.00, 30.00, NULL, true)
  `);
  console.log("✅ Coupons seeded");

  await connection.end();
  console.log("🎉 Seed complete!");
}

seed().catch((e) => { console.error(e); process.exit(1); });
