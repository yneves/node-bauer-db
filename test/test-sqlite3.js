// - -------------------------------------------------------------------- - //
// - libs

var assert = require("assert");

var SQLite3 = require("../lib/driver/sqlite3.js");

// - -------------------------------------------------------------------- - //
// - SQLite3

describe("SQLite3",function() {

  it("ready",function(done) {
    var db = new SQLite3();
    db.open({
      database: ":memory:",
    });
    db.on("error",done);
    db.on("ready",done);
  });

  it("query",function(done) {
    var db = new SQLite3();
    db.open();
    db.select()
      .from("sqlite_master")
      .run()
      .then(function(result) {
        assert.deepEqual(result.rows,[]);
        done();
      })
      .fail(function(error) {
        done(error);
      });
  });

});

// - -------------------------------------------------------------------- - //
