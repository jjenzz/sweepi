import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import rule from '../../src/rules/no-prefixed-prop-bundles';
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

describe('no-prefixed-prop-bundles', () => {
  ruleTester.run('no-prefixed-prop-bundles', rule, {
    valid: [
      `
        interface UserCardProps {
          name: string;
          email: string;
        }
      `,
      `
        type UserCardProps = {
          userName: string;
          userEmail: string;
        };
      `,
      `
        interface DialogProps {
          onOpen: () => void;
          onClose: () => void;
          onChange: () => void;
        }
      `,
      `
        type DataProps = {
          dataState: string;
          dataMode: string;
          dataKind: string;
        };
      `,
      `
        interface QueryShape {
          userName: string;
          userEmail: string;
          userAvatarUrl: string;
        }
      `,
      {
        code: `
          interface UserCardProps {
            userName: string;
            userEmail: string;
          }
        `,
        options: [{ threshold: 4 }],
      },
    ],
    invalid: [
      {
        code: `
          interface UserCardProps {
            userName: string;
            userEmail: string;
            userAvatarUrl: string;
          }
        `,
        errors: [
          {
            messageId: 'noPrefixedPropBundle',
            data: { prop: 'userName', prefix: 'user', count: '3' },
          },
          {
            messageId: 'noPrefixedPropBundle',
            data: { prop: 'userEmail', prefix: 'user', count: '3' },
          },
          {
            messageId: 'noPrefixedPropBundle',
            data: { prop: 'userAvatarUrl', prefix: 'user', count: '3' },
          },
        ],
      },
      {
        code: `
          type CardProps = {
            orderId: string;
            orderStatus: string;
            orderTotal: number;
          };
        `,
        errors: [
          {
            messageId: 'noPrefixedPropBundle',
            data: { prop: 'orderId', prefix: 'order', count: '3' },
          },
          {
            messageId: 'noPrefixedPropBundle',
            data: { prop: 'orderStatus', prefix: 'order', count: '3' },
          },
          {
            messageId: 'noPrefixedPropBundle',
            data: { prop: 'orderTotal', prefix: 'order', count: '3' },
          },
        ],
      },
      {
        code: `
          interface UserCardProps {
            userName: string;
            userEmail: string;
          }
        `,
        options: [{ threshold: 2 }],
        errors: [
          {
            messageId: 'noPrefixedPropBundle',
            data: { prop: 'userName', prefix: 'user', count: '2' },
          },
          {
            messageId: 'noPrefixedPropBundle',
            data: { prop: 'userEmail', prefix: 'user', count: '2' },
          },
        ],
      },
      {
        code: `
          type CardProps = {
            className: string;
            classHeader: string;
            classBody: string;
          };
        `,
        errors: [
          {
            messageId: 'noPrefixedPropBundle',
            data: { prop: 'className', prefix: 'class', count: '3' },
          },
          {
            messageId: 'noPrefixedPropBundle',
            data: { prop: 'classHeader', prefix: 'class', count: '3' },
          },
          {
            messageId: 'noPrefixedPropBundle',
            data: { prop: 'classBody', prefix: 'class', count: '3' },
          },
        ],
      },
    ],
  });
});
