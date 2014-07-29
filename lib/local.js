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
	sqlite: function() { return require("sqlite3") },
	factory: require("bauer-factory"),
	promise: require("bauer-promise"),
};

// - -------------------------------------------------------------------- - //

// @Database
var Database = require("./database.js");

// - -------------------------------------------------------------------- - //

// @Local
var Local = lib.factory.class({

	// @inherits
	inherits: Database,

// - -------------------------------------------------------------------- - //

	// .open(database,schema)
	open: function(database,schema) {
		if (!database) database = ":memory:";
		this.database = database;
		var db = this;
		var SQLiteDB = lib.sqlite().Database;
		this.sql = new SQLiteDB(database,function(error) {
			if (error) {
				db.emit("error",error);
			} else if (schema) {
				db.schema(schema)
					.fail(function(error) { db.emit("error",error) })
					.then(function() {
						db.ready = true;
						db.emit("ready");
					})
					.done();
			} else {
				db.ready = true;
				db.emit("ready");
			}
		});
		return this;
	},

	// .close(callback)
	close: function(callback) {
		if (this.sql) {
			var db = this;
			this.sql.close(function(error) {
				if (lib.factory.isFunction(callback)) {
					callback.call(db,error);
				}
				if (error) {
					db.emit("error",error);
				} else {
					db.emit("close");
				}
			});
		} else {
			if (lib.factory.isFunction(callback)) {
				callback.call(this);
			}
		}
	},

// - -------------------------------------------------------------------- - //

	// .serialize()
	serialize: function() {
		this.sql.serialize();
		return this;
	},

	// .parallelize()
	parallelize: function() {
		this.sql.parallelize();
		return this;
	},

// - -------------------------------------------------------------------- - //

	// .exec(query)
	exec: function(query) {
		var deferred = lib.promise.defer(this);
		this.sql.exec(query,function(error) {
			if (error) {
				deferred.reject(error);
			} else {
				deferred.resolve();
			}
		});
		return deferred.promise;
	},

	// .execFile(file)
	execFile: function(file) {
		var db = this;
		var deferred = lib.promise.defer(this);
		lib.fs.exists(file,function(exists) {
			if (exists) {
				lib.fs.readFile(file,"utf8",function(error,content) {
					if (error) {
						deferred.reject(error);
					} else {
						db.exec(content)
							.fail(function(error) {
								deferred.reject(error);
							})
							.then(function() {
								deferred.resolve(true);
							})
							.done()
					}
				});
			} else {
				deferred.reject("file not found");
			}
		});
		return deferred.promise;
	},

// - -------------------------------------------------------------------- - //

	// .run(query)
	run: function(query) {
		var deferred = lib.promise.defer(this);
		var time = new Date().getTime();
		var callback = function(error) {
			if (error) {
				deferred.reject(error);
			} else {
				this.time = new Date().getTime() - time;
				deferred.resolve(this);
			}
		};
		if (this.ready) {
			this.sql.run(query.text,query.args,callback);
		} else {
			this.once("ready",function() {
				this.sql.run(query.text,query.args,callback);
			});
		}
		return deferred.promise;
	},

	// .get(query)
	get: function(query) {
		var deferred = lib.promise.defer(this);
		var time = new Date().getTime();
		var callback = function(error,row) {
			if (error) {
				deferred.reject(error);
			} else {
				deferred.resolve({
					row: row,
					time: new Date().getTime() - time,
				});
			}
		};
		if (this.ready) {
			this.sql.get(query.text,query.args,callback);
		} else {
			this.once("ready",function() {
				this.sql.get(query.text,query.args,callback);
			});
		}
		return deferred.promise;
	},

	// .all(query)
	all: function(query) {
		var deferred = lib.promise.defer(this);
		var time = new Date().getTime();
		var callback = function(error,rows) {
			if (error) {
				deferred.reject(error);
			} else {
				deferred.resolve({
					rows: rows,
					time: new Date().getTime() - time,
				});
			}
		};
		if (query && query.text) {
			if (this.ready) {
				this.sql.all(query.text,query.args,callback);
			} else {
				this.once("ready",function() {
					this.sql.all(query.text,query.args,callback);
				});
			}
		} else {
			deferred.reject("empty query");
		}
		return deferred.promise;
	},

	// .each(query,callback)
	each: function(query,callback) {
		var db = this;
		var deferred = lib.promise.defer(this);
		var time = new Date().getTime();
		var notify;
		if (lib.factory.isFunction(callback)) {
			notify = function(error,row) {
				if (error) {
					deferred.reject(error);
				} else {
					callback.call(db,row);
				}
			};
		} else {
			notify = function(error,row) {
				if (error) {
					deferred.reject(error);
				}
			};
		}
		var resolve = function(error,rows) {
			if (error) {
				deferred.reject(error);
			} else {
				deferred.resolve({
					rows: rows,
					time: new Date().getTime() - time,
				});
			}
		};
		if (this.ready) {
			this.sql.each(query.text,query.args,notify,resolve);
		} else {
			this.once("ready",function() {
				this.sql.each(query.text,query.args,notify,resolve);
			});
		}
		return deferred.promise;
	},

// - -------------------------------------------------------------------- - //

	// .dump(params)
	dump: function(arg) {

		var db = this;
		var deferred = lib.promise.defer(this);

		var sql = false;
		var json = false;
		var format = null;
		var data = null;
		var schema = null;

		if (lib.factory.isObject(arg)) {
			data = arg.data;
			schema = arg.schema;
			format = arg.format;
		}

		if (format == "sql") sql = true;
		if (format == "json") json = true;

		if (data === true && this.database != ":memory:") {
			data = this.database.replace(/\.sqlite$/,"") + "-dump-data." + format;
		}

		if (schema === true && this.database != ":memory:") {
			schema = this.database.replace(/\.sqlite$/,"") + "-dump-schema." + format;
		}

		var stream;
		if (data) {
			try { stream = lib.fs.createWriteStream(data) }
			catch(e) { deferred.reject(e) }
		}

		function dumpSchema(value) {
			var def = lib.promise.defer(db);
			if (schema) {
				if (json) {
					var content = JSON.stringify(value,null,2);
					lib.fs.writeFile(schema,content,function(error) {
						if (error) {
							def.reject(error);
						} else {
							def.resolve(Object.keys(value.tables));
						}
					});
				} else if (sql) {
					var obj = new lib.sql.Schema();
					obj.fromJSON(value);
					var content = obj.toSQL();
					lib.fs.writeFile(schema,content,function(error) {
						if (error) {
							def.reject(error);
						} else {
							def.resolve(Object.keys(value.tables));
						}
					});
				}
			} else {
				def.resolve(Object.keys(value.tables));
			}
			return def.promise;
		}

		var tidx = 0;
		var ridx = 0;
		var table;

		function dumpRecord(row) {
			if (ridx == 0) {
				keys = Object.keys(row);
			}
			if (sql) {
				if (ridx == 0) {
					stream.write("\n/* " + table + " */\n")
					stream.write("INSERT INTO " + table);
					stream.write("(" + keys.join(", ") + ")")
					stream.write(" VALUES");
				} else {
					stream.write(",");
				}
				var vals = keys.map(function(key) {
					var val = row[key];
					var type = lib.factory.type(val);
					if (type == "number") {
						return val;
					} else if (type == "string") {
						return "'" + val + "'";
					} else {
						return "NULL";
					}
				});
				stream.write(" (" + vals.join(", ") + ")");
			} else if (json) {
				if (ridx == 0) {
					stream.write("\n    ");
					stream.write(JSON.stringify(keys));
				}
				stream.write(",\n    ");
				var vals = keys.map(function(key) { return row[key] });
				stream.write(JSON.stringify(vals));
			}
			ridx++;
		}

		function dumpTable(tables) {
			if (tables.length > 0) {
				table = tables.shift();
				if (json) {
					if (tidx == 0) {
						stream.write("{");
					} else {
						stream.write(",");
					}
					stream.write("\n  ");
					stream.write("\"" + table + "\": [");
				}
				tidx++;
				var keys;
				return db.select()
					.from(table)
					.each(dumpRecord)
					.then(function() {
						ridx = 0;
						if (sql) {
							stream.write(";\n");
						} else if (json) {
							stream.write("\n  ]");
						}
						return dumpTable(tables);
					});
			} else {
				if (json) {
					stream.write("\n}");
				}
				stream.end();
				return tables;
			}
		}

		this.schema()
			.then(dumpSchema)
			.then(stream ? dumpTable : function() {})
			.fail(deferred)
			.done(function() { deferred.resolve(true) });

		return deferred.promise;
	},

	// .load(params)
	load: function(arg) {

		var db = this;
		var deferred = lib.promise.defer(this);

		var sql = false;
		var json = false;
		var format = "sql";
		var data = null;
		var schema = null;

		if (lib.factory.isObject(arg)) {
			if (arg.data) data = arg.data;
			if (arg.schema) schema = arg.schema;
			if (arg.format) format = arg.format;
		}

		if (format == "sql") sql = true;
		if (format == "json") json = true;

		if (sql) {

			if (schema) {
				this.execFile(schema)
					.then(function(ok) { return data ? this.execFile(data) : ok })
					.done(deferred,deferred);
			} else if (data) {
				this.execFile(data)
					.done(deferred,deferred);
			}

		} else if (json) {

			function loadData() {
				lib.fs.readFile(data,"utf8",function(error,content) {
					if (error) {
						deferred.reject(error);
					} else {
						var tables;
						try { tables = JSON.parse(content) }
						catch(e) { error = e }
						if (tables) {
							var promises = [];
							for (var table in tables) {
								if (lib.factory.isArray(tables[table])) {
									if (lib.factory.isArray(tables[table][0])) {
										var fields = tables[table][0];
										for (var i = 1; i < tables[table].length; i++) {
											var insert = new lib.sql.Insert();
											insert.into(table).fields(fields);
											insert.values(tables[table][i]);
											promises.push(db.run(insert.toQuery()));
										}
									}
								}
							}
							deferred.resolve(lib.promise.when(promises));
						} else {
							deferred.reject(error);
						}
					}
				})
			}

			if (schema) {
				var obj = new lib.sql.Schema();
				obj.fromJSON(schema,function(error) {
					if (error) {
						deferred.reject(error);
					} else {
						db.exec(obj.toSQL()).done(function() {
							if (data) {
								loadData();
							} else {
								deferred.resolve(true);
							}
						},deferred);
					}
				});
			} else if (data) {
				loadData();
			}
		}

		return deferred.promise;
	},

	// .randomize(config)
	randomize: function(arg) {
		var config = {};
		if (lib.factory.isObject(arg)) {
			config.tables = arg.tables;
			config.fields = arg.fields;
			config.indexes = arg.indexes;
			config.records = arg.records;
		}
		var db = this;
		var promises = [];
		var rand = new lib.sql.Randomizer({
			config: config,
			table: function(count,table,fields) {
				promises.push(db.create().table(table).fields(fields).run());
			},
			index: function(count,index,table,fields) {
				promises.push(db.create().index(index).on(table).fields(fields).run());
			},
			record: function(count,table,fields,values) {
				promises.push(db.insert().into(table).fields(fields).values(values).run());
			},
		});
		rand.start();
		return this.when(promises);
	},

	// .populate(config)
	populate: function(arg) {
		return this.schema().done(function(schema) {
			var config = {
				tables: schema.tables,
				indexes: schema.indexes,
			};
			if (lib.factory.isObject(arg)) {
				config.records = arg.records;
			} else if (lib.factory.isNumber(arg)) {
				config.records = arg;
			}
			var db = this;
			var promises = [];
			var rand = new lib.sql.Randomizer({
				config: config,
				record: function(count,table,fields,values) {
					promises.push(db.insert().into(table).fields(fields).values(values).run());
				},
			});
			rand.start();
			return this.when(promises);
		});
	},

});

// - -------------------------------------------------------------------- - //
// - exports

exports = Local;
module.exports = exports;

// - -------------------------------------------------------------------- - //
