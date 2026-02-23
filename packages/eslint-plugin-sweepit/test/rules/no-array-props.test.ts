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
      'interface ButtonProps { tone: string; count: number; onOpenChange: (open: boolean) => void }',
      'type ButtonProps = { tone: "info" | "warning"; count: number }',
      'interface ButtonOptions { items: string[] }',
      'type CardProps = { title: string }',
    ],
    invalid: [
      {
        code: 'interface ButtonProps { items: string[] }',
        errors: [
          {
            messageId: 'noArrayProps',
            data: { prop: 'items', propsType: 'ButtonProps' },
          },
        ],
      },
      {
        code: 'type ButtonProps = { entries: Array<string> }',
        errors: [
          {
            messageId: 'noArrayProps',
            data: { prop: 'entries', propsType: 'ButtonProps' },
          },
        ],
      },
      {
        code: 'type ButtonProps = { values: readonly string[] }',
        errors: [
          {
            messageId: 'noArrayProps',
            data: { prop: 'values', propsType: 'ButtonProps' },
          },
        ],
      },
      {
        code: 'type ButtonProps = { pair: [string, number] }',
        errors: [
          {
            messageId: 'noArrayProps',
            data: { prop: 'pair', propsType: 'ButtonProps' },
          },
        ],
      },
      {
        code: 'type Items = string[]; interface MenuProps { items: Items }',
        errors: [
          {
            messageId: 'noArrayProps',
            data: { prop: 'items', propsType: 'MenuProps' },
          },
        ],
      },
    ],
  });
});
