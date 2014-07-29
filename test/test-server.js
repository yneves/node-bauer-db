// - -------------------------------------------------------------------- - //
// - libs

var lib = {
	fs: require("fs"),
	db: require("../"),
	promise: require("bauer-promise"),
};

var assert = require("assert");

var schema = require("./sample-schema.js");

// - -------------------------------------------------------------------- - //
// - Server

describe("Server",function() {

	it("listen-shutdown",function(done) {
		var server = new lib.db.cls.Server();
		server.listen();
		server.on("error",done);
		server.on("listening",function() {
			assert.ok(this.listening);
			this.shutdown();
		});
		server.on("shutdown",function() {
			assert.ok(!this.listening);
			done();
		});
	});

	it("open",function(done) {
		var server = new lib.db.cls.Server();
		var uid;
		server.open(null,schema)
			.then(function(database) {
				uid = database;
				var db = server.databases[database];
				return db.schema().fail(done).then(function(value) {
					assert.deepEqual(value,schema);
					return server.close(database);
				});
			})
			.then(function(closed) {
				assert.equal(uid,closed);
				done();
			})
			.fail(done)
			.done();
	});

	it("open-multiple",function(done) {
		var server = new lib.db.cls.Server();
		var opening = [];
		for (var i = 0; i < 20; i++) {
			opening.push(server.open(null,schema));
		}
		assert.ok(opening.length == 20);
		lib.promise.when(opening)
			.then(function(open) {
				assert.ok(open.length == 20);
				var closing = [];
				open.forEach(function(database,idx) {
					closing.push(server.close(database));
				});
				assert.ok(closing.length == 20);
				return lib.promise.when(closing);
			})
			.then(function(closed) {
				assert.ok(closed.length == 20);
				assert.deepEqual(server.databases,{});
				done();
			})
			.fail(done)
			.done();
	});

	it("welcome-bye",function(done) {
		var server = new lib.db.cls.Server();
		server.listen(4545);
		server.on("error",done);
		server.on("shutdown",done);
		server.on("welcome",function() {
			assert.ok(this.clients.length == 1);
		});
		server.on("bye",function() {
			assert.ok(this.clients.length == 0);
			server.shutdown();
		});
		server.on("listening",function() {
			var client = new lib.db.cls.Remote();
			client.connect(4545);
			client.on("connect",function() {
				assert.ok(this.connected);
				client.disconnect();
			});
			client.on("disconnect",function() {
				assert.ok(!this.connected);
			});
		});
	});

	it("server-protocol",function(done) {
		var server = new lib.db.cls.Server();
		var error;
		server.listen(4321);
		server.on("error",function(e) {
			error = e;
			server.shutdown();
		});
		server.on("shutdown",function() {
			assert.ok(/invalid protocol/.test(error));
			done();
		});
		server.on("listening",function() {
			var client = new lib.db.cls.Remote();
			client.connect(4321);
			client.on("connect",function(error) {
				client.socket.write("asdsadsadsadsadsadsadsadsad");
			});
		});
	});

	it("remote-protocol",function(done) {
		var server = new lib.db.cls.Server();
		server.listen(4321);
		server.on("error",done);
		server.on("shutdown",done);
		server.on("welcome",function() {
			this.clients[0].write("asdsadsadsadsadsadsadsadsad");
		});
		server.on("bye",function() {
			server.shutdown();
		});
		server.on("listening",function() {
			var client = new lib.db.cls.Remote();
			client.connect(4321);
			client.on("error",function(error) {
				assert.ok(/invalid protocol/.test(error));
				client.disconnect();
			});
		});
	});

	it("listen-keep",function(done) {
		var server = new lib.db.cls.Server();
		server.listen(6666);
		server.on("error",done);
		server.on("shutdown",done);
		server.on("listening",function() {
			assert.ok(this.listening);
		});
		setTimeout(function() {
			server.shutdown();
		},500);
	});

});

// - -------------------------------------------------------------------- - //
