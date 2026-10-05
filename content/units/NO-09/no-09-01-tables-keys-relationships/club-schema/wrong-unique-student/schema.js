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

  -- UNIQUE on the student alone: each student may belong to only one club.
  CREATE TABLE memberships (
    studentId INTEGER NOT NULL UNIQUE REFERENCES students(id),
    clubId    INTEGER NOT NULL REFERENCES clubs(id),
    joinedOn  TEXT NOT NULL
  );
`;
