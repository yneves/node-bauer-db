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
	db: require("../"),
	promise: require("bauer-promise"),
};

var assert = require("assert");

var schema = require("./sample-schema.js");

// - -------------------------------------------------------------------- - //
// - Remote

describe("Remote",function() {

	it("listen-keep",function(done) {
		var server = new lib.db.cls.Server();
		server.listen(6767);
		server.on("error",done);
		server.on("shutdown",done);
		server.on("listening",function() {
			assert.ok(this.listening);
			done();
		});
	});

	it("connect-refused",function(done) {
		var client = new lib.db.cls.Remote();
		client.connect(1234);
		client.on("error",function(error) {
			assert.ok(error.code == "ECONNREFUSED");
			done();
		});
		client.on("connect",function() {
			assert.ok(false);
			client.disconnect();
			done();
		});
	});

	it("connect-ok",function(done) {
		var client = new lib.db.cls.Remote();
		client.connect(6767);
		client.on("error",function(error) {
			done(error);
		});
		client.on("connect",function() {
			assert.ok(this.connected);
			client.disconnect();
		});
		client.on("disconnect",function() {
			assert.ok(!this.connected);
			done();
		});
	});

	it("operation",function(done) {
		var db = new lib.db.cls.Remote();
		db.connect(6767);
		db.open(null,schema);
		db.on("error",function(error) {
			done(error);
		});
		db.on("ready",function() {
			db.insert()
				.into("tasks")
				.fields("text")
				.values("a")
				.run()
				.then(function(id) {
					return db.select()
						.fields("id, text")
						.from("tasks")
						.where({ id: id })
						.get()
						.then(function(row) {
							assert.deepEqual(row,{
								id: id,
								text: "a",
							});
						});
				})
				.fail(done)
				.done(function() {
					db.close();
					done();
				});

		});
	});

});

// - -------------------------------------------------------------------- - //
