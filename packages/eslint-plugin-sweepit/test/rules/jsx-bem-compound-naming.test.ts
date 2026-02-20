import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import rule from '../../src/rules/jsx-bem-compound-naming';
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

describe('jsx-bem-compound-naming', () => {
  ruleTester.run('jsx-bem-compound-naming', rule, {
    valid: [
      `
        const ButtonGroup = () => null;
        const ButtonGroupItem = () => null;
        const ButtonGroupIcon = () => null;
        <ButtonGroup />;
        <ButtonGroupItem />;
        <ButtonGroupIcon />;
      `,
      `
        import { ButtonGroup } from './button-group';
        const ButtonGroupItem = () => null;
        <ButtonGroupItem />;
      `,
      '<div />',
    ],
    invalid: [
      {
        code: `
          const Group = () => null;
          const Item = () => null;
          const GroupItemIcon = () => null;
          <Item />;
          <GroupItemIcon />;
        `,
        errors: [
          {
            messageId: 'genericPartName',
            data: {
              name: 'Item',
              example: 'ButtonGroupItem',
            },
          },
          {
            messageId: 'missingBlockComponent',
            data: {
              name: 'GroupItemIcon',
              block: 'GroupItem',
            },
          },
        ],
      },
      {
        code: `
          const GroupIcon = () => null;
          <GroupIcon />;
        `,
        errors: [
          {
            messageId: 'missingBlockComponent',
            data: {
              name: 'GroupIcon',
              block: 'Group',
            },
          },
        ],
      },
    ],
  });
});
