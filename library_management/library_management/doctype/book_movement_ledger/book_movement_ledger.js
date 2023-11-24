// Copyright (c) 2023, SowaanERP and contributors
// For license information, please see license.txt

frappe.ui.form.on('Book Movement Ledger', {
	refresh: function(frm) {
		frm.page.btn_primary.hide()
	}
});
