import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import tsParser from '@typescript-eslint/parser';
import rule from '../../src/rules/no-return-object-repetition';

RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    parserOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
  },
});

describe('no-return-object-repetition', () => {
  ruleTester.run('no-return-object-repetition', rule, {
    valid: [
      `
      function parseValue(input: string) {
        if (input.length === 0) {
          return { kind: 'empty' };
        }
        return { kind: 'value', text: input };
      }
      `,
      `
      function resolveOptions(mode: 'all' | 'changed', projectDirectory: string) {
        const defaultOptions = { projectDirectory, all: false, format: 'stylish' };
        if (mode === 'all') {
          return { ...defaultOptions, all: true };
        }
        return defaultOptions;
      }
      `,
      `
      function createPayload(mode: 'json' | 'yaml') {
        if (mode === 'json') {
          return { mode: 'json', output: 'stdout' };
        }
        return { mode: 'yaml', output: 'stdout' };
      }
      `,
      {
        code: `
        function createOutput(flag: boolean) {
          if (flag) {
            return { alpha: 1, beta: 2, gamma: 3 };
          }
          return { alpha: 1, beta: 2, delta: 4 };
        }
        `,
        options: [{ minSharedKeys: 4, minOverlapRatio: 0.8 }],
      },
    ],
    invalid: [
      {
        code: `
        function buildOptions(all: boolean, projectDirectory: string) {
          if (all) {
            return {
              projectDirectory,
              all: true,
              format: 'stylish',
              cache: true,
            };
          }
          return {
            projectDirectory,
            all: false,
            format: 'stylish',
            cache: true,
          };
        }
        `,
        errors: [{ messageId: 'preferSharedDefaults' }, { messageId: 'preferSharedDefaults' }],
      },
      {
        code: `
        function createPayload(mode: 'json' | 'yaml') {
          if (mode === 'json') {
            return { mode: 'json', output: 'stdout' };
          }
          return { mode: 'yaml', output: 'stdout' };
        }
        `,
        options: [{ minSharedKeys: 2, minOverlapRatio: 1 }],
        errors: [{ messageId: 'preferSharedDefaults' }, { messageId: 'preferSharedDefaults' }],
      },
      {
        code: `
        function chooseTarget(includeDrafts: boolean) {
          if (includeDrafts) {
            return { includeDrafts, source: 'all', limit: 20 };
          }
          return { includeDrafts, source: 'published', offset: 0 };
        }
        `,
        options: [{ minSharedKeys: 2, minOverlapRatio: 0.66 }],
        errors: [{ messageId: 'preferSharedDefaults' }, { messageId: 'preferSharedDefaults' }],
      },
    ],
  });
});
