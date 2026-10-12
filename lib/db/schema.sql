-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Restaurants table
CREATE TABLE restaurants (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  address TEXT,
  upi_id TEXT,
  phone TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Menu categories
CREATE TABLE menu_categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 3. Menu items
CREATE TABLE menu_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  category_id UUID REFERENCES menu_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  description TEXT,
  image_url TEXT,
  is_available BOOLEAN DEFAULT TRUE,
  preparation_time INTEGER DEFAULT 5,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 4. Customers
CREATE TABLE customers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  phone TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 5. Orders
CREATE TABLE orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  serial_number INTEGER UNIQUE NOT NULL,
  restaurant_id UUID REFERENCES restaurants(id),
  customer_id UUID REFERENCES customers(id),
  customer_name TEXT,
  customer_phone TEXT,
  order_type TEXT CHECK (order_type IN ('dine_in', 'home')),
  status TEXT CHECK (status IN ('pending', 'paid', 'ready', 'completed')) DEFAULT 'pending',
  payment_method TEXT CHECK (payment_method IN ('cash', 'upi')),
  total DECIMAL(10,2) NOT NULL,
  is_paid BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 6. Order items
CREATE TABLE order_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES menu_items(id),
  item_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 7. Batches (AI kitchen batching)
CREATE TABLE batches (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  restaurant_id UUID REFERENCES restaurants(id),
  dish_name TEXT NOT NULL,
  order_ids TEXT[],
  quantity INTEGER NOT NULL,
  status TEXT CHECK (status IN ('pending', 'preparing', 'ready')) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);

-- 8. Subscriptions (owner billing)
CREATE TABLE subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  restaurant_id UUID REFERENCES restaurants(id) UNIQUE,
  plan TEXT CHECK (plan IN ('starter', 'growth')),
  status TEXT CHECK (status IN ('active', 'inactive', 'trial')) DEFAULT 'trial',
  trial_ends_at TIMESTAMP,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies (basic - we'll refine later)
CREATE POLICY "Enable read for all" ON restaurants FOR SELECT USING (true);
CREATE POLICY "Enable read for all" ON menu_categories FOR SELECT USING (true);
CREATE POLICY "Enable read for all" ON menu_items FOR SELECT USING (true);
CREATE POLICY "Enable insert for all" ON customers FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable read for all" ON orders FOR SELECT USING (true);
CREATE POLICY "Enable insert for all" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all" ON orders FOR UPDATE USING (true);
CREATE POLICY "Enable read for all" ON order_items FOR SELECT USING (true);
CREATE POLICY "Enable insert for all" ON order_items FOR INSERT WITH CHECK (true);