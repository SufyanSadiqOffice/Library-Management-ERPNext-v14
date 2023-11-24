# Copyright (c) 2023, SowaanERP and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document

class BookIssue(Document):
	
	def on_submit(self):
		doc = frappe.get_doc({
				'doctype': 'Book Movement Ledger',
				'type': 'Book Issue',
				'type_id': self.name, 
				'book': self.book,
				'source_library': self.library,
				'source_rack': self.rack,
				'source_shelf': self.shelf,
				'copies': 1,
				'user_category': self.user_category,
				'book_issued_to': self.issue_to
			})
		doc.insert()


	def on_cancel(self):
		ledger_doc = frappe.get_doc('Book Movement Ledger', {'type': 'Book Issue', 'type_id': self.name})    	
		if ledger_doc :
			ledger_doc.delete()
			# ledger_doc.cancel()
			