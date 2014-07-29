// - -------------------------------------------------------------------- - //
// - libs

var lib = {
	sql: require("bauer-sql"),
	factory: require("bauer-factory"),
	promise: require("bauer-promise"),
};

// - -------------------------------------------------------------------- - //

// @Query

// .toPromise()
lib.sql.cls.Query.prototype.toPromise = function() {
	var query = this.toQuery();
	return lib.promise.when(query.args).then(function(args) {
		return { text: query.text, args: args };
	});
};

// - -------------------------------------------------------------------- - //

// @Drop
var Drop = lib.factory.class({

	inherits: lib.sql.cls.Drop,
	constructor: function(db) { this.db = db },

	// .run()
	run: function() {
		return this.db
			.when(this.toPromise())
			.then(this.db.run);
	},

});

// - -------------------------------------------------------------------- - //

// @Alter
var Alter = lib.factory.class({

	inherits: lib.sql.cls.Alter,
	constructor: function(db) { this.db = db },

	// .run()
	run: function() {
		return this.db
			.when(this.toPromise())
			.then(this.db.run);
	},

});

// - -------------------------------------------------------------------- - //

// @Create
var Create = lib.factory.class({

	inherits: lib.sql.cls.Create,
	constructor: function(db) { this.db = db },

	// .run()
	run: function() {
		return this.db
			.when(this.toPromise())
			.then(this.db.run);
	},

});

// - -------------------------------------------------------------------- - //

// @Insert
var Insert = lib.factory.class({

	inherits: lib.sql.cls.Insert,
	constructor: function(db) { this.db = db },

	// .run()
	run: function() {
		return this.db
			.when(this.toPromise())
			.then(this.db.run)
			.then(function(o){
				return o["lastID"];
			});
	},

});

// - -------------------------------------------------------------------- - //

// @Update
var Update = lib.factory.class({

	inherits: lib.sql.cls.Update,
	constructor: function(db) { this.db = db },

	// .run()
	run: function() {
		return this.db
			.when(this.toPromise())
			.then(this.db.run)
			.then(function(o){
				return o["changes"];
			});
	},

});

// - -------------------------------------------------------------------- - //

// @Delete
var Delete = lib.factory.class({

	inherits: lib.sql.cls.Delete,
	constructor: function(db) { this.db = db },

	// .run()
	run: function() {
		return this.db
			.when(this.toPromise())
			.then(this.db.run)
			.then(function(o){
				return o["changes"];
			});
	},

});

// - -------------------------------------------------------------------- - //

// @Select
var Select = lib.factory.class({

	inherits: lib.sql.cls.Select,
	constructor: function(db) { this.db = db },

	// .get()
	get: function() {
		return this.db
			.when(this.toPromise())
			.then(this.db.get)
			.then(function(o){
				return o["row"];
			});
	},

	// .all()
	all: function() {
		return this.db
			.when(this.toPromise())
			.then(this.db.all)
			.then(function(o){
				return o["rows"];
			});
	},

	// .each(callback)
	each: function(callback) {
		return this.db
			.when(this.toPromise())
			.then(function(query) {
				return this.each(query,callback);
			});
	},

});

// - -------------------------------------------------------------------- - //
// - exports

exports = {};

exports.Drop = Drop;
exports.Alter = Alter;
exports.Create = Create;
exports.Insert = Insert;
exports.Update = Update;
exports.Delete = Delete;
exports.Select = Select;
exports.Parser = lib.sql.cls.Parser;
exports.Schema = lib.sql.cls.Schema;
exports.Randomizer = lib.sql.cls.Randomizer;

module.exports = exports;

// - -------------------------------------------------------------------- - //
