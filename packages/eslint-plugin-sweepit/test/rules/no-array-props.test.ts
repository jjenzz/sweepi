import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import rule from '../../src/rules/no-array-props';
import tsParser from '@typescript-eslint/parser';
import { fileURLToPath } from 'node:url';

const tsconfigRootDir = fileURLToPath(new URL('../../', import.meta.url));

RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    parserOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      ecmaFeatures: { jsx: true },
      projectService: {
        allowDefaultProject: ['estree.ts', 'estree.tsx'],
      },
      tsconfigRootDir,
    },
  },
});

describe('no-array-props', () => {
  ruleTester.run('no-array-props', rule, {
    valid: [
      '<Comp tone="info" />',
      '<Comp total={3} />',
      '<Comp onOpenChange={onOpenChange} />',
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
      {
        code: 'const items: number[] = [1, 2, 3]; <Comp items={items} />',
        errors: [
          {
            messageId: 'noArrayProps',
            data: { prop: 'items' },
          },
        ],
      },
      {
        code: 'const entries: readonly string[] = ["a", "b"]; <Comp entries={entries} />',
        errors: [
          {
            messageId: 'noArrayProps',
            data: { prop: 'entries' },
          },
        ],
      },
      {
        code: 'function getValues(): string[] { return ["x", "y"]; } <Comp values={getValues()} />',
        errors: [
          {
            messageId: 'noArrayProps',
            data: { prop: 'values' },
          },
        ],
      },
    ],
  });
});
