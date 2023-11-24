// Copyright (c) 2023, SowaanERP and contributors
// For license information, please see license.txt
/* eslint-disable */

frappe.query_reports["Book Balance"] = {
	"filters": [
        {
            fieldname: 'library',
            label: __('Library'),
            fieldtype: 'Link',
            options: 'Library',
            // default: 'LM-LIBR-00491'
        },
        {
            fieldname: 'book',
            label: __('Book'),
            fieldtype: 'Link',  
            options: 'Book',
            // default: "LM-BOOK-00517"
        },
        {
            fieldname: 'rack',
            label: __('Rack'),
            fieldtype: 'Link',
			options: 'Rack',
            // default: 'LM-RACK-00497'
        }
    ]
};
