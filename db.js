/*!
**  bauer-db -- Modern API for SQL databases.
**  Copyright (c) 2014 Yuri Neves Silveira <http://yneves.com>
**  Licensed under The MIT License <http://opensource.org/licenses/MIT>
**  Distributed on <http://github.com/yneves/node-bauer-db>
*/
// - -------------------------------------------------------------------- - //
// - exports

var sql = require("./lib/sql.js");
var Local = require("./lib/local.js");
var Remote = require("./lib/remote.js");
var Server = require("./lib/server.js");
var Database = require("./lib/database.js");

exports = {};

exports.local = function() { return new Local() }
exports.remote = function() { return new Remote() }
exports.server = function() { return new Server() }
exports.database = function() { return new Database() }

exports.drop = function(db) { return new sql.Drop(db) }
exports.alter = function(db) { return new sql.Alter(db) }
exports.create = function(db) { return new sql.Create(db) }
exports.update = function(db) { return new sql.Update(db) }
exports.insert = function(db) { return new sql.Insert(db) }
exports.delete = function(db) { return new sql.Delete(db) }
exports.select = function(db) { return new sql.Select(db) }

exports.cls = {};

exports.cls.Local = Local;
exports.cls.Remote = Remote;
exports.cls.Server = Server;
exports.cls.Database = Database;

exports.cls.Drop = sql.Drop;
exports.cls.Alter = sql.Alter;
exports.cls.Create = sql.Create;
exports.cls.Insert = sql.Insert;
exports.cls.Update = sql.Update;
exports.cls.Delete = sql.Delete;
exports.cls.Select = sql.Select;

module.exports = exports;

// - -------------------------------------------------------------------- - //
