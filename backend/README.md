# Backend (Node.js + MySQL)

## 1) Setup

1. Go to backend folder:
   `cd backend`
2. Install dependencies:
   `npm install`
3. Create env file:
   `copy .env.example .env`
4. Update `.env` with your MySQL username/password.
5. Run SQL script in MySQL:
   `mysql -u root -p < sql/schema.sql`

## 2) Start server

Development:
`npm run dev`

Production:
`npm start`

Server default URL: `http://localhost:4001`

## 3) API Endpoints

- `GET /api/health` -> health + DB status
- `GET /api/rings` -> list rings
- `POST /api/rings` -> create ring

Example POST body:
```json
{
  "ringName": "Eternal Glow",
  "material": "Gold",
  "price": 299.99
}
```
