/*!
**  bauer-db -- Modern API for SQL databases.
**  Copyright (c) 2014 Yuri Neves Silveira <http://yneves.com>
**  Licensed under The MIT License <http://opensource.org/licenses/MIT>
**  Distributed on <http://github.com/yneves/node-bauer-db>
*/
// - -------------------------------------------------------------------- - //
// - libs

var lib = {
  sqlite3: require("sqlite3"),
  factory: require("bauer-factory"),
};

// - -------------------------------------------------------------------- - //

// @Database
var Database = require("../database.js");

// - -------------------------------------------------------------------- - //

// @SQLite3
var SQLite3 = lib.factory.class({

  // @inherits
  inherits: Database,

  // @constructor
  constructor: function() {
    this.configure({ type: "sqlite3" });
  },

// - -------------------------------------------------------------------- - //

  // ._open(callback)
  _open: function(callback) {
    var database = this.config.database || ":memory:";
    var SQLiteDB = lib.sqlite3.Database;
    this.sqlite3 = new SQLiteDB(database,callback.bind(this));
    return this;
  },

  // ._close(callback)
  _close: function(callback) {
    if (this.sqlite3) {
      this.sqlite3.close(callback.bind(this));
    } else {
      callback.call(this,new Error("not connected"));
    }
  },

// - -------------------------------------------------------------------- - //

  // .serialize()
  serialize: function() {
    this.sqlite3.serialize();
    return this;
  },

  // .parallelize()
  parallelize: function() {
    this.sqlite3.parallelize();
    return this;
  },

// - -------------------------------------------------------------------- - //

  // ._query(options,callback)
  _query: function(options,callback) {
    if (options.type === "select") {
      this.sqlite3.all(options.text,options.args,function(error,rows) {
        if (error) {
          callback(error);
        } else {
          callback(null,{ rows: rows });
        }
      });
    } else {
      this.sqlite3.run(options.text,options.args,function(error,result) {
        if (error) {
          callback(error);
        } else {
          var normalized = {};
          if (result.lastID) {
            normalized.id = result.lastID;
          } else if (result.changes) {
            normalized.changed = result.changed;
          }
          callback(null,normalized);
        }
      });
    }
  },

});

// - -------------------------------------------------------------------- - //
// - exports

exports = SQLite3;
module.exports = exports;

// - -------------------------------------------------------------------- - //
