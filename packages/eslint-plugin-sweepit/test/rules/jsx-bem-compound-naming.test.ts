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
        export { ButtonGroup, ButtonGroupItem, ButtonGroupIcon };
      `,
      `
        const ButtonGroup = () => null;
        const ButtonGroupItem = () => null;
        export { ButtonGroup as Root, ButtonGroupItem as Item };
      `,
      `
        const Button = () => null;
        const Item = () => null;
        export { Button, Item };
      `,
      {
        filename: '/tmp/index.tsx',
        code: `
          const Group = () => null;
          const Item = () => null;
          export { Group, Item };
        `,
      },
      `
        export { ButtonGroup, ButtonGroupItem } from './button-group';
      `,
    ],
    invalid: [
      {
        code: `
          const ButtonGroup = () => null;
          const Item = () => null;
          const GroupItemIcon = () => null;
          export { ButtonGroup, Item, GroupItemIcon };
        `,
        filename: '/tmp/button-group.tsx',
        errors: [
          {
            messageId: 'exportedPartMustUseBlockPrefix',
            data: {
              name: 'Item',
              block: 'ButtonGroup',
              example: 'ButtonGroupItem',
            },
          },
          {
            messageId: 'exportedPartMustUseBlockPrefix',
            data: {
              name: 'GroupItemIcon',
              block: 'ButtonGroup',
              example: 'ButtonGroupItemIcon',
            },
          },
        ],
      },
      {
        code: `
          const ButtonGroup = () => null;
          const Item = () => null;
          export { ButtonGroup, Item as ButtonGroupItem };
        `,
        filename: '/tmp/button-group.tsx',
        errors: [
          {
            messageId: 'exportedPartMustUseBlockPrefix',
            data: {
              name: 'Item',
              block: 'ButtonGroup',
              example: 'ButtonGroupItem',
            },
          },
        ],
      },
      {
        code: `
          const ButtonGroup = () => null;
          export function Item() { return null; }
          export { ButtonGroup };
        `,
        filename: '/tmp/button-group.tsx',
        errors: [
          {
            messageId: 'exportedPartMustUseBlockPrefix',
            data: {
              name: 'Item',
              block: 'ButtonGroup',
              example: 'ButtonGroupItem',
            },
          },
        ],
      },
    ],
  });
});
