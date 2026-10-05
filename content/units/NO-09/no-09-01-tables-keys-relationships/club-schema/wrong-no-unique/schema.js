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

  -- Its own id, but nothing stops the same pair from being stored twice.
  CREATE TABLE memberships (
    id        INTEGER PRIMARY KEY,
    studentId INTEGER NOT NULL REFERENCES students(id),
    clubId    INTEGER NOT NULL REFERENCES clubs(id),
    joinedOn  TEXT NOT NULL
  );
`;
