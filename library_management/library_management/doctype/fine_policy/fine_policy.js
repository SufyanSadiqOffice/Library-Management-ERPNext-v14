// Copyright (c) 2023, SowaanERP and contributors
// For license information, please see license.txt

frappe.ui.form.on("Fine Policy", {
  refresh: function (frm) {
    var user_category_list = [
      "Student",
      "Instructor",
      "Employee",
      "User",
      "RQ Worker",
      "Driver",
    ];
    frm.set_query("user_category", function () {
      return {
        filters: [["DocType", "name", "in", user_category_list]],
      };
    });
  },
});
