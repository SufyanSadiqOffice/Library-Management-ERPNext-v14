# # Copyright (c) 2023, SowaanERP and contributors
# # For license information, please see license.txt
from collections import defaultdict

from frappe import _
import frappe


def lib_in_one_array(array, library_name):
	output = {}

	for item in array:
		book = item["book"]
		if book not in output:
			output[book] = {
				"book": book,
				library_name: []
			}
		
		output[book][library_name].extend(item[library_name])

	return list(output.values())

def lib_rk_in_one_book(array, library_name, rack_name):
	output = {}

	for item in array:
		book = item["book"]
		if book not in output:
			output[book] = {"book": book, library_name: []}
		
		found_lib = None
		for lib in output[book][library_name]:
			if lib["lib_name"] == item[library_name][0]["lib_name"]:
				found_lib = lib
				break
		
		if found_lib is None:
			output[book][library_name].append(item[library_name][0])
		else:
			found_lib["lib_copy"] += item[library_name][0]["lib_copy"]
			found_lib[rack_name].extend(item[library_name][0][rack_name])

	return list(output.values())

def execute(filters=None):
	library_filter={'enabled': 1}
	book_filter={'enabled': 1}
	rack_filter={'enabled': 1}

	if filters.library:
		library_filter['name'] = filters.library
	
	if filters.book:
		book_filter['name'] = filters.book

	if filters.rack:
		rack_filter['name'] = filters.rack

	libraries_list = frappe.db.get_all("Library", filters=library_filter, fields=['*'], order_by='name asc',)
	books = frappe.db.get_all("Book", filters=book_filter, fields=['*'])
	racks = frappe.db.get_all("Rack", filters=rack_filter, fields=['*'])

	rack_source_copy = 0
	rack_target_copy = 0
	rack_source_array = []
	rack_target_array = []

	for bk in books:
		rack_source_copy = 0
		rack_target_copy = 0
		for rk in racks:
			for lib in libraries_list:
				rack_source_copy = 0
				rack_target_copy = 0
				ledgerA = frappe.db.get_all("Book Movement Ledger", filters={
					'target_library': lib.name,
					'book': bk.name,
					'target_rack': rk.name
					}, fields=['*'])
				for led in ledgerA:
					rack_source_copy += led.copies
				# if rack_source_copy != 0:
				rack_source_array.append({
					"book": bk.name,
					"source_library": [
						{
							"lib_name": lib.name,
							"lib_copy": rack_source_copy,
							"source_rack": [
								{
									"rack_name": rk.name,
									"rack_copy": rack_source_copy
								}
							],
						}
					]
				})

				ledgerB = frappe.db.get_all("Book Movement Ledger", filters={
					'source_library': lib.name,
					'book': bk.name,
					'source_rack': rk.name
					}, fields=['*'])
				for led in ledgerB:
					rack_target_copy += led.copies
				if rack_target_copy != 0:
					rack_target_array.append({
						"book": bk.name,
						"target_library": [
							{
								"lib_name": lib.name,
								"lib_copy": rack_target_copy,
								"target_rack": [
									{
										"rack_name": rk.name,
										"rack_copy": rack_target_copy
									}
								],
							}
						]
						
					})
					

	rack_source_array = lib_rk_in_one_book(rack_source_array, "source_library", "source_rack")
	rack_target_array = lib_rk_in_one_book(rack_target_array, "target_library", "target_rack")

	final_value = []

	for entry1 in rack_source_array:
		book = entry1['book']
		source_libraries = entry1['source_library']
		
		for source_library in source_libraries:
			lib_name = source_library['lib_name']
			lib_copy = source_library['lib_copy']
			source_racks = source_library['source_rack']
			
			for entry2 in rack_target_array:
				if entry2['book'] == book:
					target_libraries = entry2['target_library']
					
					for target_library in target_libraries:
						if target_library['lib_name'] == lib_name:
							target_lib_copy = target_library['lib_copy']
							target_racks = target_library['target_rack']
							
							for source_rack in source_racks:
								for target_rack in target_racks:
									if source_rack['rack_name'] == target_rack['rack_name']:
										source_rack['rack_copy'] = source_rack['rack_copy'] - target_rack['rack_copy']
										
							source_library['lib_copy'] = source_library['lib_copy'] - target_lib_copy
		
		final_value.append({'book': book, 'source_library': source_libraries})

	# print(final_value, "checking")

	columns = []
	columns.append(_('Book'))
	columns.append(_('Book Name'))

	
	for bks in final_value:
		for libs in bks['source_library']:
			get_lib = frappe.get_doc("Library", libs['lib_name'], fields=["name1"])
			if get_lib.name1 not in columns:
				columns.append(_(get_lib.name1))
			for rks in libs['source_rack']:
				get_rack = frappe.db.get_all("Rack", filters={
					'name': rks['rack_name'],
					'library': libs['lib_name']
				}, fields=["rack_number"])
				for g_rack in get_rack:
					if g_rack['rack_number'] not in columns:
						columns.append(_(g_rack['rack_number']))

	data = []

	for bks in final_value:
		row = [bks['book']]
		bok = frappe.get_doc('Book', bks['book'], fields=['tital'])
		if bok:
			row += [bok.title]
		# data.append({
		# 	"book": bks['book']
		# })
		for libs in bks['source_library']:
			get_lib = frappe.get_doc("Library", libs['lib_name'], fields=["name1"])
			if get_lib:
				row += [libs['lib_copy']]
			# data.append({
			# 	"library": libs['lib_copy']
			# })
			for rks in libs['source_rack']:
				get_rack = frappe.db.get_all("Rack", filters={
					'name': rks['rack_name'],
					'library': libs['lib_name']
				}, fields=["rack_number"])
				for g_rack in get_rack:
					if g_rack:
						row += [rks['rack_copy']]
				# data.append({
				# 	'rack': rks['rack_copy']
				# })
		data.append(row)

	return columns, data
