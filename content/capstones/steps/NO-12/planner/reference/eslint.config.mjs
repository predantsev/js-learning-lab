import js from "@eslint/js";
import globals from "globals";

export default [
  { ignores: ["dist/", "releases/", "server/release/", "server/.check/"] },
  js.configs.recommended,
  { files: ["**/*.js"], languageOptions: { globals: globals.browser } },
  { files: ["**/*.mjs"], languageOptions: { globals: globals.node } },
];
