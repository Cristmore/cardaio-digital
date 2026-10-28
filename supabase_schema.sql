-- ========================================================
-- SCHEMA SQL PARA SUPABASE - CARDÁPIO DIGITAL & DELIVERY
-- ========================================================

-- 1. Tabela de Configurações do Restaurante
CREATE TABLE IF NOT EXISTS restaurant_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'Restaurante Teste',
  business_type TEXT NOT NULL DEFAULT 'Restaurante',
  whatsapp TEXT NOT NULL DEFAULT '11999999999',
  pix_key TEXT NOT NULL DEFAULT '11999999999',
  delivery_fee NUMERIC(10, 2) NOT NULL DEFAULT 5.00,
  delivery_time TEXT NOT NULL DEFAULT '35 - 50 min',
  primary_color TEXT NOT NULL DEFAULT '#FF5E00',
  secondary_color TEXT NOT NULL DEFAULT '#FFAA00',
  is_open BOOLEAN NOT NULL DEFAULT true,
  address TEXT DEFAULT 'Rua Principal, 500 - Centro',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Inserir configuração inicial se não existir
INSERT INTO restaurant_settings (id, name, business_type, whatsapp, pix_key, delivery_fee, delivery_time)
VALUES ('00000000-0000-0000-0000-000000000001', 'Restaurante Teste', 'Restaurante', '11999999999', '11999999999', 5.00, '35 - 50 min')
ON CONFLICT (id) DO NOTHING;

-- 2. Tabela de Categorias
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  icon TEXT DEFAULT 'Utensils',
  sort_order INT DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Inserir categorias padrão
INSERT INTO categories (name, icon, sort_order) VALUES
('Prato principal', 'Utensils', 1),
('Bebidas', 'Coffee', 2),
('Sobremesas', 'IceCream', 3)
ON CONFLICT (name) DO NOTHING;

-- 3. Tabela de Produtos
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL,
  image TEXT,
  badge TEXT DEFAULT 'NENHUM', -- 'MAIS PEDIDO', 'NOVO', 'PROMOÇÃO', 'NENHUM'
  active BOOLEAN DEFAULT true,
  carnes_limit INT DEFAULT 2,
  gerais_limit INT DEFAULT 4,
  carnes_options TEXT[] DEFAULT ARRAY['Carne cozida', 'Frango ao molho', 'Frango assado', 'Peixe frito', 'Churrasco', 'Ovo frito'],
  gerais_options TEXT[] DEFAULT ARRAY['Arroz', 'Feijão', 'Salada', 'Farofa', 'Verdura'],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Inserir produtos solicitados
INSERT INTO products (name, category, description, price, image, badge, carnes_limit, gerais_limit, carnes_options, gerais_options)
VALUES 
(
  'Marmita grande', 
  'Prato principal', 
  'Escolha 2 tipos de carne e mais 4 opções gerais', 
  20.00, 
  '/images/marmita.jpg', 
  'MAIS PEDIDO', 
  2, 
  4, 
  ARRAY['Carne cozida', 'Frango ao molho', 'Frango assado', 'Peixe frito', 'Churrasco', 'Ovo frito'], 
  ARRAY['Arroz', 'Feijão', 'Salada', 'Farofa', 'Verdura']
),
(
  'Marmita média', 
  'Prato principal', 
  'Escolha 2 tipos de carne e mais 4 opções gerais', 
  17.00, 
  '/images/marmita.jpg', 
  'NOVO', 
  2, 
  4, 
  ARRAY['Carne cozida', 'Frango ao molho', 'Frango assado', 'Peixe frito', 'Churrasco', 'Ovo frito'], 
  ARRAY['Arroz', 'Feijão', 'Salada', 'Farofa', 'Verdura']
),
(
  'Coca-Cola Lata 350ml', 
  'Bebidas', 
  'Lata de 350ml trincando de gelada com gotas de condensação.', 
  6.00, 
  '/images/coca_cola.jpg', 
  'NOVO', 
  0, 
  0, 
  ARRAY[]::TEXT[], 
  ARRAY[]::TEXT[]
)
ON CONFLICT DO NOTHING;


-- 4. Tabela de Clientes
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  street TEXT NOT NULL,
  number TEXT NOT NULL,
  neighborhood TEXT NOT NULL,
  city TEXT DEFAULT '',
  complement TEXT,
  reference TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 5. Tabela de Pedidos (Orders)
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number SERIAL,
  customer_phone TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  delivery_type TEXT NOT NULL, -- 'ENTREGA' ou 'RETIRADA'
  delivery_address TEXT,
  payment_method TEXT NOT NULL, -- 'PIX', 'CARTAO', 'DINHEIRO'
  change_for NUMERIC(10, 2),
  subtotal NUMERIC(10, 2) NOT NULL,
  delivery_fee NUMERIC(10, 2) NOT NULL,
  total NUMERIC(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'Recebido', -- 'Recebido', 'Preparando', 'Saiu para entrega', 'Entregue', 'Cancelado'
  items JSONB NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Habilitar RLS (Row Level Security) com políticas públicas para a demonstração
ALTER TABLE restaurant_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on settings" ON restaurant_settings FOR SELECT USING (true);
CREATE POLICY "Allow public update on settings" ON restaurant_settings FOR UPDATE USING (true);
CREATE POLICY "Allow public all on categories" ON categories FOR ALL USING (true);
CREATE POLICY "Allow public all on products" ON products FOR ALL USING (true);
CREATE POLICY "Allow public all on customers" ON customers FOR ALL USING (true);
CREATE POLICY "Allow public all on orders" ON orders FOR ALL USING (true);
