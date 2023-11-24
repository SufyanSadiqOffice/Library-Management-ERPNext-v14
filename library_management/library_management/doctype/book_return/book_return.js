// Copyright (c) 2023, SowaanERP and contributors
// For license information, please see license.txt

frappe.ui.form.on("Book Return", {
  refresh: function (frm) {
    if (frm.doc.docstatus === 1) {
      frm.add_custom_button(__("View Movement Ledger"), function () {
        frappe.route_options = {
          type: frm.doc.book_is_lost ? "Book Lost" : "Book Return",
        };
        frappe.set_route("List", "Book Movement Ledger");
      });
    }
    frm.trigger("set_fine");
  },

  book_issue: function (frm) {
    frm.trigger("set_fine");
  },

  returned_date: function (frm) {
    frm.trigger("set_fine");
  },

  book_is_lost: function (frm) {
    if (frm.doc.book_issue) {
      if (frm.doc.book_is_lost == 1) {
        frappe.call({
          method: "frappe.client.get",
          args: {
            doctype: "Fine Policy",
            filters: {
              name: frm.doc.user_category,
            },
          },
          callback: function (r) {
            if (r.message) {
              var fine_policy_doc = r.message;

              if (fine_policy_doc.lost_book_fine) {
                frm.set_value("fine_amount", fine_policy_doc.lost_book_fine);
              } else if (fine_policy_doc.lost_book_fine_percentage) {
                var amount =
                  (frm.doc.book_price *
                    fine_policy_doc.lost_book_fine_percentage) /
                  100;
                frm.set_value("fine_amount", amount);
              }
            }
          },
        });
      } else {
        frm.set_value("fine_amount", "");
        frm.trigger("set_fine");
      }
    }
  },

  set_fine: function (frm) {
    if (frm.doc.book_issue) {
      frappe.call({
        method: "frappe.client.get",
        args: {
          doctype: "Fine Policy",
          filters: {
            name: frm.doc.user_category,
          },
        },
        callback: function (r) {
          if (r.message) {
            var fine_policy_doc = r.message;
            var zero = 0;
            var expectedReturnDate = new Date(frm.doc.expected_return_date);
            var returnedDate = new Date(frm.doc.returned_date);
            var timeDiff = returnedDate - expectedReturnDate;
            var daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

            if (frm.doc.book_is_lost == 0) {
              if (daysDiff > fine_policy_doc.days_to_wait) {
                frm.set_value("fine_amount", fine_policy_doc.late_fine);
              }

              // if(daysDiff <= fine_policy_doc.days_to_wait) {
              // 	frm.set_value("fine_amount",zero);
              // }
            }
          }
        },
      });
    }
  },
});
