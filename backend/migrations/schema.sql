-- Sikapa Enterprise database schema

CREATE TABLE categories (
    id serial PRIMARY KEY,
    name text NOT NULL,
    slug text UNIQUE NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE products (
    id serial PRIMARY KEY,
    name text NOT NULL,
    slug text UNIQUE NOT NULL,
    description text,
    price numeric(10,2) NOT NULL,
    image_url text,
    category text,
    in_stock integer NOT NULL DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE users (
    id serial PRIMARY KEY,
    email text UNIQUE NOT NULL,
    hashed_password text NOT NULL,
    is_active boolean NOT NULL DEFAULT true,
    is_admin boolean NOT NULL DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE orders (
    id serial PRIMARY KEY,
    user_id integer REFERENCES users(id) ON DELETE SET NULL,
    total_amount numeric(10,2) NOT NULL,
    status text NOT NULL DEFAULT 'pending',
    paystack_reference text,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE order_items (
    id serial PRIMARY KEY,
    order_id integer REFERENCES orders(id) ON DELETE CASCADE,
    product_id integer REFERENCES products(id) ON DELETE SET NULL,
    quantity integer NOT NULL DEFAULT 1,
    unit_price numeric(10,2) NOT NULL
);

CREATE TABLE coupons (
    id serial PRIMARY KEY,
    code text UNIQUE NOT NULL,
    discount_percent integer NOT NULL CHECK (discount_percent BETWEEN 0 AND 100),
    active boolean NOT NULL DEFAULT true,
    expires_at timestamp with time zone
);

CREATE TABLE reviews (
    id serial PRIMARY KEY,
    product_id integer REFERENCES products(id) ON DELETE CASCADE,
    user_id integer REFERENCES users(id) ON DELETE SET NULL,
    rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment text,
    created_at timestamp with time zone DEFAULT now()
);
