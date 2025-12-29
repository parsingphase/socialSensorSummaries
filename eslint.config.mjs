import path from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import jsdoc from "eslint-plugin-jsdoc";
import globals from "globals";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
	baseDirectory: __dirname,
	recommendedConfig: js.configs.recommended,
	allConfig: js.configs.all,
});

export default [
	{
		ignores: ["**/dist", "**/build"],
	},
	...compat.extends(
		"eslint:recommended",
		"plugin:@typescript-eslint/recommended",
	),
	{
		plugins: {
			"@typescript-eslint": typescriptEslint,
			jsdoc,
		},

		languageOptions: {
			globals: {
				...globals.browser,
				...globals.jest,
				...globals.node,
			},

			parser: tsParser,
		},

		settings: {
			react: {
				version: "detect",
			},
		},

		rules: {
			"@typescript-eslint/explicit-function-return-type": 2,
			"jsdoc/require-jsdoc": 2,
			"jsdoc/require-description": 2,
			"jsdoc/require-param": 1,
		},
	},
	{
		files: ["@types/**/*.ts", "@types/**/*.d.ts"],

		rules: {
			"@typescript-eslint/no-explicit-any": 0,
		},
	},
];
