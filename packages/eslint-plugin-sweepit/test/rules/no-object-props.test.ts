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
      projectService: {
        allowDefaultProject: ['estree.tsx'],
      },
      tsconfigRootDir: process.cwd(),
    },
  },
});

describe('no-object-props', () => {
  ruleTester.run('no-object-props', rule, {
    valid: [
      '<Comp tone="info" />',
      '<Comp onValueChange={onValueChange} />',
      '<Comp count={totalCount} />',
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
      {
        code: 'type CardStyle = { color: string }; const style: CardStyle = { color: "red" }; <Comp style={style} />',
        errors: [
          {
            messageId: 'noObjectProps',
            data: { prop: 'style' },
          },
        ],
      },
      {
        code: 'interface UserRow { id: string; email: string; } const user: UserRow = { id: "1", email: "a@example.com" }; <Comp user={user} />',
        errors: [
          {
            messageId: 'noObjectProps',
            data: { prop: 'user' },
          },
        ],
      },
      {
        code: 'function getConfig(): { dense: boolean } { return { dense: true }; } <Comp config={getConfig()} />',
        errors: [
          {
            messageId: 'noObjectProps',
            data: { prop: 'config' },
          },
        ],
      },
    ],
  });
});
