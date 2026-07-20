import base from "./tooling/eslint/base.mjs";

import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default [
  ...base,

  {
    files: ["apps/api/**/*.{ts,js}"],
    languageOptions: {
      sourceType: "commonjs",
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },

  {
    files: ["apps/web/**/*.{ts,tsx,js,jsx}"],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  ...nextVitals.map(config => ({
    ...config,
    files: ["apps/web/**/*.{ts,tsx,js,jsx}"],
  })),

  ...nextTs.map(config => ({
    ...config,
    files: ["apps/web/**/*.{ts,tsx,js,jsx}"],
  })),
  {

  files: ["apps/web/**/*.{ts,tsx,js,jsx}"],

  rules: {

    "@next/next/no-html-link-for-pages": "off",

  },

}
];