// - -------------------------------------------------------------------- - //

var schema = {

	"tables": {

		"projects": {
			"fields": {
				"id": "INTEGER",
				"name": "TEXT",
				"checked": "INTEGER"
			},
			"primaryKey": [
				"id",
			],
		},

		"versions": {
			"fields": {
				"id": "INTEGER PRIMARY KEY",
				"pid": "INTEGER",
				"name": "TEXT",
				"checked": "INTEGER",
			},
			"foreignKey": {
				"pid": "projects.id",
			},
		},

		"labels": {
			"fields": {
				"id": "INTEGER PRIMARY KEY",
				"pid": "INTEGER REFERENCES projects(id)",
				"name": "TEXT",
				"checked": "INTEGER",
			},
		},

		"tasks": {
			"fields": {
				"id": "INTEGER PRIMARY KEY",
				"pid": "INTEGER REFERENCES projects(id)",
				"vid": "INTEGER REFERENCES versions(id)",
				"text": "TEXT",
				"checked": "INTEGER",
			},
		},

		"tasklabels": {
			"fields": {
				"id": "INTEGER PRIMARY KEY",
				"pid": "INTEGER REFERENCES projects(id)",
				"vid": "INTEGER REFERENCES versions(id)",
				"tid": "INTEGER REFERENCES tasks(id)",
				"lid": "INTEGER REFERENCES labels(id)",
			},
		},

	},

	"indexes": {
		"pchecked": {
			"table": "projects",
			"fields": ["checked"],
		},
		"vproject": {
			"table": "versions",
			"fields": ["pid"],
		},
		"vchecked": {
			"table": "versions",
			"fields": ["pid","checked"],
		},
		"lname": {
			"table"	: "labels",
			"fields": ["name"],
			"unique": true,
		},
		"lproject": {
			"table"	: "labels",
			"fields": ["pid"],
		},
		"lchecked": {
			"table"	: "labels",
			"fields": ["pid","checked"],
		},
		"tproject": {
			"table": "tasks",
			"fields": ["pid"],
		},
		"tversion": {
			"table": "tasks",
			"fields": ["vid"],
		},
		"tchecked": {
			"table": "tasks",
			"fields": ["pid","checked"],
		},

	},

	"triggers": {

		"update_task": {
			"update": "tasks",
			"do": [
				"UPDATE tasklabels SET vid = new.vid WHERE tasklabels.tid = new.id",
				"UPDATE tasklabels SET pid = new.pid WHERE tasklabels.tid = new.id",
			],
		},

		"update_task_version": {
			"update": "tasks.vid",
			"do": [
				"UPDATE tasklabels SET vid = new.vid WHERE tasklabels.tid = new.id",
			],
		},

		"update_task_project": {
			"after": true,
			"update": "tasks.pid",
			"when": "new.pid > 0",
			"do": [
				"UPDATE tasklabels SET pid = new.pid WHERE tasklabels.tid = new.id",
			],
		},

	},

	"views": {

		"tasklist": "SELECT tasks.*, versions.name as version, projects.name as project, count(tasklabels.id) as labels FROM tasks LEFT JOIN tasklabels ON tasklabels.tid = tasks.id LEFT JOIN versions ON versions.id = tasks.vid LEFT JOIN projects ON projects.id = tasks.pid GROUP BY tasks.id"

	},

};

// - -------------------------------------------------------------------- - //

require("fs").writeFileSync(__dirname + "/sample-schema.json",JSON.stringify(schema,null,2));

module.exports = schema;

// - -------------------------------------------------------------------- - //
