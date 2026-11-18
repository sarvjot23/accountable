// ESLint for the frontend: the recommended TypeScript, React Hooks and accessibility rules,
// plus a limit on how complex any one function may get. Prettier owns the formatting.
import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'coverage', 'src/lib/api-types.ts'] },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      jsxA11y.flatConfigs.recommended,
      prettier,
    ],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: {
      complexity: ['error', 15],
      // Only matters with the React Compiler, which this project doesn't use.
      'react-hooks/incompatible-library': 'off',
    },
  },
);
