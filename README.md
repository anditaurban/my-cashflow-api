# Cashflow Harian REST API

Backend Node.js + Express untuk database MySQL pada `database/cashflow-harian-crud.sql`.

## Setup

1. Import SQL ke MySQL/XAMPP:

   ```sql
   SOURCE database/cashflow-harian-crud.sql;
   ```

2. Salin `.env.example` menjadi `.env`, lalu sesuaikan kredensial database.

   Jika memakai Railway MySQL, gunakan variable bawaan Railway:

   ```env
   MYSQLHOST=...
   MYSQLPORT=...
   MYSQLUSER=...
   MYSQLPASSWORD=...
   MYSQLDATABASE=...
   ```

   Atau gunakan connection URL:

   ```env
   MYSQL_URL=mysql://user:password@host:port/database
   ```

   Urutan prioritas konfigurasi database:

   - `MYSQLHOST`, `MYSQLPORT`, `MYSQLUSER`, `MYSQLPASSWORD`, `MYSQLDATABASE`
   - `MYSQL_URL`, `MYSQL_PUBLIC_URL`, `DATABASE_URL`, `DATABASE_PUBLIC_URL`
   - `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
   - fallback lokal `127.0.0.1`, `root`, database `cashflow_harian`

3. Install dependency:

   ```bash
   npm install
   ```

4. Jalankan API:

   ```bash
   npm run dev
   ```

## Endpoint Utama

- `GET /api/health`
- `GET /api/categories`
- `POST /api/categories`
- `PUT /api/categories/:id`
- `DELETE /api/categories/:id`
- `GET /api/payment-methods`
- `GET /api/transactions`
- `POST /api/transactions`
- `PUT /api/transactions/:id`
- `DELETE /api/transactions/:id`
- `GET /api/settings`
- `PUT /api/settings`
- `GET /api/dashboard/summary?date=2026-06-04`
- `GET /api/dashboard/recent`
- `GET /api/dashboard/chart?date=2026-06-04`
- `GET /api/reports/summary?start_date=2026-05-28&end_date=2026-06-04`
- `GET /api/reports/categories?start_date=2026-05-28&end_date=2026-06-04`
- `GET /api/reports/transactions?start_date=2026-05-28&end_date=2026-06-04`

## Contoh Body

```json
{
  "transaction_date": "2026-06-05",
  "type": "income",
  "category_id": 1,
  "description": "Penjualan produk harian",
  "amount": 750000,
  "payment_method_id": 3,
  "status": "Selesai",
  "note": "Transaksi contoh"
}
```
