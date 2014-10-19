// - -------------------------------------------------------------------- - //
// - libs

var assert = require("assert");

var MySQL = require("../lib/driver/mysql.js");

// - -------------------------------------------------------------------- - //
// - MySQL

describe("MySQL",function() {

  it("ready",function(done) {
    var db = new MySQL();
    db.open({
      host: "localhost",
      port: 3306,
      user: "root",
      password: "1234",
      database: "test",
    });
    db.on("error",done);
    db.on("ready",done);
  });

  it("query",function(done) {
    var db = new MySQL({
      host: "localhost",
      port: 3306,
      user: "root",
      password: "1234",
      database: "test",
    });
    db.open();
    db.select()
      .from("INFORMATION_SCHEMA.TABLES")
      .run()
      .then(function(result) {
        assert.ok(result.rows.length > 0);
        done();
      })
      .fail(function(error) {
        done(error);
      });
  });

});

// - -------------------------------------------------------------------- - //
