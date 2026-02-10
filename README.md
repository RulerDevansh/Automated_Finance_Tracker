FischerJordan Assignment By Devansh Srivastava (MIS:- 112315053)

# Personal Finance Tracker

**Day 1-2 (Basic Functionality)**
- Authentication with JWT: register, login, profile update (name/password).
- PostgreSQL schema in `backend/db/init.sql` covering users, categories (income/expense), transactions, budgets. Transactions store date, amount (decimal-safe), description, category; negative amounts/refunds allowed. Guard prevents deleting categories with existing transactions.
- Transaction CRUD with validation and edge cases (negative/refund handling, category/type checks, decimal normalization).
- Dashboard and reporting: income/expense/savings totals, monthly breakdown chart, category splits, monthly income vs. expense report.
- Budgeting: set monthly budgets per expense category, list/delete, track progress.

**Day 3 Additional Features**
- Google OAuth: frontend uses Google Identity, backend verifies ID token and issues JWT, stores provider/google_id.
- Email notifications via Brevo SMTP (nodemailer): budget set/overrun alerts; summary email for configurable month range.
- Receipt upload: multer accepts PDF, stored under `backend/uploads/receipts`, served statically; attach per transaction.
- Multiple currencies: transactions and budgets carry currency; user-selectable base currency for dashboard/reports; free FX via frankfurter.app; selectors on dashboard, reports, transactions, budgets, profile.

**Day 4+ AI Copilot & UX**
- Chatbot (Gemini) can add transactions or set budgets by plain text. It understands today/yesterday/ISO dates and only remembers messages in the current chat session.
- If a category is missing, it can create a broad one and then log the expense in one go. It asks for confirmation before running any batch of actions.
- Chat widget: clears history when closed, darker chat button, and a small “need help?” nudge that appears sometimes while closed.
- Safety: confirmation flags stop unintended runs

## Tech Stack
- Backend: 
Node.js + Express,
`pg` pool for Postgres, 
`express-validator` for inputs, 
`jsonwebtoken` for JWTs, 
`bcryptjs` for hashing, 
`multer` for receipts, 
`nodemailer` with Brevo SMTP for email, 
currency conversion helper with caching.

- Frontend: 
React (Vite) + Tailwind, 
`react-router-dom` for routing and protected routes, 
Axios with JWT interceptor, 
Recharts for charts, 
Google Identity script for OAuth UI.

## Notes
- JWT stored in localStorage; Axios interceptor sends `Authorization: Bearer <token>`.
- Amounts normalized to 2 decimals; refunds supported via negative amounts.
- Categories cannot be deleted if transactions exist.
- Receipts are PDF-only; ensure `backend/uploads/receipts` is writable.
- AI model change automatically from gemini-2.5-flash to gemini-2.5-flash-lite on rate-limit exceed