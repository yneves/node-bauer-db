/*!
**  bauer-db -- Modern API for SQL databases.
**  Copyright (c) 2014 Yuri Neves Silveira <http://yneves.com>
**  Licensed under The MIT License <http://opensource.org/licenses/MIT>
**  Distributed on <http://github.com/yneves/node-bauer-db>
*/
// - -------------------------------------------------------------------- - //
// - libs

var lib = {
	net: function() { return require("net") },
	promise: require("bauer-promise"),
	factory: require("bauer-factory"),
};

// - -------------------------------------------------------------------- - //

// @Local
var Local = require("./local.js");

// - -------------------------------------------------------------------- - //

// @Server
var Server = lib.factory.class({

	// @inherits
	inherits: "events.EventEmitter",

	// @constructor
	constructor: function() {
		this.listening = false;
		this.clients = [];
		this.databases = {};
	},

// - -------------------------------------------------------------------- - //

	// .listen(port)
	listen: function(port) {
		var server = this;
		this.socket = lib.net().createServer();
		this.socket.on("close",function() {
			server.listening = false;
			server.emit("shutdown");
		});
		this.socket.on("error",function(error) {
			if (error.code == "ECONNRESET") {
				server.bye();
			} else {
				server.emit("error",error);
			}
		});
		this.socket.on("connection",function(client) {
			server.welcome(client);
		});
		this.socket.on("listening",function() {
			server.listening = true;
			server.emit("listening");
		});
		if (arguments.length == 0) {
			this.socket.listen();
		} else {
			this.socket.listen(port);
		}
		return this;
	},

	// .address()
	address: function() {
		if (this.socket) {
			return this.socket.address();
		}
	},

	// .shutdown()
	shutdown: function() {
		if (this.socket) {
			try { this.socket.close(); } catch(e) {}
		}
	},

// - -------------------------------------------------------------------- - //

	// .bye(client)
	bye: function(client) {
		this.close(client._database);
		var temp = [];
		for (var f = 0; f < this.clients.length; f++) {
			if (this.clients[f] !== client) {
				temp.push(this.clients[f]);
			}
		}
		this.clients = temp;
		this.emit("bye",client);
	},

	// .welcome(client)
	welcome: function(client) {
		var server = this;
		var length = 0;
		var buffer = "";
		var readingLength = true;
		this.clients.push(client);
		client.setEncoding("utf8");
		client.on("data",function(data) {
			for (var i = 0; i < data.length; i++) {
				if (readingLength) {
					if (data[i] == "{") {
						length = parseInt(buffer);
						buffer = "";
						readingLength = false;
					} else if (buffer.length > 10) {
						server.emit("error",new Error("invalid protocol"));
						client.end();
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
							server.receive(client,message);
						} else {
							server.emit("error",new Error("invalid protocol"));
							client.end();
						}
					}
				}
			}
		});
		client.on("error",function(error) {
			if (error.code == "ECONNRESET") {
				server.bye(client);
			} else {
				server.emit("error",error);
			}
		});
		client.on("end",function() {
			server.bye(client);
		});
		server.emit("welcome",client);
	},

// - -------------------------------------------------------------------- - //

	// .send(client,message)
	send: function(client,message) {
		var data = JSON.stringify(message);
		client.write(data.length.toString() + data);
		return this;
	},

	// .receive(client,message)
	receive: function(client,message) {
		if (message.cmd == "open") {
			this.open(message.database,message.schema)
				.done(function(database) {
					client._database = database;
					this.send(client,{
						uid: message.uid,
						ready: true,
					});
				},function(error) {
					this.send(client,{
						uid: message.uid,
						error: error.toString(),
					});
				});

		} else if (message.cmd == "close") {
			this.close(client._database)
				.done(function(ready) {
					this.send(client,{
						uid: message.uid,
						ready: ready,
					});
				},function(error) {
					this.send(client,{
						uid: message.uid,
						error: error.toString(),
					});
				});
		} else if (client._database) {
			var db = this.databases[client._database];
			if (db) {
				if (message.cmd && db[message.cmd]) {
					db[message.cmd](message.arg)
						.bind(this)
						.done(function(result) {
							this.send(client,{
								uid: message.uid,
								result: result
							});
						},function(error) {
							this.send(client,{
								uid: message.uid,
								error: error.toString(),
							});
						});
				} else {
					this.send(client,{
						uid: message.uid,
						error: "unknown command",
					});
				}

			} else {
				this.send(client,{
					uid: message.uid,
					error: "lost database",
				});
			}
		} else {
			this.send(client,{
				uid: message.uid,
				error: "database not selected",
			});
		}

	},

// - -------------------------------------------------------------------- - //

	// .open(database,schema)
	open: function(database,schema) {
		var server = this;
		var deferred = lib.promise.defer(this);
		if (database && server.databases[database]) {
			deferred.resolve(database);
		} else {
			var db = new Local();
			db.open(database,schema);
			db.once("error",function(error) {
				deferred.reject(error);
			});
			db.once("ready",function() {
				if (!database) {
					database = this.guid();
				}
				server.databases[database] = this;
				deferred.resolve(database);
			});
		}
		return deferred.promise;
	},

	// .close(database)
	close: function(database) {
		var server = this;
		var deferred = lib.promise.defer(this);
		if (this.databases[database]) {
			var using = 0;
			for (var i = 0; i < this.clients.length; i++) {
				if (this.clients[i]._database == database) {
					using++;
				}
			}
			if (using > 1) {
				deferred.resolve(database);
			} else {
				this.databases[database].close(function(error) {
					if (error) {
						deferred.reject(error);
					} else {
						deferred.resolve(database);
					}
				});
				delete this.databases[database];
			}
		} else {
			deferred.resolve(database);
		}
		return deferred.promise;
	},

});

// - -------------------------------------------------------------------- - //
// - exports

exports = Server;
module.exports = exports;

// - -------------------------------------------------------------------- - //
