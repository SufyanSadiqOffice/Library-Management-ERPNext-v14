# Copyright (c) 2023, SowaanERP and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document

class BookReturn(Document):

	def on_submit(self):
		book_issue = frappe.get_doc("Book Issue", self.book_issue)
		doc = frappe.get_doc({
				'doctype': 'Book Movement Ledger',
				'type': 'Book Lost' if self.book_is_lost == 1 else 'Book Return',
				'type_id': self.name,
				'book': book_issue.book,
				'target_library': book_issue.library if self.book_is_lost == 0 else None,
				'target_rack': book_issue.rack if self.book_is_lost == 0 else None,
				'target_shelf': book_issue.shelf if self.book_is_lost == 0 else None,
				'copies': 1,
			})
		doc.insert()

	def on_cancel(self):
		ledger_doc = frappe.get_doc('Book Movement Ledger', {'type_id': self.name})    	
		if ledger_doc :
			ledger_doc.delete()




	