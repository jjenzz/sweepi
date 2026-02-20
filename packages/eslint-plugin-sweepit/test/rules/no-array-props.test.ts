import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import rule from '../../src/rules/no-array-props';
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

describe('no-array-props', () => {
  ruleTester.run('no-array-props', rule, {
    valid: [
      '<Comp items={items} />',
      '<Comp values={getValues()} />',
      '<Comp total={3} />',
      '<Comp />',
    ],
    invalid: [
      {
        code: '<Comp items={[1, 2, 3]} />',
        errors: [
          {
            messageId: 'noArrayProps',
            data: { prop: 'items' },
          },
        ],
      },
      {
        code: '<Comp entries={["a", "b"]} />',
        errors: [
          {
            messageId: 'noArrayProps',
            data: { prop: 'entries' },
          },
        ],
      },
    ],
  });
});
