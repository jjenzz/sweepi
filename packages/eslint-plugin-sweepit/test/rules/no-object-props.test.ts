import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import rule from '../../src/rules/no-object-props';
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

describe('no-object-props', () => {
  ruleTester.run('no-object-props', rule, {
    valid: [
      '<Comp tone="info" />',
      '<Comp style={style} />',
      '<Comp config={getConfig()} />',
      '<Comp />',
    ],
    invalid: [
      {
        code: '<Comp style={{ color: "red" }} />',
        errors: [
          {
            messageId: 'noObjectProps',
            data: { prop: 'style' },
          },
        ],
      },
      {
        code: '<Comp options={{ dense: true, interactive: false }} />',
        errors: [
          {
            messageId: 'noObjectProps',
            data: { prop: 'options' },
          },
        ],
      },
    ],
  });
});
