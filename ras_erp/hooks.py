from . import __version__ as app_version

app_name = "ras_erp"
app_title = "RAS ERP"
app_publisher = "RAS-ERP"
app_description = "Sales & Operations customizations on top of ERPNext (Lead-to-Cash pipeline)"
app_email = "dev@ras-erp.local"
app_license = "GPLv3"

# This app customizes ERPNext; it must be installed on top of it, never in place of it.
required_apps = ["erpnext"]

# Fixtures
# --------
# UI-configured objects (Workflow, Custom Field, Notification, Print Format, Role) must be listed
# here and exported via `bench export-fixtures` so `bench migrate` reproduces them with zero
# manual steps.
fixtures = [
	{"doctype": "Custom Field", "filters": [["dt", "in", ["Quotation", "Quotation Item"]]]},
]

# Doc Events
# ----------
# doc_events = {}

# Scheduled Tasks
# ---------------
# scheduler_events = {}
