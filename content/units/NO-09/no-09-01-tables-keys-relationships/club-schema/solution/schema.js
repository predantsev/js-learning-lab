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

  -- A junction table: one row per (student, club) pair, and the pair itself is the key.
  CREATE TABLE memberships (
    studentId INTEGER NOT NULL REFERENCES students(id),
    clubId    INTEGER NOT NULL REFERENCES clubs(id),
    joinedOn  TEXT NOT NULL,
    PRIMARY KEY (studentId, clubId)
  );
`;
