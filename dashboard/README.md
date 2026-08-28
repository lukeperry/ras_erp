# RAS Sales Desk Dashboard

Custom React frontend for the RAS Sales Desk, built to replace the Frappe
desk UI for day-to-day sales pipeline work (Leads → Quotations → Sales
Orders → Delivery Notes → Sales Invoices). Frappe/ERPNext is used purely as
the backend: data storage, permissions, and business logic — never its
built-in UI.

## How it talks to the backend

- No API keys, no hardcoded credentials anywhere in this app.
- Login calls Frappe's built-in `/api/method/login`, which sets an
  `HttpOnly` session cookie. The browser sends that cookie automatically on
  every request (`credentials: 'include'`), so auth "just works" without any
  token management in JS.
- State-changing requests include the CSRF token Frappe issues after login
  (`X-Frappe-CSRF-Token` header) — this is Frappe's standard CSRF
  protection, not something custom.
- All data access goes through whitelisted methods in
  [`ras_erp/api.py`](../ras_erp/api.py) (e.g. `get_pipeline_summary`,
  `get_pipeline_list`) rather than raw doctype queries, so permissions and
  field selection stay server-side and centrally controlled.

## Development

```bash
cp .env.example .env   # point FRAPPE_SITE_URL at your bench site
npm install
npm run dev
```

Vite proxies `/api/*` to `FRAPPE_SITE_URL` so the dev server is effectively
same-origin with Frappe too — no CORS configuration is needed in dev or
production.

## Production

Build the static bundle and serve it behind the same reverse proxy as your
Frappe site so both are on one origin (see
[`deploy/nginx.conf.example`](./deploy/nginx.conf.example)):

```bash
npm run build   # outputs to dist/
```
