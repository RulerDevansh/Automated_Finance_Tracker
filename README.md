# Personal Finance Tracker

Full-stack app with Node/Express/PostgreSQL backend and React + Tailwind frontend.

## Backend
1. `cd backend && npm install`
2. Copy `.env.example` to `.env` and set `DATABASE_URL`, `JWT_SECRET`, etc.
3. Initialize DB: `psql "$DATABASE_URL" -f db/init.sql`
4. Run dev server: `npm run dev` (default http://localhost:4000)

API base: `/api`
- Auth: `POST /api/auth/register`, `POST /api/auth/login`
- Users: `GET /api/users/me`, `PATCH /api/users/me`
- Categories: `CRUD /api/categories`
- Transactions: `CRUD /api/transactions`
- Budgets: `CRUD /api/budgets`, `GET /api/reports/budget-progress`
- Reports: `GET /api/reports/dashboard`, `GET /api/reports/monthly`

## Frontend
1. `cd frontend && npm install`
2. Copy `.env.example` to `.env` and set `VITE_API_URL` (default http://localhost:4000/api)
3. Run dev server: `npm run dev` (default http://localhost:5173)

Pages
- Auth: login/register
- Dashboard: totals, monthly breakdown, category summary
- Transactions: add/edit/delete income & expenses with category/type validation
- Categories: create/rename/delete income or expense categories
- Budgets: set per-category monthly budgets and see progress
- Reports: monthly income vs expenses with totals
- Profile: update name and password

UI extras
- Charts via Recharts on dashboard and reports
- Category labels in transactions/budgets lists for clarity

## Notes
- JWT stored in localStorage; axios interceptor sends `Authorization: Bearer <token>`.
- Amounts use decimal normalization in backend; negative amounts allowed for refunds.
- Categories cannot be deleted if transactions exist.
