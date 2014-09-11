/*!
**  bauer-db -- Modern API for SQL databases.
**  Copyright (c) 2014 Yuri Neves Silveira <http://yneves.com>
**  Licensed under The MIT License <http://opensource.org/licenses/MIT>
**  Distributed on <http://github.com/yneves/node-bauer-db>
*/
// - -------------------------------------------------------------------- - //
// - libs

var lib = {
  mysql: require("mysql"),
  factory: require("bauer-factory"),
};

// - -------------------------------------------------------------------- - //

// @Database
var Database = require("../database.js");

// - -------------------------------------------------------------------- - //

// @MySQL
var MySQL = lib.factory.class({

  // @inherits
  inherits: Database,

  // @constructor
  constructor: function() {
    this.configure({ type: "mysql" });
  },

// - -------------------------------------------------------------------- - //

  // ._open(callback)
  _open: function(callback) {
    this.mysql = lib.mysql.createConnection(this.config);
    this.mysql.connect(callback.bind(this));
  },

  // ._close(callback)
  _close: function(callback) {
    if (this.mysql) {
      this.mysql.end(callback.bind(this));
    } else {
      callback.call(this,new Error("not connected"));
    }
  },

// - -------------------------------------------------------------------- - //

  // ._query(options,callback)
  _query: function(options,callback) {
    this.mysql.query(options.text,options.args,function(error,result) {
      if (error) {
        callback(error);
      } else {
        var normalized = {};
        var type = lib.factory.type(result);
        if (type === "array") {
          normalized.rows = result;
        } else if (type === "object") {
          if (result.changedRows) {
            normalized.changed = result.changedRows;
          }
          if (result.affectedRows) {
            normalized.affected = result.affectedRows;
          }
          if (result.insertId) {
            normalized.id = result.insertId;
          }
        }
        callback(null,normalized);
      }
    });
  },

});

// - -------------------------------------------------------------------- - //
// - exports

exports = MySQL;
module.exports = exports;

// - -------------------------------------------------------------------- - //
