// @ts-check

const eslint = require('@eslint/js');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');
const prettier = require('eslint-config-prettier');

module.exports = tseslint.config(
  {
    ignores: [
      '.angular/**',
      'coverage/**',
      'dist/**',
      'node_modules/**',
      'playwright-report/**',
      'test-results/**',
    ],
  },
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          prefix: 'app',
          style: 'kebab-case',
        },
      ],
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: 'app',
          style: 'camelCase',
        },
      ],
      'no-console': 'error',
      'no-restricted-globals': [
        'error',
        {
          name: 'localStorage',
          message:
            'Direct Web Storage access is blocked by the security baseline. Use a reviewed abstraction only for non-sensitive data.',
        },
        {
          name: 'sessionStorage',
          message:
            'Direct Web Storage access is blocked by the security baseline. Use a reviewed abstraction only for non-sensitive data.',
        },
      ],
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@angular/platform-browser',
              importNames: ['DomSanitizer'],
              message:
                'DomSanitizer bypass APIs require an explicit security-reviewed exception. Prefer normal Angular bindings and automatic sanitization.',
            },
          ],
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: "MemberExpression[property.name='localStorage']",
          message:
            'Direct localStorage access is blocked. Browser storage must not hold credentials or sensitive tokens.',
        },
        {
          selector: "MemberExpression[property.name='sessionStorage']",
          message:
            'Direct sessionStorage access is blocked. Browser storage must not hold credentials or sensitive tokens.',
        },
        {
          selector:
            "MemberExpression[object.name='document'][computed=false][property.name='cookie']",
          message:
            'Direct document.cookie access is blocked. Session cookies should be server-managed and HttpOnly when applicable.',
        },
        {
          selector:
            "MemberExpression[object.name='document'][computed=true][property.value='cookie']",
          message:
            'Computed document[\'cookie\'] access is blocked. Session cookies should be server-managed and HttpOnly when applicable.',
        },
      ],
    },
  },
  {
    files: ['**/*.html'],
    extends: [...angular.configs.templateRecommended, ...angular.configs.templateAccessibility],
  },
  prettier,
);
