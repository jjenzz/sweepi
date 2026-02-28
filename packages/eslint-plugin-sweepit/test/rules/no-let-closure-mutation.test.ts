import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import rule from '../../src/rules/no-let-closure-mutation';
import tsParser from '@typescript-eslint/parser';

RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    parserOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      ecmaFeatures: { jsx: true },
    },
  },
});

describe('no-let-closure-mutation', () => {
  ruleTester.run('no-let-closure-mutation', rule, {
    valid: [
      {
        code: `
          let count = 0;
          count = count + 1;
        `,
      },
      {
        code: `
          let value = 1;
          if (true) {
            value = 2;
          }
        `,
      },
      {
        code: `
          let value = 1;
          value += 1;
        `,
      },
      {
        code: `
          let value = 1;
          for (let i = 0; i < 3; i++) {
            value = value + 1;
          }
        `,
      },
      {
        code: `
          let value = 1;
          {
            let value = 2;
            value = 3;
          }
        `,
      },
    ],
    invalid: [
      {
        code: `
          let count = 0;
          function increment() {
            count++;
          }
        `,
        errors: [{ messageId: 'noLetClosureMutation', data: { name: 'count' } }],
      },
      {
        code: `
          let count = 0;
          const increment = () => {
            count = count + 1;
          };
        `,
        errors: [{ messageId: 'noLetClosureMutation', data: { name: 'count' } }],
      },
    ],
  });
});
