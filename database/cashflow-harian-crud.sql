-- MySQL CRUD reference for Cashflow Harian.
-- This file is documentation/reference only. The current app remains front-end only.

CREATE DATABASE IF NOT EXISTS cashflow_harian
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE cashflow_harian;

DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS business_settings;
DROP TABLE IF EXISTS payment_methods;
DROP TABLE IF EXISTS categories;

CREATE TABLE categories (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  type ENUM('income', 'expense') NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_categories_name_type (name, type),
  KEY idx_categories_type (type)
) ENGINE=InnoDB;

CREATE TABLE payment_methods (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_payment_methods_name (name)
) ENGINE=InnoDB;

CREATE TABLE transactions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  transaction_date DATE NOT NULL,
  type ENUM('income', 'expense') NOT NULL,
  category_id BIGINT UNSIGNED NOT NULL,
  description VARCHAR(255) NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  payment_method_id BIGINT UNSIGNED NOT NULL,
  status ENUM('Selesai', 'Pending', 'Dibatalkan') NOT NULL DEFAULT 'Selesai',
  note TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_transactions_category
    FOREIGN KEY (category_id) REFERENCES categories(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_transactions_payment_method
    FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT chk_transactions_amount_positive CHECK (amount >= 0),
  KEY idx_transactions_date (transaction_date),
  KEY idx_transactions_type (type),
  KEY idx_transactions_status (status),
  KEY idx_transactions_category_id (category_id)
) ENGINE=InnoDB;

CREATE TABLE business_settings (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  business_name VARCHAR(150) NOT NULL,
  owner_name VARCHAR(150) NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'IDR',
  date_format VARCHAR(30) NOT NULL DEFAULT 'DD/MM/YYYY',
  display_mode ENUM('light', 'dark') NOT NULL DEFAULT 'light',
  notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

INSERT INTO categories (name, type, is_default) VALUES
  ('Penjualan', 'income', TRUE),
  ('Jasa', 'income', TRUE),
  ('Investasi', 'income', TRUE),
  ('Bonus', 'income', TRUE),
  ('Lainnya', 'income', TRUE),
  ('Operasional', 'expense', TRUE),
  ('Gaji', 'expense', TRUE),
  ('Transportasi', 'expense', TRUE),
  ('Makan', 'expense', TRUE),
  ('Belanja', 'expense', TRUE),
  ('Tagihan', 'expense', TRUE),
  ('Lainnya', 'expense', TRUE);

INSERT INTO payment_methods (name) VALUES
  ('Cash'),
  ('Transfer Bank'),
  ('QRIS'),
  ('E-Wallet');

INSERT INTO business_settings (
  business_name,
  owner_name,
  currency,
  date_format,
  display_mode,
  notifications_enabled
) VALUES (
  'Toko Andita',
  'Andita',
  'IDR',
  'DD/MM/YYYY',
  'light',
  TRUE
);

INSERT INTO transactions (
  transaction_date,
  type,
  category_id,
  description,
  amount,
  payment_method_id,
  status,
  note
) VALUES
  ('2026-06-04', 'income', 1, 'Penjualan produk pagi', 950000, 3, 'Selesai', NULL),
  ('2026-06-04', 'expense', 6, 'Pembelian bahan baku', 320000, 1, 'Selesai', NULL),
  ('2026-06-04', 'income', 2, 'Pembayaran jasa konsultasi', 1200000, 2, 'Pending', NULL),
  ('2026-06-03', 'expense', 8, 'Ongkos pengiriman barang', 150000, 4, 'Selesai', NULL),
  ('2026-06-03', 'income', 1, 'Penjualan grosir', 1750000, 2, 'Selesai', NULL),
  ('2026-06-02', 'expense', 7, 'Pembayaran helper harian', 400000, 1, 'Selesai', NULL),
  ('2026-06-02', 'expense', 11, 'Tagihan internet toko', 275000, 3, 'Pending', NULL),
  ('2026-06-01', 'income', 4, 'Bonus referral pelanggan', 300000, 4, 'Selesai', NULL),
  ('2026-05-31', 'expense', 10, 'Belanja perlengkapan display', 625000, 2, 'Dibatalkan', NULL),
  ('2026-05-30', 'income', 3, 'Imbal hasil investasi pendek', 450000, 2, 'Selesai', NULL),
  ('2026-05-29', 'expense', 9, 'Konsumsi rapat kecil', 185000, 3, 'Selesai', NULL),
  ('2026-05-28', 'income', 5, 'Pemasukan tambahan', 210000, 1, 'Pending', NULL);

-- =========================
-- CRUD: Categories
-- =========================

-- CREATE category
INSERT INTO categories (name, type, is_default)
VALUES ('Komisi Marketplace', 'income', FALSE);

-- READ categories
SELECT
  id,
  name,
  type,
  is_default,
  created_at,
  updated_at
FROM categories
ORDER BY type, name;

-- UPDATE category
UPDATE categories
SET name = 'Komisi Online'
WHERE id = 13
  AND is_default = FALSE;

-- DELETE category
DELETE FROM categories
WHERE id = 13
  AND is_default = FALSE;

-- Safe category delete pattern:
-- move related transactions to "Lainnya" before deleting a non-default category.
START TRANSACTION;

SET @deleted_category_id := 13;
SET @deleted_category_type := (
  SELECT type FROM categories WHERE id = @deleted_category_id
);
SET @fallback_category_id := (
  SELECT id
  FROM categories
  WHERE name = 'Lainnya'
    AND type = @deleted_category_type
  LIMIT 1
);

UPDATE transactions
SET category_id = @fallback_category_id
WHERE category_id = @deleted_category_id;

DELETE FROM categories
WHERE id = @deleted_category_id
  AND is_default = FALSE;

COMMIT;

-- =========================
-- CRUD: Transactions
-- =========================

-- CREATE transaction
INSERT INTO transactions (
  transaction_date,
  type,
  category_id,
  description,
  amount,
  payment_method_id,
  status,
  note
) VALUES (
  '2026-06-04',
  'income',
  1,
  'Penjualan produk harian',
  750000,
  3,
  'Selesai',
  'Transaksi contoh'
);

-- READ all transactions
SELECT
  t.id,
  t.transaction_date,
  c.name AS category,
  t.description,
  t.type,
  t.amount,
  pm.name AS payment_method,
  t.status,
  t.note,
  t.created_at,
  t.updated_at
FROM transactions AS t
JOIN categories AS c ON c.id = t.category_id
JOIN payment_methods AS pm ON pm.id = t.payment_method_id
ORDER BY t.transaction_date DESC, t.id DESC;

-- READ transactions with search and filters.
-- Replace variable values as needed.
SET @keyword := 'produk';
SET @type_filter := 'income';
SET @status_filter := 'Selesai';

SELECT
  t.id,
  t.transaction_date,
  c.name AS category,
  t.description,
  t.type,
  t.amount,
  pm.name AS payment_method,
  t.status
FROM transactions AS t
JOIN categories AS c ON c.id = t.category_id
JOIN payment_methods AS pm ON pm.id = t.payment_method_id
WHERE
  (
    @keyword IS NULL
    OR @keyword = ''
    OR t.description LIKE CONCAT('%', @keyword, '%')
    OR c.name LIKE CONCAT('%', @keyword, '%')
    OR pm.name LIKE CONCAT('%', @keyword, '%')
  )
  AND (@type_filter IS NULL OR @type_filter = 'all' OR t.type = @type_filter)
  AND (@status_filter IS NULL OR @status_filter = 'all' OR t.status = @status_filter)
ORDER BY t.transaction_date DESC, t.id DESC;

-- UPDATE transaction
UPDATE transactions
SET
  transaction_date = '2026-06-05',
  type = 'expense',
  category_id = 6,
  description = 'Pembelian bahan baku',
  amount = 320000,
  payment_method_id = 1,
  status = 'Selesai',
  note = 'Update transaksi'
WHERE id = 1;

-- DELETE transaction
DELETE FROM transactions
WHERE id = 1;

-- =========================
-- CRUD: Business Settings
-- =========================

-- READ settings
SELECT
  id,
  business_name,
  owner_name,
  currency,
  date_format,
  display_mode,
  notifications_enabled,
  updated_at
FROM business_settings
WHERE id = 1;

-- UPDATE settings
UPDATE business_settings
SET
  business_name = 'Toko Andita Baru',
  owner_name = 'Andita',
  currency = 'IDR',
  date_format = 'DD/MM/YYYY',
  display_mode = 'dark',
  notifications_enabled = TRUE
WHERE id = 1;

-- =========================
-- Dashboard Queries
-- =========================

-- Summary for a selected date.
SET @dashboard_date := '2026-06-04';

SELECT
  COALESCE(SUM(CASE WHEN type = 'income' AND status = 'Selesai' THEN amount ELSE 0 END), 0) AS total_income,
  COALESCE(SUM(CASE WHEN type = 'expense' AND status = 'Selesai' THEN amount ELSE 0 END), 0) AS total_expense,
  COALESCE(SUM(CASE
    WHEN type = 'income' AND status = 'Selesai' THEN amount
    WHEN type = 'expense' AND status = 'Selesai' THEN -amount
    ELSE 0
  END), 0) AS net_balance,
  COUNT(*) AS total_transactions
FROM transactions
WHERE transaction_date = @dashboard_date;

-- Recent transactions.
SELECT
  t.id,
  t.transaction_date,
  c.name AS category,
  t.description,
  t.type,
  t.amount,
  t.status
FROM transactions AS t
JOIN categories AS c ON c.id = t.category_id
ORDER BY t.transaction_date DESC, t.id DESC
LIMIT 5;

-- Simple cashflow chart data.
SELECT
  transaction_date,
  SUM(CASE WHEN type = 'income' AND status = 'Selesai' THEN amount ELSE 0 END) AS income_total,
  SUM(CASE WHEN type = 'expense' AND status = 'Selesai' THEN amount ELSE 0 END) AS expense_total
FROM transactions
WHERE transaction_date BETWEEN DATE_SUB(@dashboard_date, INTERVAL 6 DAY) AND @dashboard_date
GROUP BY transaction_date
ORDER BY transaction_date;

-- =========================
-- Report Queries
-- =========================

SET @start_date := '2026-05-28';
SET @end_date := '2026-06-04';

-- Report summary.
SELECT
  COALESCE(SUM(CASE WHEN type = 'income' AND status = 'Selesai' THEN amount ELSE 0 END), 0) AS total_income,
  COALESCE(SUM(CASE WHEN type = 'expense' AND status = 'Selesai' THEN amount ELSE 0 END), 0) AS total_expense,
  COALESCE(SUM(CASE
    WHEN type = 'income' AND status = 'Selesai' THEN amount
    WHEN type = 'expense' AND status = 'Selesai' THEN -amount
    ELSE 0
  END), 0) AS ending_balance,
  COUNT(*) AS total_transactions
FROM transactions
WHERE transaction_date BETWEEN @start_date AND @end_date;

-- Category summary.
SELECT
  c.name AS category,
  t.type,
  SUM(t.amount) AS total_amount
FROM transactions AS t
JOIN categories AS c ON c.id = t.category_id
WHERE t.status = 'Selesai'
  AND t.transaction_date BETWEEN @start_date AND @end_date
GROUP BY c.name, t.type
ORDER BY total_amount DESC;

-- Report transaction table.
SELECT
  t.id,
  t.transaction_date,
  c.name AS category,
  t.description,
  t.type,
  t.amount,
  pm.name AS payment_method,
  t.status
FROM transactions AS t
JOIN categories AS c ON c.id = t.category_id
JOIN payment_methods AS pm ON pm.id = t.payment_method_id
WHERE t.transaction_date BETWEEN @start_date AND @end_date
ORDER BY t.transaction_date DESC, t.id DESC;
