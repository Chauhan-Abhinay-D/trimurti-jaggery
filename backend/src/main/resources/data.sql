-- Add default products if table is empty.
INSERT INTO products (name, description, price, weight, image_url, stock_quantity)
SELECT * FROM (SELECT 'Premium Jaggery Block', '100% Natural, chemical-free raw jaggery block retaining all essential minerals.', 250.00, '1 kg', '/assets/jaggery_block.png', 100) AS tmp
WHERE NOT EXISTS (SELECT name FROM products WHERE name = 'Premium Jaggery Block' AND weight = '1 kg') LIMIT 1;

INSERT INTO products (name, description, price, weight, image_url, stock_quantity)
SELECT * FROM (SELECT 'Pure Jaggery Powder', 'Finely crushed jaggery powder, perfect for quick dissolution in tea, coffee, and sweets.', 280.00, '1 kg', '/assets/jaggery_powder.png', 50) AS tmp
WHERE NOT EXISTS (SELECT name FROM products WHERE name = 'Pure Jaggery Powder' AND weight = '1 kg') LIMIT 1;

INSERT INTO products (name, description, price, weight, image_url, stock_quantity)
SELECT * FROM (SELECT 'Liquid Jaggery (Kakvi)', 'Rich, distinct flavor in liquid form. An excellent substitute for honey or maple syrup.', 220.00, '500 ml', '/assets/liquid_jaggery.png', 75) AS tmp
WHERE NOT EXISTS (SELECT name FROM products WHERE name = 'Liquid Jaggery (Kakvi)' AND weight = '500 ml') LIMIT 1;

-- NEW PRODUCTS
INSERT INTO products (name, description, price, weight, image_url, stock_quantity)
SELECT * FROM (SELECT 'Jaggery Cubes', 'Convenient 1 kg packaging of our premium natural jaggery cubes. Great for daily tea/coffee.', 300.00, '1 kg', '/assets/jaggery_cubes.png', 200) AS tmp
WHERE NOT EXISTS (SELECT name FROM products WHERE name = 'Jaggery Cubes' AND weight = '1 kg') LIMIT 1;

INSERT INTO products (name, description, price, weight, image_url, stock_quantity)
SELECT * FROM (SELECT 'Jaggery Cubes (Half KG)', 'Compact 500g pack of our premium natural jaggery cubes.', 160.00, '500 g', '/assets/jaggery_cubes.png', 150) AS tmp
WHERE NOT EXISTS (SELECT name FROM products WHERE name = 'Jaggery Cubes (Half KG)') LIMIT 1;

INSERT INTO products (name, description, price, weight, image_url, stock_quantity)
SELECT * FROM (SELECT 'Jaggery Cubes (Bulk 2KG)', 'Family-sized 2 kg pack of our premium natural jaggery cubes.', 580.00, '2 kg', '/assets/jaggery_cubes.png', 100) AS tmp
WHERE NOT EXISTS (SELECT name FROM products WHERE name = 'Jaggery Cubes (Bulk 2KG)') LIMIT 1;

INSERT INTO products (name, description, price, weight, image_url, stock_quantity)
SELECT * FROM (SELECT 'Premium Jaggery Block (Half)', '100% Natural, raw jaggery block in a smaller half-kilogram portion.', 130.00, '500 g', '/assets/jaggery_block.png', 100) AS tmp
WHERE NOT EXISTS (SELECT name FROM products WHERE name = 'Premium Jaggery Block (Half)') LIMIT 1;

INSERT INTO products (name, description, price, weight, image_url, stock_quantity)
SELECT * FROM (SELECT 'Pure Jaggery Powder', 'Finely crushed jaggery powder, perfect for quick dissolution.', 150.00, '500 g', '/assets/jaggery_powder.png', 100) AS tmp
WHERE NOT EXISTS (SELECT name FROM products WHERE name = 'Pure Jaggery Powder' AND weight = '500 g') LIMIT 1;

INSERT INTO products (name, description, price, weight, image_url, stock_quantity)
SELECT * FROM (SELECT 'Liquid Jaggery (Kakvi)', 'Large 1 Litre bottle of our distinct liquid jaggery formula.', 420.00, '1 Ltr', '/assets/liquid_jaggery.png', 50) AS tmp
WHERE NOT EXISTS (SELECT name FROM products WHERE name = 'Liquid Jaggery (Kakvi)' AND weight = '1 Ltr') LIMIT 1;

-- Force update existing products initialized from early schema to use new custom imagery
UPDATE products SET image_url = '/assets/jaggery_powder.png' WHERE name = 'Pure Jaggery Powder' AND image_url LIKE 'http%';
UPDATE products SET image_url = '/assets/liquid_jaggery.png' WHERE name = 'Liquid Jaggery (Kakvi)' AND image_url LIKE 'http%';
