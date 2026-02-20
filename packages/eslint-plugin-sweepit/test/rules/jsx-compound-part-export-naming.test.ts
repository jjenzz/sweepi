import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import rule from '../../src/rules/jsx-compound-part-export-naming';
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

describe('jsx-compound-part-export-naming', () => {
  ruleTester.run('jsx-compound-part-export-naming', rule, {
    valid: [
      `
        const Dialog = () => null;
        const DialogTrigger = () => null;
        export { Dialog as Root, DialogTrigger as Trigger };
      `,
      `
        const Tooltip = () => null;
        const TooltipContent = () => null;
        export { Tooltip as Root, TooltipContent as Content };
      `,
      `
        const Dialog = () => null;
        export { Dialog };
      `,
      `
        export const Theme = { light: '#fff', dark: '#000' };
      `,
      `
        const Button = () => null;
        export { Button };
      `,
    ],
    invalid: [
      {
        code: `
          const Dialog = () => null;
          const DialogTrigger = () => null;
          export { Dialog as Root, DialogTrigger };
        `,
        errors: [
          {
            messageId: 'requirePartAlias',
            data: {
              local: 'DialogTrigger',
              part: 'Trigger',
            },
          },
        ],
      },
      {
        code: `
          const Dialog = () => null;
          export function DialogTrigger() {
            return null;
          }
          export { Dialog as Root };
        `,
        errors: [
          {
            messageId: 'requirePartAlias',
            data: {
              local: 'DialogTrigger',
              part: 'Trigger',
            },
          },
        ],
      },
      {
        code: `
          const Dialog = () => null;
          export const DialogTrigger = () => null;
          export { Dialog as Root };
        `,
        errors: [
          {
            messageId: 'requirePartAlias',
            data: {
              local: 'DialogTrigger',
              part: 'Trigger',
            },
          },
        ],
      },
      {
        code: `
          const Tooltip = () => null;
          const TooltipContent = () => null;
          export { Tooltip as Root };
          export { TooltipContent as TooltipContent };
        `,
        errors: [
          {
            messageId: 'requirePartAlias',
            data: {
              local: 'TooltipContent',
              part: 'Content',
            },
          },
        ],
      },
      {
        code: `
          const DialogTrigger = () => null;
          export const Dialog = { Trigger: DialogTrigger };
        `,
        errors: [
          {
            messageId: 'noRuntimeObjectExport',
            data: {
              name: 'Dialog',
            },
          },
        ],
      },
      {
        code: `
          const Dialog = () => null;
          const DialogTrigger = () => null;
          export { DialogTrigger as Trigger };
        `,
        errors: [
          {
            messageId: 'requireRootExport',
            data: {
              block: 'Dialog',
            },
          },
        ],
      },
    ],
  });
});
