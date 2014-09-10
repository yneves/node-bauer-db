node-bauer-db
=============

Modern API for SQL databases.

Currently supports `sqlite3` and `mysql` database.

Relies on [bauer-sql](https://github.com/yneves/node-bauer-sql) for SQL building.

## Installation

```
npm install bauer-db
```

## Usage

```js
var bauerDb = require("bauer-db");
```

### SQLite3

```js
var db = bauerDb.sqlite3({
  database: "/path/to/db",
});
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
```

### MySQL

```js
var db = bauerDb.mysql({
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
```


## License

MIT
