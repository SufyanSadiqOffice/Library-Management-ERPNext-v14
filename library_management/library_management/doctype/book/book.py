# Copyright (c) 2023, SowaanERP and contributors
# For license information, please see license.txt

# import frappe
from frappe.model.document import Document

class Book(Document):
	def validate(self):
		# self.copies_available = self.number_of_copies
		pass
