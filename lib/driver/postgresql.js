/*!
**  bauer-db -- Modern API for SQL databases.
**  Copyright (c) 2014 Yuri Neves Silveira <http://yneves.com>
**  Licensed under The MIT License <http://opensource.org/licenses/MIT>
**  Distributed on <http://github.com/yneves/node-bauer-db>
*/
// - -------------------------------------------------------------------- - //
// - libs

var lib = {
  pg: require("pg.js"),
  factory: require("bauer-factory"),
};

// - -------------------------------------------------------------------- - //

// @Database
var Database = require("../database.js");

// - -------------------------------------------------------------------- - //

// @PostgreSQL
var PostgreSQL = lib.factory.class({

  // @inherits
  inherits: Database,

  // @constructor
  constructor: function() {
    this.configure({ type: "postgresql" });
  },

// - -------------------------------------------------------------------- - //

  // ._open(callback)
  _open: function(callback) {
    this.pgsql = new lib.pg.Client(this.config)
    this.pgsql.connect(callback.bind(this));
  },

  // ._close(callback)
  _close: function(callback) {
    if (this.pgsql) {
      // this.pg.end(callback.bind(this));
    } else {
      callback.call(this,new Error("not connected"));
    }
  },

// - -------------------------------------------------------------------- - //

  // ._query(options,callback)
  _query: function(options,callback) {
    this.pgsql.query(options.text,options.args,function(error,result) {
      if (error) {
        callback(error);
      } else {
        var normalized = {};
        if (lib.factory.isObject(result)) {
          if (lib.factory.isArray(result.rows)) {
            normalized.rows = result.rows;
          }
          if (lib.factory.isNumber(result.rowCount)) {
            normalized.affected = result.affectedRows;
          }
        }
        callback(null,normalized);
      }
    });
  },

});

// - -------------------------------------------------------------------- - //
// - exports

exports = PostgreSQL;
module.exports = exports;

// - -------------------------------------------------------------------- - //
