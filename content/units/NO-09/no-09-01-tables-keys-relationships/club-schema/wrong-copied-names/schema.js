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

  -- The student's name is copied into every membership "for convenience".
  CREATE TABLE memberships (
    studentId   INTEGER NOT NULL REFERENCES students(id),
    clubId      INTEGER NOT NULL REFERENCES clubs(id),
    studentName TEXT,
    joinedOn    TEXT NOT NULL,
    PRIMARY KEY (studentId, clubId)
  );
`;
