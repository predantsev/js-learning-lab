// An older CommonJS fixture loader (read-only). Its exports object is filled in step by step and
// assigned at the end, so Node cannot list its names in advance for a named import.
const fs = require('node:fs');

const api = {};
api.loadFixtures = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
api.fixtureCount = (file) => api.loadFixtures(file).length;
module.exports = api;
