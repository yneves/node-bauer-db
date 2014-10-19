// - -------------------------------------------------------------------- - //
// - libs

var assert = require("assert");

var POstgreSQL = require("../lib/driver/postgresql.js");

// - -------------------------------------------------------------------- - //
// - POstgreSQL

describe("POstgreSQL",function() {

  it("ready",function(done) {
    var db = new POstgreSQL();
    db.open({
      host: "localhost",
      port: 5432,
      user: "postgres",
      password: "a",
      database: "test",
    });
    db.on("error",done);
    db.on("ready",done);
  });

});

// - -------------------------------------------------------------------- - //
