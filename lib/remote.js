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
	net: function() { return require("net") },
	promise: require("bauer-promise"),
	factory: require("bauer-factory"),
};

// - -------------------------------------------------------------------- - //

// @Database
var Database = require("./database.js");

// - -------------------------------------------------------------------- - //

// @Remote
var Remote = lib.factory.class({

	// @inherits
	inherits: Database,

	// @constructor
	constructor: function() {
		this.connected = false;
		this.pending = {};
	},

// - -------------------------------------------------------------------- - //

	// .connect(address)
	connect: function(params) {

		var db = this;
		var options = { timeout: 0, encoding: "utf8", retry: 5 };
		var address = {};
		if (lib.factory.isObject(params)) {
			if (params.host) address.host = params.host;
			if (params.port) address.port = params.port;
			if (params.timeout) options.timeout = params.timeout;
			if (lib.factory.isString(params.file)) options.file = params.file;
			if (lib.factory.isNumber(params.retry)) options.retry = params.retry;
		} else if (lib.factory.isNumber(params)) {
			address.port = params;
			address.host = "127.0.0.1";
		}

		if (options.file) {

			if (options.retry > 0) {
				options.retry--;
				lib.fs.readFile(options.file,"utf8",function(error,data) {
					if (error) {
						setTimeout(function() { db.connect(options) },300);
					} else {
						if (/^[0-9]+$/.test(data)) {
							options.file = null;
							options.port = parseInt(data);
							db.connect(options);
						} else if (/^[\w\.\:]+$/.test(data)) {
							var parts = data.trim().split(":");
							options.file = null;
							options.host = parts[0];
							options.port = parseInt(parts[1]);
							db.connect(options);
						}
					}
				});

			} else {
				throw new Error("address file not found");
			}

 		} else {

			var length = 0;
			var buffer = "";
			var readingLength = true;

			this.socket = new lib.net().Socket();
			if (options.timeout > 0) this.socket.setTimeout(options.timeout);
			this.socket.setEncoding(options.encoding);

			this.socket.on("connect",function() {
				db.connected = true;
				db.emit("connect");
			});

			this.socket.on("error",function(error) {
				if (error.code == "ECONNRESET") {
					this.end();
				} else {
					db.emit("error",error);
				}
			});

			this.socket.on("timeout",function() {
				db.emit("timeout");
				this.end();
			});

			this.socket.on("close",function() {
			});

			this.socket.on("end",function() {
				db.connected = false;
				db.emit("disconnect");
			});

			this.socket.on("data",function(data) {
				for (var i = 0; i < data.length; i++) {
					if (readingLength) {
						if (data[i] == "{") {
							length = parseInt(buffer);
							buffer = "";
							readingLength = false;
						} else if (buffer.length > 10) {
							db.emit("error",new Error("invalid protocol"));
							db.disconnect();
						}
					}
					buffer += data[i];
					if (!readingLength) {
						if (buffer.length == length) {
							var message, error;
							try { message = JSON.parse(buffer) }
							catch(e) { error = e }
							buffer = "";
							length = 0;
							readingLength = true;
							if (message) {
								db.receive(message);
							} else {
								db.emit("error",new Error("invalid protocol"));
								db.disconnect();
							}
						}
					}
				}
			});

			this.socket.connect(address);

		}

	},

	// .address()
	address: function() {
		if (this.socket) {
			return this.socket.address();
		}
	},

	// .disconnect()
	disconnect: function() {
		if (this.socket) {
			this.socket.end();
		}
	},

// - -------------------------------------------------------------------- - //

	// .send(message)
	send: function(message) {
		message.uid = this.guid();
		var deferred = lib.promise.defer(this);
		var data, error;
		try { data = JSON.stringify(message) }
		catch(e) { error = e }
		if (error) {
			deferred.reject(error);
		} else {
			this.pending[message.uid] = {
				message: message,
				deferred: deferred
			};
			data = data.length.toString() + data;
			if (this.connected) {
				this.socket.write(data);
			} else {
				this.once("connect",function() {
					this.socket.write(data);
				});
			}
		}
		return deferred.promise;
	},

	// .receive(message)
	receive: function(message) {
		if (message.uid) {
			var pending = this.pending[message.uid];
			if (pending) {
				if (message.error) {
					var error = message.error;
					if (pending.message && pending.message.arg) {
						error += " - " + JSON.stringify(pending.message.arg);
					}
					pending.deferred.reject(new Error(error));
				} else {
					pending.deferred.resolve(message.result);
				}
			}
			delete this.pending[message.uid];
		}
		return this;
	},

// - -------------------------------------------------------------------- - //

	// .open(database,schema)
	open: function(database,schema) {
		this.send({
			cmd: "open",
			database: database,
			schema: schema
		}).done(function(database) {
			this.ready = true;
			this.emit("ready");
		},function(error) {
			this.ready = false;
			this.emit("error",error);
		});
		return this;
	},

	// .close(callback)
	close: function(callback) {
		this.send({ cmd: "close" })
			.done(function() {
				this.ready = false;
				this.emit("close");
				if (lib.factory.isFunction(callback)) {
					callback.call(this);
				}
			},function(error) {
				this.ready = false;
				this.emit("error",error);
				if (lib.factory.isFunction(callback)) {
					callback.call(this,error);
				}
			});
		return this;
	},

// - -------------------------------------------------------------------- - //

	// .serialize()
	serialize: function() {
		this.send({ cmd: "serialize" });
		return this;
	},

	// .parallelize()
	parallelize: function() {
		this.send({ cmd: "parallelize" });
		return this;
	},

// - -------------------------------------------------------------------- - //

	// .exec(query)
	exec: function(query) {
		return this.send({ cmd: "exec", arg: query });
	},

// - -------------------------------------------------------------------- - //

	// .run(query)
	run: function(query) {
		if (this.ready) {
			return this.send({ cmd: "run", arg: query });
		} else {
			var deferred = lib.promise.defer(this);
			this.once("ready",function() {
				this.send({ cmd: "run", arg: query })
					.done(deferred,deferred);
			});
			return deferred.promise;
		}
	},

	// .get(query)
	get: function(query) {
		if (this.ready) {
			return this.send({ cmd: "get", arg: query });
		} else {
			var deferred = lib.promise.defer(this);
			this.once("ready",function() {
				this.send({ cmd: "get", arg: query })
					.done(deferred,deferred);
			});
			return deferred.promise;
		}
	},

	// .all(query)
	all: function(query) {
		if (this.ready) {
			return this.send({ cmd: "all", arg: query });
		} else {
			var deferred = lib.promise.defer(this);
			this.once("ready",function() {
				this.send({ cmd: "all", arg: query })
					.done(deferred,deferred);
			});
			return deferred.promise;
		}
	},

	// .each(query)
	each: new Error("not implemented"),

// - -------------------------------------------------------------------- - //

	// .dump(params)
	dump: function(params) {
		if (this.ready) {
			return this.send({ cmd: "dump", arg: params });
		} else {
			var deferred = lib.promise.defer(this);
			this.once("ready",function() {
				this.send({ cmd: "dump", arg: params })
					.done(deferred,deferred);
			});
			return deferred.promise;
		}
	},

	// .load(params)
	load: function(params) {
		if (this.ready) {
			return this.send({ cmd: "load", arg: params });
		} else {
			var deferred = lib.promise.defer(this);
			this.once("ready",function() {
				this.send({ cmd: "load", arg: params })
					.done(deferred,deferred);
			});
			return deferred.promise;
		}
	},

	// .randomize(params)
	randomize: function(params) {
		if (this.ready) {
			return this.send({ cmd: "randomize", arg: params });
		} else {
			var deferred = lib.promise.defer(this);
			this.once("ready",function() {
				this.send({ cmd: "randomize", arg: params })
					.done(deferred,deferred);
			});
			return deferred.promise;
		}
	},

});

// - -------------------------------------------------------------------- - //
// - exports

exports = Remote;
module.exports = exports;

// - -------------------------------------------------------------------- - //
