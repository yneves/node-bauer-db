/*!
**  bauer-db -- Modern API for SQL databases.
**  Copyright (c) 2014 Yuri Neves Silveira <http://yneves.com>
**  Licensed under The MIT License <http://opensource.org/licenses/MIT>
**  Distributed on <http://github.com/yneves/node-bauer-db>
*/
// - -------------------------------------------------------------------- - //
// - exports

exports = {};

exports.mysql = function(config) {
  var MySQL = require("./lib/driver/mysql.js");
  return new MySQL(config);
};

exports.sqlite3 = function(config) {
  var SQLite3 = require("./lib/driver/sqlite3.js");
  return new SQLite3(config);
};

exports.pgsql = function(config) {
  var PostgreSQL = require("./lib/driver/postgresql.js");
  return new PostgreSQL(config);
};

exports.cls = {};
exports.cls.Database = require("./lib/database.js");

module.exports = exports;

// - -------------------------------------------------------------------- - //
