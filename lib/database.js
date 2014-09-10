/*!
**  bauer-db -- Modern API for SQL databases.
**  Copyright (c) 2014 Yuri Neves Silveira <http://yneves.com>
**  Licensed under The MIT License <http://opensource.org/licenses/MIT>
**  Distributed on <http://github.com/yneves/node-bauer-db>
*/
// - -------------------------------------------------------------------- - //
// - libs

var lib = {
	events: require("events"),
	sql: require("bauer-sql"),
	promise: require("bauer-promise"),
	factory: require("bauer-factory"),
};

// - -------------------------------------------------------------------- - //

// @Query
lib.factory.extend(lib.sql.cls.Query,{

	// .toPromise()
	toPromise: function() {
		var query = this.toQuery();
		return lib.promise.when(query.args).then(function(args) {
			return {
				type: query.type,
				text: query.text,
				args: args,
			};
		});
	},

	// .run()
	run: function() {
		return this.db.when(this.toPromise()).then(this.db.query);
	},

});

// - -------------------------------------------------------------------- - //

// @Database
var Database = lib.factory.class({

	// @inherits
	inherits: lib.events.EventEmitter,

	// @constructor
	constructor: function(config) {
		this.setMaxListeners(99);
		this.ready = false;
		this.config = {};
		if (lib.factory.isObject(config)) {
			this.configure(config);
		}
	},

	configure: {

		// .configure(config)
		o: function(config) {
			lib.factory.merge(this.config,config);
			return this;
		},

	},

	// .when(promises)
	when: function() {
		var deferred = lib.promise.defer(this);
		lib.promise.when.apply(null,arguments).done(deferred,deferred);
		return deferred.promise;
	},

// - -------------------------------------------------------------------- - //

	open: {

		// .open(config)
		o: function(config) {
			this.configure(config);
			this.open();
			return this;
		},

		// .open()
		0: function() {
			this._open(function(error) {
				if (error) {
					this.emit("error",error);
				} else {
					this.ready = true;
					this.emit("ready");
				}
			});
			return this;
		},

	},

// - -------------------------------------------------------------------- - //

  close: {

    // .close()
    0: function() {
			this.ready = false;
      this._close(function(error) {
				if (error) {
					this.emit("error",error);
				} else {
					this.emit("close");
				}
			});
      return this;
    },

    // .close(callback)
    f: function(callback) {
      if (this.mysql) {
        var db = this;
        this.ready = false;
        this.mysql.end(function(error) {
          callback.call(db,error);
          if (error) {
            db.emit("error",error);
          } else {
            db.emit("close");
          }
        });
      } else {
        callback.call(this);
      }
      return this;
    },

  },

// - -------------------------------------------------------------------- - //

	// .serialize()
	serialize: new Error("not implemented"),

	// .parallelize()
	parallelize: new Error("not implemented"),

// - -------------------------------------------------------------------- - //

	// .drop()
	drop: function() {
		var query = new lib.sql.cls.Drop();
		query.db = this;
		return query;
	},

	// .alter()
	alter: function() {
		var query = new lib.sql.cls.Alter();
		query.db = this;
		return query;
	},

	// .create()
	create: function() {
		var query = new lib.sql.cls.Create();
		query.db = this;
		return query;
	},

	// .insert()
	insert: function() {
		var query = new lib.sql.cls.Insert();
		query.db = this;
		return query;
	},

	// .update()
	update: function() {
		var query = new lib.sql.cls.Update();
		query.db = this;
		return query;
	},

	// .delete()
	delete: function() {
		var query = new lib.sql.cls.Delete();
		query.db = this;
		return query;
	},

	// .select()
	select: function() {
		var query = new lib.sql.cls.Select();
		query.db = this;
		return query;
	},

// - -------------------------------------------------------------------- - //

	query: {

		// .query(options)
		o: function(options) {
			var deferred = lib.promise.defer(this);
			if (this.ready) {
				var time = new Date().getTime();
				this._query(options,function(error,result) {
					if (error) {
						deferred.reject(error);
					} else {
						result.time = new Date().getTime() - time;
						deferred.resolve(result);
					}
				});
			} else {
				this.once("ready",function() {
					this.query(options).done(deferred,deferred);
				});
			}
			return deferred.promise;
		},

	},

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
