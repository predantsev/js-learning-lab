// deviceSim.js: a stand-in for the phone's storage, its log and the network, for this preview only. Do not edit.
// Every place keeps the exact text it received, so the screen can count the copies.
const places = [];

export const device = {
  cache: {
    async setItem(key, text) {
      places.push({ place: `storage: ${key}`, text });
    },
  },
  log(...parts) {
    places.push({ place: 'device log', text: parts.join(' ') });
  },
  async send(path, body) {
    places.push({ place: `request body: POST ${path}`, text: body });
  },
};

// The places whose text contains `needle`.
export function placesWith(needle) {
  return places.filter(({ text }) => text.includes(needle)).map(({ place }) => place);
}

export function resetPlaces() {
  places.length = 0;
}
