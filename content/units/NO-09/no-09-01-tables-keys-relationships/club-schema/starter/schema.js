// The schema of a school's clubs: students, clubs and which student belongs to which club.
export const schema = `
  CREATE TABLE students (
    id   INTEGER PRIMARY KEY,
    name TEXT NOT NULL
  );

  -- TODO: clubs (id, title) and memberships (studentId, clubId, joinedOn)
`;
