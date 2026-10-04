// Synthetic users of the bookmarks lab (read-only). Only scrypt records are stored — made at
// "registration" with the lab passwords from the task. No real accounts.
export const users = [
  { id: 'u-01', passwordHash: {"algorithm":"scrypt","N":16384,"r":8,"p":1,"salt":"wRi3egyWCUGZwwok98eRwA==","hash":"TJUSHVRivQlemYvf3wY4PehFuI2ErnY2WomidgZFvwo="} },
  { id: 'u-02', passwordHash: {"algorithm":"scrypt","N":16384,"r":8,"p":1,"salt":"Y1cQfJMgEDkAJp8urbvi5w==","hash":"VxC5grUF5y6tC9vm8ysqlSinqevLZYlcXyglqRE5vmg="} },
  { id: 'u-03', passwordHash: {"algorithm":"scrypt","N":16384,"r":8,"p":1,"salt":"mrm9PAGBRDDzv38WgPZZWw==","hash":"L599vmu36qdmOl7SRpalNvhvKayUbp9GnWKQ1ZR8g+A="} },
];

// Synthetic bookmarks: three per user, at most.
export const seedBookmarks = [
  { id: 'b-1', ownerId: 'u-01', title: '%%docs%%', url: 'https://example.org/docs' },
  { id: 'b-2', ownerId: 'u-01', title: '%%recipes%%', url: 'https://example.org/recipes' },
  { id: 'b-3', ownerId: 'u-02', title: '%%maps%%', url: 'https://example.org/maps' },
  { id: 'b-4', ownerId: 'u-03', title: '%%music%%', url: 'https://example.org/music' },
];
