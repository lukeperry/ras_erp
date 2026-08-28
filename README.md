# RAS ERP (custom app)

Custom Frappe app implementing client-specific Sales & Operations logic on top of ERPNext.
Never modify ERPNext/Frappe core here — this app only adds Workflows, DocTypes, Client/Server
Scripts, Print Formats, Reports, and fixtures.

## Installation

```
bench get-app ras_erp <repo-url>
bench --site <site-name> install-app ras_erp
```

## Contents

- `hooks.py` — app metadata, fixtures export list, doc events.
- `ras_erp/` — module folder for custom DocTypes (Quick Quotation, distance-based shipping, etc.),
  created only when native ERPNext DocTypes don't cover the requirement.
- `ras_erp/api.py` — whitelisted backend methods for the custom dashboard (see below); the only
  surface the frontend talks to, so permissions stay enforced by Frappe's role system.
- `fixtures/` — exported Workflow, Custom Field, Notification, Print Format, Role definitions so
  `bench migrate` reproduces configuration with zero manual UI steps.
- `dashboard/` — standalone React + Vite + TypeScript frontend that replaces the Frappe desk UI
  for day-to-day sales work. Uses Frappe purely as a backend (session-cookie auth, no API keys).
  See [`dashboard/README.md`](./dashboard/README.md) for setup and deployment.

## License

GPLv3 (see `license.txt`).
