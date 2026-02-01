/* eslint-disable no-underscore-dangle */
import { fixupConfigRules, fixupPluginRules } from "@eslint/compat";
import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import nextPlugin from "@next/eslint-plugin-next";
import globals from "globals";
import path from "node:path";
import { fileURLToPath } from "node:url";
import tseslint from "typescript-eslint";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    ignores: [
      "**/node_modules",
      "**/.github",
      "**/.next",
      "**/build",
      "**/coverage",
      "*.config.js",
      "*.config.mjs",
      "next-env.d.ts",
    ],
  },
  {
    files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"],
    languageOptions: {
      globals: {
        ...globals.es2023,
        ...globals.node,
        ...globals.browser,
        React: true,
      },
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: import.meta.dirname,
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
  },
  ...fixupConfigRules(
    compat.extends(
      "airbnb",
      "plugin:@typescript-eslint/recommended",
      "plugin:import/typescript",
      "plugin:react/recommended",
      "plugin:react-hooks/recommended",
      "prettier",
    ),
  ),
  {
    files: ["**/*.ts", "**/*.tsx"],
    plugins: {
      "@typescript-eslint": fixupPluginRules(typescriptEslint),
      "@next/next": nextPlugin,
      ...tseslint.configs.recommended,
    },
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: import.meta.dirname,
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
    settings: {
      "import/resolver": {
        typescript: {
          project: ["tsconfig.json"],
        },
      },
      react: {
        version: "detect",
      },
    },
    rules: {
      // Next.js rules
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
      "@next/next/no-img-element": "off",

      // Import rules
      "import/no-cycle": "off",
      "import/no-unresolved": ["error"],
      "import/extensions": [
        "error",
        "ignorePackages",
        {
          js: "never",
          jsx: "never",
          ts: "never",
          tsx: "never",
        },
      ],
      "import/order": "off",
      "import/prefer-default-export": "off",
      "import/no-extraneous-dependencies": "off",

      "react/function-component-definition": "off",
      "react/jsx-filename-extension": [
        "error",
        {
          extensions: [".jsx", ".tsx"],
        },
      ],
      "react/jsx-one-expression-per-line": "off",
      "react/jsx-props-no-spreading": "off",
      "react/jsx-wrap-multilines": [
        "error",
        { declaration: false, assignment: false },
      ],
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "react/require-default-props": "off",
      "react/state-in-constructor": "off",
      "react/no-unescaped-entities": [
        "error",
        {
          forbid: [
            {
              char: ">",
              alternatives: ["&gt;"],
            },
            {
              char: "}",
              alternatives: ["&#125;"],
            },
          ],
        },
      ],
      "react-hooks/rules-of-hooks": "error",

      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_$",
        },
      ],
      "@typescript-eslint/ban-types": "off",
      "@typescript-eslint/no-use-before-define": "off",
      "@typescript-eslint/method-signature-style": ["error", "property"],

      "no-underscore-dangle": [
        "error",
        {
          allow: ["__filename", "__dirname"],
        },
      ],
      "no-use-before-define": "off",
      "no-void": "off",
      "no-case-declarations": "error",
      "no-param-reassign": "off",
      "no-unsafe-finally": "off",
      "comma-dangle": ["error", "always-multiline"],
      "consistent-return": "off",
      "function-paren-newline": "off",
      "global-require": "off",
      "implicit-arrow-linebreak": "off",
      "jsx-quotes": ["error", "prefer-double"],
      "no-console": "off",
      "no-extra-boolean-cast": "off",
      "no-return-assign": "off",
      "no-undef": "warn",
      "no-unused-expressions": "off",
      "no-fallthrough": "error",
      "object-curly-newline": "off",
      "object-curly-spacing": ["error", "always"],
      "operator-linebreak": "off",
      "quote-props": "off",
      semi: ["error", "always"],
      "spaced-comment": "off",

      "jsx-a11y/anchor-is-valid": "off",
      "jsx-a11y/label-has-associated-control": "off",
      "jsx-a11y/no-autofocus": "off",

      "prefer-destructuring": "off",
      "no-plusplus": "off",
      "no-shadow": "off",
      "no-nested-ternary": "off",
      "no-restricted-globals": "off",
      "no-restricted-properties": "off",
      "prefer-exponentiation-operator": "off",
      "no-alert": "off",
    },
  },
];
