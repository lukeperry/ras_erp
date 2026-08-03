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
- `fixtures/` — exported Workflow, Custom Field, Notification, Print Format, Role definitions so
  `bench migrate` reproduces configuration with zero manual UI steps.

## License

GPLv3 (see `license.txt`).
