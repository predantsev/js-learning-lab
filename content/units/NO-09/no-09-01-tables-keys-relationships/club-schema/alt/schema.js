// The schema of a school's clubs: students, clubs and which student belongs to which club.
export const schema = `
  CREATE TABLE students (
    id   INTEGER PRIMARY KEY,
    name TEXT NOT NULL
  );

  CREATE TABLE clubs (
    id    INTEGER PRIMARY KEY,
    title TEXT NOT NULL
  );

  -- Its own id, plus UNIQUE on the pair; foreign keys written as table constraints.
  CREATE TABLE memberships (
    id        INTEGER PRIMARY KEY,
    studentId INTEGER NOT NULL,
    clubId    INTEGER NOT NULL,
    joinedOn  TEXT NOT NULL,
    UNIQUE (studentId, clubId),
    FOREIGN KEY (studentId) REFERENCES students (id),
    FOREIGN KEY (clubId) REFERENCES clubs (id)
  );
`;
