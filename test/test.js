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
};

var assert = require("assert");

// - -------------------------------------------------------------------- - //
// - Module

describe("Module",function() {

	it("exports",function() {

		assert.deepEqual(lib.db.database(),new lib.db.cls.Database());
		assert.deepEqual(lib.db.local(),new lib.db.cls.Local());
		assert.deepEqual(lib.db.remote(),new lib.db.cls.Remote());
		assert.deepEqual(lib.db.server(),new lib.db.cls.Server());

		assert.deepEqual(lib.db.drop(),new lib.db.cls.Drop());
		assert.deepEqual(lib.db.alter(),new lib.db.cls.Alter());
		assert.deepEqual(lib.db.create(),new lib.db.cls.Create());
		assert.deepEqual(lib.db.update(),new lib.db.cls.Update());
		assert.deepEqual(lib.db.insert(),new lib.db.cls.Insert());
		assert.deepEqual(lib.db.delete(),new lib.db.cls.Delete());
		assert.deepEqual(lib.db.select(),new lib.db.cls.Select());

	});

});

// - -------------------------------------------------------------------- - //
