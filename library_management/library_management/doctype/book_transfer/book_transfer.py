# Copyright (c) 2023, SowaanERP and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document

class BookTransfer(Document):
	
	
	def on_submit(self):
		if self.purpose == "Main to Library":
			self.subtract_book_qty()
			self.add_copies()
		self.make_book_ledger()

	def add_copies(self):
		book = frappe.get_doc("Book", self.book)
		book.copies_in_libraries = book.copies_in_libraries + self.number_of_copies
		book.save()

	def subtract_book_qty(self):
		book = frappe.get_doc("Book", self.book)
		book.copies_available = book.copies_available - self.number_of_copies
		book.number_of_copies = book.number_of_copies - self.number_of_copies
		book.save()

	def make_book_ledger(self):
		doc = frappe.get_doc({
			'doctype': 'Book Movement Ledger',
			'type': self.purpose,
			'type_id': self.name,
			'book': self.book,
			'source_library': None if self.purpose == "Main to Library" else self.source_library,
			'source_rack': None if self.purpose == "Main to Library" else self.source_rack,
			'source_shelf': None if self.purpose == "Main to Library" else self.source_shelf,
			'target_library': self.library,
			'target_rack': self.target_rack,
			'target_shelf': self.target_shelf,
			'copies': self.number_of_copies
		})
		doc.insert()


	def on_cancel(self):
		if self.purpose == "Main to Library":
			self.add_book_qty()
			self.sub_copies()
		self.remove_book_ledger()

	def sub_copies(self):
		book = frappe.get_doc("Book", self.book)
		book.copies_in_libraries = book.copies_in_libraries - self.number_of_copies
		book.save()

	def add_book_qty(self):
		book = frappe.get_doc("Book", self.book)
		book.copies_available = book.copies_available + self.number_of_copies
		book.number_of_copies = book.number_of_copies + self.number_of_copies
		book.save()

	def remove_book_ledger(self):
		ledger_doc = frappe.get_doc('Book Movement Ledger', {'type_id': self.name})    	
		if ledger_doc :
			ledger_doc.delete()	


	
	# def before_save(self):

		# if self.purpose == 'Main to Library':
		# 	book_doc = frappe.get_doc('Book',self.book)
			# frappe.set_value('Book Transfer', self.name, self.copies_available, book_doc.copies_available)
			# self.copies_available = book_doc.copies_available

			# if self.copies_available < self.number_of_copies :
			# 	frappe.throw("Number of Copies cannot be Greater than available copies.")
			
			# ledger_list	=	frappe.get_list('Book Movement Ledger',
			# 					filters = {
			# 						'target_library' : self.source_library,
			# 						'target_rack' : self.source_rack,
			# 						'target_shelf' : self.source_shelf,
			# 						'book' : self.book,
			# 					})

			# if ledger_list :



