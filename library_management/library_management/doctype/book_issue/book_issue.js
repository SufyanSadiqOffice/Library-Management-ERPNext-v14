// Copyright (c) 2023, SowaanERP and contributors
// For license information, please see license.txt

frappe.ui.form.on("Book Issue", {
  refresh: async function (frm) {
    if (frm.doc.docstatus === 1) {
      frm.add_custom_button(__("Book Return"), function () {
        var name = frm.doc.name;
        // frappe.route_options = {
        //   book_issue: frm.doc.name,
        // };
        // console.log(frappe.route_options  );
        frappe.set_route("Form", "Book Return", "new-book-return-1");
        frappe.ui.form.on("Book Return", {
          refresh: function (frm) {
            // Set field values
            frm.set_value("book_issue", name);
            // You can set more field values here
          },

          after_save: function (frm) {
            location.reload();
          },
        });
      });

      frm.add_custom_button(__("View Movement Ledger"), function () {
        frappe.route_options = {
          type: "Book Issue",
          source_library: frm.doc.library,
          book: frm.doc.book,
          book_issued_to: frm.doc.issue_to,
        };
        frappe.set_route("List", "Book Movement Ledger");
      });
    }

    if (frm.doc.user_category == null || frm.doc.user_category != "") {
      var user_category_list = [];
      await frappe.call({
        method: "frappe.client.get_list",
        args: {
          doctype: "Fine Policy",
          // filters: {
          //   target_library: frm.doc.library,
          //   type: ["in", ["Main to Library", "Library to Library"]],
          // },
          fields: ["name"],
          // order_by: "creation desc",
        },
        callback: function (response) {
          for (let i = 0; i < response.message.length; i++) {
            const e = response.message[i];
            user_category_list.push(e.name);
          }
        },
        error: function (xhr, status, error) {
          console.error("Error:", error);
        },
      });
      // frm.set_value("issue_to", "");
      frm.set_query("user_category", function () {
        return {
          filters: [["DocType", "name", "in", user_category_list]],
        };
      });
    }
  },

  library: async function (frm) {
    var keyValueArray = [];
    var books = [];
    await frappe.call({
      method: "frappe.client.get_list",
      args: {
        doctype: "Book Movement Ledger",
        filters: {
          target_library: frm.doc.library,
          type: ["in", ["Main to Library", "Library to Library"]],
        },
        fields: ["*"],
        order_by: "creation desc",
      },
      callback: function (response) {
        for (let i = 0; i < response.message.length; i++) {
          const e = response.message[i];

          var existingEntry = keyValueArray.find(function (entry) {
            return entry.key === e.book;
          });

          if (existingEntry) {
            existingEntry.value += e.copies;
          } else {
            keyValueArray.push({ key: e.book, value: e.copies });
          }
        }
      },
      error: function (xhr, status, error) {
        console.error("Error:", error);
      },
    });

    await frappe.call({
      method: "frappe.client.get_list",
      args: {
        doctype: "Book Movement Ledger",
        filters: {
          source_library: frm.doc.library,
          type: "Library to Library",
        },
        fields: ["*"],
        order_by: "creation desc",
      },
      callback: function (response) {
        for (let i = 0; i < response.message.length; i++) {
          const e = response.message[i];
          var existingEntry = keyValueArray.find(function (entry) {
            return entry.key === e.book;
          });
          if (existingEntry) {
            existingEntry.value -= e.copies;
          }
        }
      },
      error: function (xhr, status, error) {
        console.error("Error:", error);
      },
    });

    var filteredKeyValueArray = keyValueArray.filter(function (pair) {
      return pair.value > 0;
    });

    for (var i = 0; i < filteredKeyValueArray.length; i++) {
      // console.log(filteredKeyValueArray[i].key + "___________" + filteredKeyValueArray[i].value);
      books.push(filteredKeyValueArray[i].key);
    }
    // frm.set_value("book", "");
    frm.set_query("book", function () {
      return {
        filters: [["Book", "name", "in", books]],
      };
    });

    // if (frm.doc.library != null) {
    //   await frappe.call({
    //     method: "frappe.client.get_list",
    //     args: {
    //       doctype: "Book Movement Ledger",
    //       filters: {
    //         target_library: frm.doc.library, // source_library
    //       },
    //       fields: ["book"], // Replace with the fields you want to fetch
    //       order_by: "creation desc",
    //     },
    //     callback: function (response) {
    //       for (let i = 0; i < response.message.length; i++) {
    //         const e = response.message[i];
    //         books.push(e.book);
    //       }
    //     },
    //     error: function (xhr, status, error) {
    //       console.error("Error:", error);
    //     },
    //   });
    //   frm.set_value("book", "");
    //   frm.set_query("book", function () {
    //     return {
    //       filters: [["Book", "name", "in", books]],
    //     };
    //   });
    // }
  },

  rack: async function (frm) {
    var doc = frm.doc;
    var source_copies = 0;
    var target_copies = 0;
    if (doc.rack) {
      await frappe.call({
        method: "frappe.client.get_list",
        args: {
          doctype: "Book Movement Ledger",
          filters: {
            target_library: doc.library,
            book: doc.book,
            target_rack: doc.rack,
          },
          fields: ["*"], // Replace with the fields you want to fetch
          order_by: "creation desc",
        },
        callback: function (response) {
          for (let i = 0; i < response.message.length; i++) {
            const e = response.message[i];
            source_copies += e.copies;
          }
        },
        error: function (xhr, status, error) {
          console.error("Error:", error);
        },
      });
      await frappe.call({
        method: "frappe.client.get_list",
        args: {
          doctype: "Book Movement Ledger",
          filters: {
            source_library: doc.library,
            book: doc.book,
            source_rack: doc.rack,
          },
          fields: ["*"], // Replace with the fields you want to fetch
          order_by: "creation desc",
        },
        callback: function (response) {
          for (let i = 0; i < response.message.length; i++) {
            const e = response.message[i];
            target_copies += e.copies;
          }
        },
        error: function (xhr, status, error) {
          console.error("Error:", error);
        },
      });
      var total_copies = source_copies - target_copies;
      frm.set_value("copies_available", total_copies);
    }

    frm.trigger("set_shelf");
  },

  shelf: async function (frm) {
    var doc = frm.doc;
    var source_copies = 0;
    var target_copies = 0;
    if (doc.shelf) {
      await frappe.call({
        method: "frappe.client.get_list",
        args: {
          doctype: "Book Movement Ledger",
          filters: {
            target_library: doc.library,
            book: doc.book,
            target_rack: doc.rack,
            target_shelf: doc.shelf,
          },
          fields: ["*"], // Replace with the fields you want to fetch
          order_by: "creation desc",
        },
        callback: function (response) {
          for (let i = 0; i < response.message.length; i++) {
            const e = response.message[i];
            source_copies += e.copies;
          }
        },
        error: function (xhr, status, error) {
          console.error("Error:", error);
        },
      });
      await frappe.call({
        method: "frappe.client.get_list",
        args: {
          doctype: "Book Movement Ledger",
          filters: {
            source_library: doc.library,
            book: doc.book,
            source_rack: doc.rack,
            source_shelf: doc.shelf,
          },
          fields: ["*"], // Replace with the fields you want to fetch
          order_by: "creation desc",
        },
        callback: function (response) {
          for (let i = 0; i < response.message.length; i++) {
            const e = response.message[i];
            target_copies += e.copies;
          }
        },
        error: function (xhr, status, error) {
          console.error("Error:", error);
        },
      });
      var total_copies = source_copies - target_copies;
      frm.set_value("copies_available", total_copies);
    }
  },

  book: function (frm) {
    frm.trigger("calculation");
  },

  calculation: async function (frm) {
    var source_copies = 0;
    var target_copies = 0;
    var racks = [];
    if (frm.doc.docstatus !== 1) {
      await frappe.call({
        method: "frappe.client.get_list",
        args: {
          doctype: "Book Movement Ledger",
          filters: {
            target_library: frm.doc.library,
            book: frm.doc.book,
          },
          fields: ["*"], // Replace with the fields you want to fetch
          order_by: "creation desc",
        },
        callback: function (response) {
          for (let i = 0; i < response.message.length; i++) {
            const e = response.message[i];
            source_copies += e.copies;
            racks.push(e.target_rack);
          }
        },
        error: function (xhr, status, error) {
          console.error("Error:", error);
        },
      });
      await frappe.call({
        method: "frappe.client.get_list",
        args: {
          doctype: "Book Movement Ledger",
          filters: {
            source_library: frm.doc.library,
            book: frm.doc.book,
          },
          fields: ["*"], // Replace with the fields you want to fetch
          order_by: "creation desc",
        },
        callback: function (response) {
          for (let i = 0; i < response.message.length; i++) {
            const e = response.message[i];
            target_copies += e.copies;
            racks.push(e.source_rack);
          }
        },
        error: function (xhr, status, error) {
          console.error("Error:", error);
        },
      });
      var total_copies = source_copies - target_copies;
      frm.set_value("copies_available", total_copies);
      frm.set_value("rack", "");
      frm.set_query("rack", function () {
        return {
          filters: [["Rack", "name", "in", racks]],
        };
      });
    }
  },

  set_shelf: async function (frm) {
    var shelf = [];
    if (frm.doc.docstatus !== 1) {
      await frappe.call({
        method: "frappe.client.get_list",
        args: {
          doctype: "Book Movement Ledger",
          filters: {
            target_library: frm.doc.library,
            target_rack: frm.doc.rack,
            book: frm.doc.book,
          },
          fields: ["*"], // Replace with the fields you want to fetch
          order_by: "creation desc",
        },
        callback: function (response) {
          for (let i = 0; i < response.message.length; i++) {
            const e = response.message[i];
            // source_copies += e.copies;
            shelf.push(e.target_shelf);
          }
        },
        error: function (xhr, status, error) {
          console.error("Error:", error);
        },
      });

      if (!shelf.includes(frm.doc.shelf)) {
        frm.set_value("shelf", "");
        frm.set_query("shelf", function () {
          return {
            filters: [["Shelve", "name", "in", shelf]],
          };
        });
      } else {
        frm.set_query("shelf", function () {
          return {
            filters: [["Shelve", "name", "in", shelf]],
          };
        });
      }
    }
  },

  user_category: async function (frm) {
    if (frm.doc.user_category != null && frm.doc.user_category != "") {
      var user_category = frm.doc.user_category;
      var user_category_list = [];
      await frappe.call({
        method: "frappe.client.get_list",
        args: {
          doctype: user_category,
          // filters: {
          //   target_library: frm.doc.library,
          //   type: ["in", ["Main to Library", "Library to Library"]],
          // },
          fields: ["name"],
          // order_by: "creation desc",
        },
        callback: function (response) {
          for (let i = 0; i < response.message.length; i++) {
            const e = response.message[i];
            user_category_list.push(e.name);
          }
        },
        error: function (xhr, status, error) {
          console.error("Error:", error);
        },
      });

      if (!user_category_list.includes(frm.doc.issue_to)) {
        frm.set_value("issue_to", "");
        frm.set_query("issue_to", function () {
          return {
            filters: [[user_category, "name", "in", user_category_list]],
          };
        });
      } else {
        frm.set_query("issue_to", function () {
          return {
            filters: [[user_category, "name", "in", user_category_list]],
          };
        });
      }
    } else if (frm.doc.user_category == null || frm.doc.user_category != "") {
      var user_category_list = [];
      await frappe.call({
        method: "frappe.client.get_list",
        args: {
          doctype: "Fine Policy",
          // filters: {
          //   target_library: frm.doc.library,
          //   type: ["in", ["Main to Library", "Library to Library"]],
          // },
          fields: ["name"],
          // order_by: "creation desc",
        },
        callback: function (response) {
          for (let i = 0; i < response.message.length; i++) {
            const e = response.message[i];
            user_category_list.push(e.name);
          }
        },
        error: function (xhr, status, error) {
          console.error("Error:", error);
        },
      });
      // frm.set_value("issue_to", "");
      frm.set_query("user_category", function () {
        return {
          filters: [["DocType", "name", "in", user_category_list]],
        };
      });
    }
  },

  // set_shelf: async function(frm){
  //   var racks = [];
  //   frappe.call({
  //     method: "frappe.client.get_list",
  //     args: {
  //       doctype: "Shelve",
  //       filters: {
  //         rack: frm.doc.rack,
  //       },
  //       fields: ["rack"], // Replace with the fields you want to fetch
  //       order_by: "creation desc",
  //     },
  //     callback: function (response) {
  //       for (let i = 0; i < response.message.length; i++) {
  //         const e = response.message[i];
  //         racks.push(e.rack);
  //       }
  //       frm.set_value("shelf", "");
  //       frm.set_query("shelf", function () {
  //         return {
  //           filters: [["Shelve", "rack", "in", racks]],
  //         };
  //       });
  //     },
  //     error: function (xhr, status, error) {
  //       console.error("Error:", error);
  //     },
  //   });
  // }

  onload: function (frm) {
    if (frm.doc.docstatus != 1 && frm.doc.docstatus != 2) {
      if (frm.doc.library != null) {
        frm.trigger("library");
      }
      if (frm.doc.book != null) {
        frm.trigger("book_2");
      }
      if (frm.doc.rack != null) {
        frm.trigger("set_shelf");
      }
      if (frm.doc.shelf != null) {
        frm.trigger("shelf");
      }
      if (frm.doc.user_category != null) {
        frm.trigger("user_category");
      }
    }
  },

  book_2: async function (frm) {
    var source_copies = 0;
    var target_copies = 0;
    var racks = [];
    if (frm.doc.docstatus !== 1) {
      await frappe.call({
        method: "frappe.client.get_list",
        args: {
          doctype: "Book Movement Ledger",
          filters: {
            target_library: frm.doc.library,
            book: frm.doc.book,
          },
          fields: ["*"], // Replace with the fields you want to fetch
          order_by: "creation desc",
        },
        callback: function (response) {
          for (let i = 0; i < response.message.length; i++) {
            const e = response.message[i];
            source_copies += e.copies;
            racks.push(e.target_rack);
          }
        },
        error: function (xhr, status, error) {
          console.error("Error:", error);
        },
      });
      await frappe.call({
        method: "frappe.client.get_list",
        args: {
          doctype: "Book Movement Ledger",
          filters: {
            source_library: frm.doc.library,
            book: frm.doc.book,
          },
          fields: ["*"], // Replace with the fields you want to fetch
          order_by: "creation desc",
        },
        callback: function (response) {
          for (let i = 0; i < response.message.length; i++) {
            const e = response.message[i];
            target_copies += e.copies;
            racks.push(e.source_rack);
          }
        },
        error: function (xhr, status, error) {
          console.error("Error:", error);
        },
      });
      var total_copies = source_copies - target_copies;
      // frm.set_value("copies_available", total_copies);
      // frm.set_value("rack", "");
      frm.set_query("rack", function () {
        return {
          filters: [["Rack", "name", "in", racks]],
        };
      });
    }
  },
});
