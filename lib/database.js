/*!
**  bauer-db -- Modern API for SQL databases.
**  Copyright (c) 2014 Yuri Neves Silveira <http://yneves.com>
**  Licensed under The MIT License <http://opensource.org/licenses/MIT>
**  Distributed on <http://github.com/yneves/node-bauer-db>
*/
// - -------------------------------------------------------------------- - //
// - libs

var lib = {
	fs: require("fs"),
	sql: require("./sql.js"),
	promise: require("bauer-promise"),
	factory: require("bauer-factory"),
};

// - -------------------------------------------------------------------- - //

// @Database
var Database = lib.factory.class({

	// @inherits
	inherits: "events.EventEmitter",

	// @constructor
	constructor: function() {
		this.setMaxListeners(99);
		this.ready = false;
	},

// - -------------------------------------------------------------------- - //

	// .when(promises)
	when: function() {
		var deferred = lib.promise.defer(this);
		lib.promise.when.apply(null,arguments).done(deferred,deferred);
		return deferred.promise;
	},

// - -------------------------------------------------------------------- - //

	// .open()
	open: new Error("not implemented"),

	// .close()
	close: new Error("not implemented"),

// - -------------------------------------------------------------------- - //

	// .serialize()
	serialize: new Error("not implemented"),

	// .parallelize()
	parallelize: new Error("not implemented"),

// - -------------------------------------------------------------------- - //

	// .exec()
	exec: new Error("not implemented"),

// - -------------------------------------------------------------------- - //

	// .run()
	run: new Error("not implemented"),

	// .get()
	get: new Error("not implemented"),

	// .all()
	all: new Error("not implemented"),

	// .each()
	each: new Error("not implemented"),

// - -------------------------------------------------------------------- - //

	schema: {

		// .schema()
		0: function() {
			return this.describe().then(function(rows) {
				var schema = new lib.sql.Schema();
				rows.forEach(function(row) {
					if (row.sql) {
						schema.fromSQL(row.sql);
					}
				});
				return schema.toJSON();
			});
		},

		// .schema(json)
		o: function(json) {
			var schema = new lib.sql.Schema();
			schema.fromJSON(json);
			return this.exec(schema.toSQL());
		},

		// .schema(file)
		s: function(file) {
			var db = this;
			var schema = new lib.sql.Schema();
			var deferred = lib.promise.defer(this);
			schema.fromJSON(file,function(error) {
				if (error) {
					deferred.reject(error);
				} else {
					deferred.resolve(db.exec(schema.toSQL()));
				}
			});
			return deferred.promise;
		},

	},

	pragmas: {

		// .pragmas(name)
		s: function(name) {
			return this.get({ text: "PRAGMA " + name, args: [] });
		},

		// .pragmas()
		0: function() {
			var db = this;
			var deferred = lib.promise.defer(this);
			var names = [
				"application_id","auto_vacuum","automatic_index","busy_timeout","cache_size",
				"cache_spill","case_sensitive_like","checkpoint_fullfsync","collation_list",
				"compile_options","database_list","defer_foreign_keys","encoding",
				"foreign_key_check","foreign_key_list","foreign_keys","freelist_count",
				"fullfsync","ignore_check_constraints","incremental_vacuum","index_info",
				"index_list","integrity_check","journal_mode","journal_size_limit",
				"legacy_file_format","locking_mode","max_page_count","mmap_size",
				"page_count","page_size","query_only","quick_check","read_uncommitted",
				"recursive_triggers","reverse_unordered_selects","schema_version","secure_delete",
				"shrink_memory","soft_heap_limit","synchronous","table_info","temp_store",
				"user_version","wal_autocheckpoint","wal_checkpoint","writable_schema",
			];
			var values = {};
			function getPragmaValue() {
				if (names.length > 0) {
					var name = names.shift();
					db.pragmas(name).then(function(result) {
						if (result.row) {
							var keys = Object.keys(result.row);
							if (keys.length == 1) {
								values[name] = result.row[keys[0]];
							} else {
								values[name] = result.row;
							}
						} else {
							values[name] = null;
						}
						getPragmaValue();
					},function(error) {
						deferred.reject(error);
					});
				} else {
					deferred.resolve(values);
				}
			}
			getPragmaValue();
			return deferred.promise;
		},

	},

// - -------------------------------------------------------------------- - //

	// .describe()
	describe: function() {
		return this.select().from("sqlite_master").all();
	},

// - -------------------------------------------------------------------- - //

	// .drop()
	drop: function() { return new lib.sql.Drop(this); },

	// .alter()
	alter: function() { return new lib.sql.Alter(this); },

	// .create()
	create: function() { return new lib.sql.Create(this); },

	// .insert()
	insert: function() { return new lib.sql.Insert(this); },

	// .update()
	update: function() { return new lib.sql.Update(this); },

	// .delete()
	delete: function() { return new lib.sql.Delete(this); },

	// .select()
	select: function() { return new lib.sql.Select(this); },

// - -------------------------------------------------------------------- - //

	// .dropColumn(table,column)
	dropColumn: function(table,column) {
		return this.schema().then(function(schema) {
			var tableDef = schema.tables[table];
			if (tableDef && tableDef.fields[column]) {
			  delete tableDef.fields[column];
			  var fields = Object.keys(tableDef.fields);
			  var temp = "_temp_" + String(Math.random()).replace(/[^0-9]/g,"");
			  return db.create()
			    .table(table + temp)
			    .fields(tableDef.fields)
			    .run()
			    .then(function() {
			      return db.insert()
			        .into(table + temp)
			        .fields(fields)
			        .from(db.select().fields(fields).from(table))
			        .run()
			        .then(function() {
			          return db.drop()
			            .table(table)
			            .run()
			            .then(function() {
			              return db.alter()
			                .table(table + temp)
			                .rename(table)
			                .run();
			            });
			        });
			    });
			}
    });
	},

// - -------------------------------------------------------------------- - //

	// .dump(params)
	dump: new Error("not implemented"),

	// .load(params)
	load: new Error("not implemented"),

	// .randomize(params)
	randomize: new Error("not implemented"),

	// .populate(params)
	populate: new Error("not implemented"),

// - -------------------------------------------------------------------- - //

	// .now()
	now: function() {
		var date = new Date();
		var day = date.getDate();
		var month = date.getMonth() + 1;
		var year = date.getFullYear();
		var hour = date.getHours();
		var minute = date.getMinutes();
		var second = date.getSeconds();
		if (day < 10) day = "0" + day;
		if (month < 10) month = "0" + month;
		if (hour < 10) hour = "0" + hour;
		if (minute < 10) minute = "0" + minute;
		if (second < 10) second = "0" + second;
		return year + "-" + month + "-" + day + " " + hour + ":" + minute + ":" + second;
	},

	// .today()
	today: function() {
		var date = new Date();
		var day = date.getDate();
		var month = date.getMonth() + 1;
		var year = date.getFullYear();
		if (day < 10) day = "0" + day;
		if (month < 10) month = "0" + month;
		return year + "-" + month + "-" + day;
	},

	// .guid()
	guid: function() {
		var uid = "";
		for (var i = 0; i < 8 ; i++) {
			uid += Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
		}
		return uid;
	},

});

// - -------------------------------------------------------------------- - //
// - exports

exports = Database;

module.exports = exports;

// - -------------------------------------------------------------------- - //
