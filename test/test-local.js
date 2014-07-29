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
// - Local

describe("Local",function() {

	it("ready",function(done) {
		var db = new lib.db.cls.Local();
		db.open();
		db.on("error",done);
		db.on("ready",done);
	});

	it("schema",function(done) {
		var db = new lib.db.cls.Local();
		db.open(null,schema);
		db.on("error",done);
		db.on("ready",function() {
			db.schema().fail(done).done(function(value) {
				assert.deepEqual(value,schema);
				done();
			});
		});
	});

	it("operation",function(done) {
		var db = new lib.db.cls.Local();
		db.open(null,schema);
		db.on("error",done);
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
				.done(done,done);
		});
	});

});

// - -------------------------------------------------------------------- - //
