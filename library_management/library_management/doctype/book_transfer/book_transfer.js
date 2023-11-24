// Copyright (c) 2023, SowaanERP and contributors
// For license information, please see license.txt

frappe.ui.form.on("Book Transfer", {
  refresh: function (frm) {
    if (frm.doc.docstatus === 1) {
      frm.add_custom_button(__("View Movement Ledger"), function () {
        frappe.route_options = {
          source_library: frm.doc.source_library,
          target_library: frm.doc.library,
          book: frm.doc.book,
          type: frm.doc.purpose,
          copies: frm.doc.number_of_copies,
        };
        frappe.set_route("List", "Book Movement Ledger");
      });
    }
    // console.log(frm.doc.docstatus);
  },

  validate: function (frm) {
    if (frm.doc.number_of_copies <= 0) {
      frappe.throw(__("Number of copies cannot be less than 0."));
    } else if (frm.doc.number_of_copies > frm.doc.copies_available) {
      frappe.throw(
        __("Number of copies cannot be greater than copies available.")
      );
    }
  },

  purpose: async function (frm) {
    if (frm.doc.book != null) {
      frm.trigger("calculation");
      frm.trigger("book");
    }
  },

  source_library: async function (frm) {
    // console.log(frm.doc.book);

    // if (frm.doc.book != null && frm.doc.book != "") {
    frm.trigger("calculation");
    // }
    if (frm.doc.book == null || frm.doc.book == "") {
      var keyValueArray = [];
      var books = [];
      await frappe.call({
        method: "frappe.client.get_list",
        args: {
          doctype: "Book Movement Ledger",
          filters: {
            target_library: frm.doc.source_library,
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
            source_library: frm.doc.source_library,
            type: "Library to Library",
          },
          fields: ["*"], // Replace with the fields you want to fetch
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
    }
    if (frm.doc.source_library == null || frm.doc.source_library == "") {
      frm.set_value("book", "");
      frm.set_query("book", function () {
        return null;
      });
    }
  },

  target_library: function (frm) {
    if (frm.doc.book != null) frm.trigger("calculation");
  },

  book: async function (frm) {
    frm.trigger("calculation");

    if (
      frm.doc.purpose == "Library to Library" &&
      (frm.doc.source_library == null || frm.doc.source_library == "") &&
      frm.doc.book != null &&
      frm.doc.book != ""
    ) {
      var keyValueArray = [];
      var libraries = [];
      await frappe.call({
        method: "frappe.client.get_list",
        args: {
          doctype: "Book Movement Ledger",
          filters: {
            book: frm.doc.book,
            type: ["in", ["Main to Library", "Library to Library"]],
          },
          fields: ["*"],
          order_by: "creation desc",
        },
        callback: function (response) {
          for (let i = 0; i < response.message.length; i++) {
            const e = response.message[i];
            var existingEntry = keyValueArray.find(function (entry) {
              return entry.key === e.target_library;
            });
            if (existingEntry) {
              existingEntry.value += e.copies;
            } else {
              keyValueArray.push({ key: e.target_library, value: e.copies });
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
            book: frm.doc.book,
            type: "Library to Library",
          },
          fields: ["*"], // Replace with the fields you want to fetch
          order_by: "creation desc",
        },
        callback: function (response) {
          for (let i = 0; i < response.message.length; i++) {
            const e = response.message[i];
            var existingEntry = keyValueArray.find(function (entry) {
              return entry.key === e.source_library;
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
        libraries.push(filteredKeyValueArray[i].key);
      }
      // frm.set_value("source_library", "");
      frm.set_query("source_library", function () {
        return {
          filters: [["Library", "name", "in", libraries]],
        };
      });
    }

    if (frm.doc.book == null || frm.doc.book == "") {
      frm.set_value("source_library", "");
      frm.set_query("source_library", function () {
        return null;
      });
    }
  },

  library: function (frm) {
    var libraries = [];
    frappe.call({
      method: "frappe.client.get_list",
      args: {
        doctype: "Rack",
        filters: {
          library: frm.doc.library,
        },
        fields: ["library"], // Replace with the fields you want to fetch
        order_by: "creation desc",
      },
      callback: function (response) {
        for (let i = 0; i < response.message.length; i++) {
          const e = response.message[i];
          libraries.push(e.library);
        }
        frm.set_value("target_rack", "");
        frm.set_query("target_rack", function () {
          return {
            filters: [["Rack", "library", "in", libraries]],
          };
        });
      },
      error: function (xhr, status, error) {
        console.error("Error:", error);
      },
    });
  },

  target_rack: function (frm) {
    var target_racks = [];
    frappe.call({
      method: "frappe.client.get_list",
      args: {
        doctype: "Shelve",
        filters: {
          rack: frm.doc.target_rack,
        },
        fields: ["rack"], // Replace with the fields you want to fetch
        order_by: "creation desc",
      },
      callback: function (response) {
        for (let i = 0; i < response.message.length; i++) {
          const e = response.message[i];
          target_racks.push(e.rack);
        }
        frm.set_value("target_shelf", "");
        frm.set_query("target_shelf", function () {
          return {
            filters: [["Shelve", "rack", "in", target_racks]],
          };
        });
      },
      error: function (xhr, status, error) {
        console.error("Error:", error);
      },
    });
  },

  source_rack: async function (frm) {
    var doc = frm.doc;
    var source_copies = 0;
    var target_copies = 0;
    if (doc.source_rack) {
      await frappe.call({
        method: "frappe.client.get_list",
        args: {
          doctype: "Book Movement Ledger",
          filters: {
            target_library: doc.source_library,
            book: doc.book,
            target_rack: doc.source_rack,
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
            source_library: doc.source_library,
            book: doc.book,
            source_rack: doc.source_rack,
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

    frm.trigger("set_source_shelf");
  },

  calculation: async function (frm) {
    var doc = frm.doc;
    var source_copies = 0;
    var target_copies = 0;
    var racks = [];
    if (doc.docstatus !== 1) {
      if (doc.purpose === "Main to Library" && doc.book != null) {
        await frappe.call({
          method: "frappe.client.get",
          args: {
            doctype: "Book",
            name: frm.doc.book,
          },
          callback: function (response) {
            // Here, "response" will contain the fetched document object
            if (response.message) {
              frm.set_value(
                "copies_available",
                response.message.copies_available
              );
            } else {
              console.log("Document not found.");
            }
          },
          error: function (xhr, status, error) {
            console.error("Error:", error);
          },
        });
      } else if (doc.purpose === "Library to Library" && doc.book !== null) {
        var keyValueArray = [];
        await frappe.call({
          method: "frappe.client.get_list",
          args: {
            doctype: "Book Movement Ledger",
            filters: {
              target_library: doc.source_library,
              book: doc.book,
            },
            fields: ["*"], // Replace with the fields you want to fetch
            order_by: "creation desc",
          },
          callback: function (response) {
            for (let i = 0; i < response.message.length; i++) {
              const e = response.message[i];
              var existingEntry = keyValueArray.find(function (entry) {
                return entry.key === e.target_rack;
              });
              if (existingEntry) {
                existingEntry.value += e.copies;
              } else {
                keyValueArray.push({ key: e.target_rack, value: e.copies });
              }
              source_copies += e.copies;
              // racks.push(e.target_rack);
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
              source_library: doc.source_library,
              book: doc.book,
            },
            fields: ["*"], // Replace with the fields you want to fetch
            order_by: "creation desc",
          },
          callback: function (response) {
            for (let i = 0; i < response.message.length; i++) {
              const e = response.message[i];
              var existingEntry = keyValueArray.find(function (entry) {
                return entry.key === e.source_rack;
              });
              if (existingEntry) {
                existingEntry.value -= e.copies;
              }
              target_copies += e.copies;
              // racks.push(e.source_rack);
            }
          },
          error: function (xhr, status, error) {
            console.error("Error:", error);
          },
        });
        var total_copies = source_copies - target_copies;
        var filteredKeyValueArray = keyValueArray.filter(function (pair) {
          return pair.value > 0;
        });

        for (var i = 0; i < filteredKeyValueArray.length; i++) {
          // console.log(filteredKeyValueArray[i].key + "___________" + filteredKeyValueArray[i].value);
          racks.push(filteredKeyValueArray[i].key);
        }
        frm.set_value("copies_available", total_copies);
        if (!racks.includes(frm.doc.source_rack)) {
          frm.set_value("source_rack", "");
          frm.set_query("source_rack", function () {
            return {
              filters: [["Rack", "name", "in", racks]],
            };
          });
        } else {
          frm.set_query("source_rack", function () {
            return {
              filters: [["Rack", "name", "in", racks]],
            };
          });
        }
      }
    }
  },

  set_source_shelf: async function (frm) {
    var keyValueArray = [];
    var shelf = [];
    await frappe.call({
      method: "frappe.client.get_list",
      args: {
        doctype: "Book Movement Ledger",
        filters: {
          target_library: frm.doc.source_library,
          target_rack: frm.doc.source_rack,
          book: frm.doc.book,
        },
        fields: ["*"], // Replace with the fields you want to fetch
        order_by: "creation desc",
      },
      callback: function (response) {
        for (let i = 0; i < response.message.length; i++) {
          const e = response.message[i];
          var existingEntry = keyValueArray.find(function (entry) {
            return entry.key === e.target_shelf;
          });
          if (existingEntry) {
            existingEntry.value += e.copies;
          } else {
            keyValueArray.push({ key: e.target_shelf, value: e.copies });
          }
          // source_copies += e.copies;
          // shelf.push(e.target_shelf);
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
          source_library: frm.doc.source_library,
          source_rack: frm.doc.source_rack,
          book: frm.doc.book,
        },
        fields: ["*"], // Replace with the fields you want to fetch
        order_by: "creation desc",
      },
      callback: function (response) {
        for (let i = 0; i < response.message.length; i++) {
          const e = response.message[i];
          var existingEntry = keyValueArray.find(function (entry) {
            return entry.key === e.source_shelf;
          });
          if (existingEntry) {
            existingEntry.value -= e.copies;
          }
          // source_copies += e.copies;
          // shelf.push(e.target_shelf);
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
      shelf.push(filteredKeyValueArray[i].key);
    }

    if (!shelf.includes(frm.doc.source_shelf)) {
      frm.set_value("source_shelf", "");
      frm.set_query("source_shelf", function () {
        return {
          filters: [["Shelve", "name", "in", shelf]],
        };
      });
    } else {
      frm.set_query("source_shelf", function () {
        return {
          filters: [["Shelve", "name", "in", shelf]],
        };
      });
    }
  },

  source_shelf: async function (frm) {
    // FUNCTION FOR AVAILABLE COPIES ACC TO SHELF

    if (
      frm.doc.book != null &&
      frm.doc.source_library != null &&
      frm.doc.source_rack != null
    ) {
      var doc = frm.doc;
      var source_copies = 0;
      var target_copies = 0;
      if (doc.docstatus !== 1) {
        if (doc.purpose === "Library to Library") {
          await frappe.call({
            method: "frappe.client.get_list",
            args: {
              doctype: "Book Movement Ledger",
              filters: {
                target_library: doc.source_library,
                target_rack: doc.source_rack,
                target_shelf: doc.source_shelf,
                book: doc.book,
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
                source_library: doc.source_library,
                source_rack: doc.source_rack,
                source_shelf: doc.source_shelf,
                book: doc.book,
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
          console.log("Shelf");
          console.log(total_copies);
        }
      }
    }
  },

  onload: function (frm) {
    if (
      frm.doc.purpose == "Main to Library" &&
      frm.doc.docstatus != 1 &&
      frm.doc.docstatus != 2
      // && frm.doc.__unsaved == 1
    ) {
      if (frm.doc.book != null) {
        frm.trigger("book");
      }
      if (frm.doc.library != null) {
        frm.trigger("library_1");
      }
      if (frm.doc.target_rack != null) {
        frm.trigger("target_rack_1");
      }
    }

    if (
      frm.doc.purpose == "Library to Library" &&
      frm.doc.docstatus != 1 &&
      frm.doc.docstatus != 2
    ) {
      if (frm.doc.book != null) {
        frm.trigger("book_2");
      }
      if (frm.doc.source_library != null) {
        frm.trigger("source_library_2");
      }
      if (frm.doc.source_rack != null) {
        frm.trigger("source_rack_2");
      }
      if (frm.doc.source_shelf != null) {
        frm.trigger("source_shelf_2");
      }
      if (frm.doc.library != null) {
        frm.trigger("library_1");
      }
      if (frm.doc.target_rack != null) {
        frm.trigger("target_rack_1");
      }
    }
  },

  // All below functions are created for 'Duplicate Issue'. And all these functions are called in 'onload' function.

  // The Duplicate Issue :
  //         Field Functions are not triggering while duplicating a doc.

  library_1: function (frm) {
    var libraries = [];
    frappe.call({
      method: "frappe.client.get_list",
      args: {
        doctype: "Rack",
        filters: {
          library: frm.doc.library,
        },
        fields: ["library"], // Replace with the fields you want to fetch
        order_by: "creation desc",
      },
      callback: function (response) {
        for (let i = 0; i < response.message.length; i++) {
          const e = response.message[i];
          libraries.push(e.library);
        }
        // frm.set_value("target_rack", "");
        frm.set_query("target_rack", function () {
          return {
            filters: [["Rack", "library", "in", libraries]],
          };
        });
      },
      error: function (xhr, status, error) {
        console.error("Error:", error);
      },
    });
  },

  target_rack_1: function (frm) {
    var target_racks = [];
    frappe.call({
      method: "frappe.client.get_list",
      args: {
        doctype: "Shelve",
        filters: {
          rack: frm.doc.target_rack,
        },
        fields: ["rack"], // Replace with the fields you want to fetch
        order_by: "creation desc",
      },
      callback: function (response) {
        for (let i = 0; i < response.message.length; i++) {
          const e = response.message[i];
          target_racks.push(e.rack);
        }
        // frm.set_value("target_shelf", "");
        frm.set_query("target_shelf", function () {
          return {
            filters: [["Shelve", "rack", "in", target_racks]],
          };
        });
      },
      error: function (xhr, status, error) {
        console.error("Error:", error);
      },
    });
  },

  book_2: async function (frm) {
    // frm.trigger("calculation");

    if (frm.doc.source_library != null || frm.doc.source_library != "") {
      var keyValueArray = [];
      var libraries = [];
      await frappe.call({
        method: "frappe.client.get_list",
        args: {
          doctype: "Book Movement Ledger",
          filters: {
            book: frm.doc.book,
            type: ["in", ["Main to Library", "Library to Library"]],
          },
          fields: ["*"],
          order_by: "creation desc",
        },
        callback: function (response) {
          for (let i = 0; i < response.message.length; i++) {
            const e = response.message[i];
            var existingEntry = keyValueArray.find(function (entry) {
              return entry.key === e.target_library;
            });
            if (existingEntry) {
              existingEntry.value += e.copies;
            } else {
              keyValueArray.push({ key: e.target_library, value: e.copies });
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
            book: frm.doc.book,
            type: "Library to Library",
          },
          fields: ["*"], // Replace with the fields you want to fetch
          order_by: "creation desc",
        },
        callback: function (response) {
          for (let i = 0; i < response.message.length; i++) {
            const e = response.message[i];
            var existingEntry = keyValueArray.find(function (entry) {
              return entry.key === e.source_library;
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
        libraries.push(filteredKeyValueArray[i].key);
      }

      if (!libraries.includes(frm.doc.source_library)) {
        // frm.set_value("source_library", "");
        frm.set_query("source_library", function () {
          return {
            filters: [["Library", "name", "in", libraries]],
          };
        });
      } else {
        frm.set_query("source_library", function () {
          return {
            filters: [["Library", "name", "in", libraries]],
          };
        });
      }
    }

    if (frm.doc.book == null || frm.doc.book == "") {
      frm.set_value("source_library", "");
      frm.set_query("source_library", function () {
        return null;
      });
    }
  },

  source_library_2: async function (frm) {
    // console.log(frm.doc.book);

    // if (frm.doc.book != null && frm.doc.book != "") {
    // frm.trigger("calculation");
    // }

    var keyValueArray = [];
    var books = [];
    await frappe.call({
      method: "frappe.client.get_list",
      args: {
        doctype: "Book Movement Ledger",
        filters: {
          target_library: frm.doc.source_library,
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
          source_library: frm.doc.source_library,
          type: "Library to Library",
        },
        fields: ["*"], // Replace with the fields you want to fetch
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

    if (!books.includes(frm.doc.book)) {
      // frm.set_value("book", "");
      frm.set_query("book", function () {
        return {
          filters: [["Book", "name", "in", books]],
        };
      });
    } else {
      frm.set_query("book", function () {
        return {
          filters: [["Book", "name", "in", books]],
        };
      });
    }
  },

  source_rack_2: async function (frm) {
    // var doc = frm.doc;
    // var source_copies = 0;
    // var target_copies = 0;
    // if (doc.source_rack) {
    //   await frappe.call({
    //     method: "frappe.client.get_list",
    //     args: {
    //       doctype: "Book Movement Ledger",
    //       filters: {
    //         target_library: doc.source_library,
    //         book: doc.book,
    //         target_rack: doc.source_rack,
    //       },
    //       fields: ["*"], // Replace with the fields you want to fetch
    //       order_by: "creation desc",
    //     },
    //     callback: function (response) {
    //       for (let i = 0; i < response.message.length; i++) {
    //         const e = response.message[i];
    //         source_copies += e.copies;
    //       }
    //     },
    //     error: function (xhr, status, error) {
    //       console.error("Error:", error);
    //     },
    //   });
    //   await frappe.call({
    //     method: "frappe.client.get_list",
    //     args: {
    //       doctype: "Book Movement Ledger",
    //       filters: {
    //         source_library: doc.source_library,
    //         book: doc.book,
    //         source_rack: doc.source_rack,
    //       },
    //       fields: ["*"], // Replace with the fields you want to fetch
    //       order_by: "creation desc",
    //     },
    //     callback: function (response) {
    //       for (let i = 0; i < response.message.length; i++) {
    //         const e = response.message[i];
    //         target_copies += e.copies;
    //       }
    //     },
    //     error: function (xhr, status, error) {
    //       console.error("Error:", error);
    //     },
    //   });
    //   var total_copies = source_copies - target_copies;
    //   frm.set_value("copies_available", total_copies);
    //   console.log("Rack");
    //   console.log(total_copies);
    // }

    frm.trigger("set_source_shelf_2");
  },

  source_shelf_2: async function (frm) {
    // FUNCTION FOR AVAILABLE COPIES ACC TO SHELF

    if (
      frm.doc.book != null &&
      frm.doc.source_library != null &&
      frm.doc.source_rack != null
    ) {
      var doc = frm.doc;
      var source_copies = 0;
      var target_copies = 0;
      if (doc.docstatus !== 1) {
        if (doc.purpose === "Library to Library") {
          await frappe.call({
            method: "frappe.client.get_list",
            args: {
              doctype: "Book Movement Ledger",
              filters: {
                target_library: doc.source_library,
                target_rack: doc.source_rack,
                target_shelf: doc.source_shelf,
                book: doc.book,
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
                source_library: doc.source_library,
                source_rack: doc.source_rack,
                source_shelf: doc.source_shelf,
                book: doc.book,
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
          // console.log("Shelf");
          // console.log(total_copies);
        }
      }
    }
  },

  set_source_shelf_2: async function (frm) {
    var keyValueArray = [];
    var shelf = [];
    await frappe.call({
      method: "frappe.client.get_list",
      args: {
        doctype: "Book Movement Ledger",
        filters: {
          target_library: frm.doc.source_library,
          target_rack: frm.doc.source_rack,
          book: frm.doc.book,
        },
        fields: ["*"], // Replace with the fields you want to fetch
        order_by: "creation desc",
      },
      callback: function (response) {
        for (let i = 0; i < response.message.length; i++) {
          const e = response.message[i];
          var existingEntry = keyValueArray.find(function (entry) {
            return entry.key === e.target_shelf;
          });
          if (existingEntry) {
            existingEntry.value += e.copies;
          } else {
            keyValueArray.push({ key: e.target_shelf, value: e.copies });
          }
          // source_copies += e.copies;
          // shelf.push(e.target_shelf);
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
          source_library: frm.doc.source_library,
          source_rack: frm.doc.source_rack,
          book: frm.doc.book,
        },
        fields: ["*"], // Replace with the fields you want to fetch
        order_by: "creation desc",
      },
      callback: function (response) {
        for (let i = 0; i < response.message.length; i++) {
          const e = response.message[i];
          var existingEntry = keyValueArray.find(function (entry) {
            return entry.key === e.source_shelf;
          });
          if (existingEntry) {
            existingEntry.value -= e.copies;
          }
          // source_copies += e.copies;
          // shelf.push(e.target_shelf);
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
      shelf.push(filteredKeyValueArray[i].key);
    }

    if (!shelf.includes(frm.doc.source_shelf)) {
      // frm.set_value("source_shelf", "");
      frm.set_query("source_shelf", function () {
        return {
          filters: [["Shelve", "name", "in", shelf]],
        };
      });
    } else {
      frm.set_query("source_shelf", function () {
        return {
          filters: [["Shelve", "name", "in", shelf]],
        };
      });
    }
  },
});
