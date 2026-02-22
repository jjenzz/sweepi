import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import rule from '../../src/rules/max-custom-props';
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

describe('max-custom-props', () => {
  ruleTester.run('max-custom-props', rule, {
    valid: [
      `
        interface ButtonProps {
          tone: 'primary' | 'secondary';
          size: 'sm' | 'md';
          children?: React.ReactNode;
        }
      `,
      `
        type CardProps = {
          title: string;
          subtitle: string;
          description: string;
          icon?: React.ReactNode;
          actions?: React.ReactNode;
          children?: React.ReactNode;
        };
      `,
      `
        interface QueryConfig {
          staleTime: number;
          cacheTime: number;
          retries: number;
          enabled: boolean;
          select: (input: unknown) => unknown;
          onError: (error: Error) => void;
          onSuccess: () => void;
          onSettled: () => void;
          suspense: boolean;
        }
      `,
      {
        code: `
          interface DialogProps {
            title: string;
            description: string;
            open: boolean;
            onOpenChange: (next: boolean) => void;
            children?: React.ReactNode;
          }
        `,
        options: [{ threshold: 4 }],
      },
    ],
    invalid: [
      {
        code: `
          interface DashboardCardProps {
            title: string;
            subtitle: string;
            icon: React.ReactNode;
            tone: 'success' | 'warning' | 'danger';
            value: string;
            trend: 'up' | 'down';
            trendLabel: string;
            ctaLabel: string;
            onCtaClick: () => void;
            children?: React.ReactNode;
          }
        `,
        errors: [
          {
            messageId: 'maxCustomProps',
            data: {
              name: 'DashboardCardProps',
              count: '9',
              threshold: '8',
            },
          },
        ],
      },
      {
        code: `
          type EditorProps = {
            value: string;
            mode: 'markdown' | 'rich';
            placeholder: string;
            maxLength: number;
            disabled: boolean;
            readOnly: boolean;
            error: string | null;
          };
        `,
        options: [{ threshold: 6 }],
        errors: [
          {
            messageId: 'maxCustomProps',
            data: {
              name: 'EditorProps',
              count: '7',
              threshold: '6',
            },
          },
        ],
      },
      {
        code: `
          interface ToolbarProps {
            children?: React.ReactNode;
            left: React.ReactNode;
            center: React.ReactNode;
            right: React.ReactNode;
            onPrimaryAction: () => void;
          }
        `,
        options: [{ threshold: 2, ignore: ['left'] }],
        errors: [
          {
            messageId: 'maxCustomProps',
            data: {
              name: 'ToolbarProps',
              count: '3',
              threshold: '2',
            },
          },
        ],
      },
    ],
  });
});
