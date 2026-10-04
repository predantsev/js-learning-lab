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

  -- The ids are plain columns: nothing checks that such a student or club exists.
  CREATE TABLE memberships (
    studentId INTEGER NOT NULL,
    clubId    INTEGER NOT NULL,
    joinedOn  TEXT NOT NULL,
    PRIMARY KEY (studentId, clubId)
  );
`;
