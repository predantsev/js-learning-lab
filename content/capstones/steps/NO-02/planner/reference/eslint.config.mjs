import js from "@eslint/js";
import globals from "globals";

export default [
  { ignores: ["dist/", "releases/"] },
  js.configs.recommended,
  { files: ["**/*.js"], languageOptions: { globals: globals.browser } },
  { files: ["**/*.mjs"], languageOptions: { globals: globals.node } },
];
