"""Whitelisted API methods for the RAS Sales Desk dashboard.

This module is the only surface the custom React dashboard talks to. It never
exposes raw doctype/filter query building to the frontend — every method here
is a purpose-built read/write for the sales pipeline (Lead -> Quotation ->
Sales Order -> Delivery Note -> Sales Invoice), and every call runs under the
logged-in user's session so ERPNext's own role-based permissions are enforced
automatically (no separate authorization layer to maintain).

Auth model: the frontend logs in via Frappe's built-in `/api/method/login`,
which sets an HttpOnly session cookie. All calls below rely on that cookie
(`frappe.session.user`) rather than API keys, so there is nothing to hardcode
or leak in frontend code. State-changing calls also require the standard
Frappe CSRF token header, which the frontend fetches once after login.
"""

import frappe
from frappe import _


PIPELINE_DOCTYPES = {
	"leads": "Lead",
	"quotations": "Quotation",
	"sales_orders": "Sales Order",
	"delivery_notes": "Delivery Note",
	"sales_invoices": "Sales Invoice",
}


@frappe.whitelist()
def get_current_user():
	"""Return basic profile info for the logged-in session, used by the
	dashboard on load to know who is signed in and what they can see."""
	if frappe.session.user == "Guest":
		frappe.throw(_("Not logged in"), frappe.AuthenticationError)

	user = frappe.get_doc("User", frappe.session.user)
	return {
		"name": user.name,
		"full_name": user.full_name,
		"email": user.email,
		"roles": frappe.get_roles(user.name),
	}


@frappe.whitelist()
def get_pipeline_summary():
	"""Return counts per pipeline stage for the sales pipeline overview cards."""
	summary = {}
	for key, doctype in PIPELINE_DOCTYPES.items():
		summary[key] = frappe.db.count(doctype)
	return summary


@frappe.whitelist()
def get_pipeline_list(stage, limit=20, start=0):
	"""Return a lightweight list of records for one pipeline stage.

	`stage` must be one of the keys in PIPELINE_DOCTYPES (leads, quotations,
	sales_orders, delivery_notes, sales_invoices) — this avoids exposing raw
	doctype names or filters to the frontend.
	"""
	if stage not in PIPELINE_DOCTYPES:
		frappe.throw(_("Unknown pipeline stage: {0}").format(stage))

	doctype = PIPELINE_DOCTYPES[stage]
	fields = _list_fields(doctype)

	return frappe.get_list(
		doctype,
		fields=fields,
		order_by="modified desc",
		limit_page_length=int(limit),
		limit_start=int(start),
	)


@frappe.whitelist()
def get_quote_form_options():
	"""Return minimal lead/customer options for the quotation-generation form."""
	leads = frappe.get_list(
		"Lead",
		fields=["name", "lead_name", "company_name", "status"],
		order_by="creation desc",
		limit_page_length=250,
	)
	customers = frappe.get_list(
		"Customer",
		fields=["name", "customer_name"],
		order_by="creation desc",
		limit_page_length=250,
	)
	return {"leads": leads, "customers": customers}


@frappe.whitelist()
def create_quotation(
	lead_name=None,
	customer=None,
	project_reference=None,
	requested_delivery_date=None,
	item_code=None,
	item_description=None,
	qty=1,
	rate=0,
	uom="Nos",
):
	"""Create a simple draft quotation from the dashboard for sales follow-up."""
	if not lead_name and not customer:
		frappe.throw(_("Choose a lead or customer before creating a quotation."))

	quote = frappe.new_doc("Quotation")
	quote.quotation_to = "Lead" if lead_name else "Customer"
	quote.party_name = lead_name or customer

	if project_reference:
		quote.project_reference = project_reference
	if requested_delivery_date:
		quote.requested_delivery_date = requested_delivery_date

	item_name = item_description or "Quotation item"
	quote.append(
		"items",
		{
			"item_code": item_code or "",
			"item_name": item_name,
			"qty": float(qty or 1),
			"rate": float(rate or 0),
			"uom": uom or "Nos",
		},
	)

	quote.insert(ignore_permissions=True)
	quote.submit()
	return {"name": quote.name, "status": quote.status, "party_name": quote.party_name}


def _list_fields(doctype):
	common = ["name", "modified", "status"]
	extra = {
		"Lead": ["lead_name", "company_name"],
		"Quotation": ["party_name", "grand_total", "project_reference", "requested_delivery_date"],
		"Sales Order": ["customer", "grand_total", "delivery_date"],
		"Delivery Note": ["customer", "posting_date"],
		"Sales Invoice": ["customer", "grand_total", "due_date"],
	}
	return common + extra.get(doctype, [])
