CREATE TABLE IF NOT EXISTS projects (id INTEGER, name TEXT, checked INTEGER, PRIMARY KEY (id));
CREATE TABLE IF NOT EXISTS versions (id INTEGER PRIMARY KEY, pid INTEGER, name TEXT, checked INTEGER, FOREIGN KEY (pid) REFERENCES projects (id));
CREATE TABLE IF NOT EXISTS labels (id INTEGER PRIMARY KEY, pid INTEGER REFERENCES projects(id), name TEXT, checked INTEGER);
CREATE TABLE IF NOT EXISTS tasks (id INTEGER PRIMARY KEY, pid INTEGER REFERENCES projects(id), vid INTEGER REFERENCES versions(id), text TEXT, checked INTEGER);
CREATE TABLE IF NOT EXISTS tasklabels (id INTEGER PRIMARY KEY, pid INTEGER REFERENCES projects(id), vid INTEGER REFERENCES versions(id), tid INTEGER REFERENCES tasks(id), lid INTEGER REFERENCES labels(id));
CREATE INDEX IF NOT EXISTS pchecked ON projects (checked);
CREATE INDEX IF NOT EXISTS vproject ON versions (pid);
CREATE INDEX IF NOT EXISTS vchecked ON versions (pid, checked);
CREATE UNIQUE INDEX IF NOT EXISTS lname ON labels (name);
CREATE INDEX IF NOT EXISTS lproject ON labels (pid);
CREATE INDEX IF NOT EXISTS lchecked ON labels (pid, checked);
CREATE INDEX IF NOT EXISTS tproject ON tasks (pid);
CREATE INDEX IF NOT EXISTS tversion ON tasks (vid);
CREATE INDEX IF NOT EXISTS tchecked ON tasks (pid, checked);
CREATE VIEW IF NOT EXISTS tasklist AS SELECT tasks.*, versions.name as version, projects.name as project, count(tasklabels.id) as labels FROM tasks LEFT JOIN tasklabels ON tasklabels.tid = tasks.id LEFT JOIN versions ON versions.id = tasks.vid LEFT JOIN projects ON projects.id = tasks.pid GROUP BY tasks.id;
CREATE TRIGGER IF NOT EXISTS update_task UPDATE ON tasks BEGIN UPDATE tasklabels SET vid = new.vid WHERE tasklabels.tid = new.id; UPDATE tasklabels SET pid = new.pid WHERE tasklabels.tid = new.id; END;
CREATE TRIGGER IF NOT EXISTS update_task_version UPDATE OF vid ON tasks BEGIN UPDATE tasklabels SET vid = new.vid WHERE tasklabels.tid = new.id; END;
CREATE TRIGGER IF NOT EXISTS update_task_project AFTER UPDATE OF pid ON tasks WHEN (new.pid > 0) BEGIN UPDATE tasklabels SET pid = new.pid WHERE tasklabels.tid = new.id; END;
