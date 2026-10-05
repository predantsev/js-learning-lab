// 5,000 synthetic habits built from six base names.
const NAMES = ["%%exercise%%", "%%reading%%", "%%water%%", "%%tidy%%", "%%words%%", "%%walk%%"];

export const HABITS = Array.from({ length: 5000 }, (_, index) => ({
  id: `h-${index + 1}`,
  name: `${NAMES[index % NAMES.length]} ${index + 1}`,
}));
