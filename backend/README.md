# Backend (Node.js + MySQL)

## 1) Setup

1. Go to backend folder:
   `cd backend`
2. Install dependencies:
   `npm install`
3. Create env file:
   `copy .env.example .env`
4. Update `.env` with your MySQL username/password and JWT secret.
5. Bootstrap the database:
   `mysql -u root -p < sql/app-bootstrap.sql`

Optional legacy scripts:
- `mysql -u root -p < sql/schema.sql`
- `mysql -u root -p < sql/inventory.sql`

## 2) Start server

Development:
`npm run dev`

Production:
`npm start`

If `nodemon` is restricted in your shell:
`node src/server.js`

Server default URL: `http://localhost:4001`

## Database Connection Setup

Database config is loaded from `.env` through `src/config/env.js` and `src/config/db.js`.

Required env vars:
- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`
- `JWT_SECRET`

The backend also auto-runs `initializeCoreTables()` on startup, so the required tables for auth, shop, profile, dashboard, notifications, settings, and inventory are created with `IF NOT EXISTS`.

## 3) Inventory API Endpoints

- `GET /api/health` -> health + DB status
- `GET /api/inventory` -> list inventory items
- `GET /api/inventory/filters` -> list dropdown filter values
- `GET /api/inventory/:id` -> get one inventory item
- `POST /api/inventory` -> create inventory item
- `PUT /api/inventory/:id` -> update inventory item
- `PATCH /api/inventory/:id/stock` -> update stock quantity only
- `DELETE /api/inventory/:id` -> delete inventory item

`GET /api/inventory` supports query params:
- `search`
- `model`
- `color`
- `status`
- `page`
- `limit`

Example POST body:
```json
{
  "image": "https://example.com/ring.jpg",
  "model": "Classic Silver",
  "color": "Silver",
  "variant": "Size 9 - Polished Steel",
  "sku": "SKU-CLS-SV-09",
  "serial": "SN: 4492-CS-221",
  "status": "In Stock",
  "stock": 84,
  "stockPercent": 65,
  "statusColor": "emerald"
}
```
