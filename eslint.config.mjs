import js from '@eslint/js';
import pluginVue from 'eslint-plugin-vue';

export default [
  js.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        process: 'readonly',
        __GIT_COMMIT__: 'readonly',
        __BUILD_TIME__: 'readonly',
      },
    },
    rules: {
      semi: ['error', 'always'],
      quotes: ['error', 'single'],
      'vue/multi-word-component-names': 'off',
    },
    ignores: ['dist/**', 'node_modules/**','dist/**','src/utils/adapter.js','src/utils/janus.js'],
  },
];
