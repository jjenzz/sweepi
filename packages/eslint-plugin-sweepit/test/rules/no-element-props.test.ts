import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import rule from '../../src/rules/no-element-props';
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

describe('no-element-props', () => {
  ruleTester.run('no-element-props', rule, {
    valid: [
      // Element-typed props: children allowed
      "import type React from 'react'; interface Props { children: React.ReactNode; }",
      "import type { ReactNode } from 'react'; interface Props { children?: ReactNode; }",
      "import type React from 'react'; type Props = { children: React.ReactNode };",
      "import type { ReactElement } from 'react'; interface Props { children: ReactElement; }",
      "import type React from 'react'; interface Props { children?: React.ReactElement; }",
      "import type { ReactElement } from 'react'; type Props = { children: ReactElement };",
      "import type { ReactNode } from 'react'; interface Props { render: ReactNode; }",
      "import type { ReactElement } from 'react'; interface Props { render: ReactElement; }",
      "import type { ReactElement, ReactNode } from 'react'; interface Props { render?: ReactElement | (() => ReactNode); }",
      // Non-element props
      'interface Props { title: string; count: number; }',
    ],
    invalid: [
      // ReactNode: disallow non-children
      {
        code: "import type React from 'react'; interface Props { header: React.ReactNode; }",
        errors: [
          {
            messageId: 'noElementProps',
            data: { prop: 'header' },
          },
        ],
      },
      {
        code: "import type { ReactNode } from 'react'; interface Props { footer?: ReactNode; }",
        errors: [
          {
            messageId: 'noElementProps',
            data: { prop: 'footer' },
          },
        ],
      },
      {
        code: "import type React from 'react'; type Props = { content: React.ReactNode };",
        errors: [
          {
            messageId: 'noElementProps',
            data: { prop: 'content' },
          },
        ],
      },
      // ReactElement: disallow non-children
      {
        code: "import type { ReactElement } from 'react'; interface Props { header: ReactElement; }",
        errors: [
          {
            messageId: 'noElementProps',
            data: { prop: 'header' },
          },
        ],
      },
      {
        code: "import type React from 'react'; interface Props { footer?: React.ReactElement; }",
        errors: [
          {
            messageId: 'noElementProps',
            data: { prop: 'footer' },
          },
        ],
      },
      {
        code: "import type { ReactElement } from 'react'; type Props = { content: ReactElement };",
        errors: [
          {
            messageId: 'noElementProps',
            data: { prop: 'content' },
          },
        ],
      },
      {
        code: "import type { ReactElement, ReactNode } from 'react'; type Slot = ReactElement; interface Props { header: Slot; render?: ReactElement | (() => ReactNode); }",
        errors: [
          {
            messageId: 'noElementProps',
            data: { prop: 'header' },
          },
        ],
      },
    ],
  });
});
