import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import rule from '../../src/rules/jsx-flat-owner-tree';
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

describe('jsx-flat-owner-tree', () => {
  ruleTester.run('jsx-flat-owner-tree', rule, {
    valid: [
      `
        function Header() {
          return <div>Header</div>;
        }

        function Page() {
          return (
            <div>
              <Header />
            </div>
          );
        }
      `,
      `
        function Wrapper({ children }: { children: React.ReactNode }) {
          return (
            <section>
              {children}
              <Footer />
            </section>
          );
        }

        function Footer() {
          return <footer>Footer</footer>;
        }
      `,
      `
        function Root() {
          return <Page />;
        }

        function Page() {
          return <div>ok</div>;
        }
      `,
      `
        function Root() {
          return (
            <div>
              <Page />
              <Sidebar />
            </div>
          );
        }

        function Page() {
          return <div>Page</div>;
        }

        function Sidebar() {
          return <div>Sidebar</div>;
        }
      `,
      {
        code: `
          function Root() {
            return <Page />;
          }

          function Page() {
            return <Header />;
          }

          function Header() {
            return <UserArea />;
          }

          function UserArea() {
            return <div>User</div>;
          }
        `,
        options: [{ allowedChainDepth: 4 }],
      },
    ],
    invalid: [
      {
        code: `
          function Root() {
            return <Page />;
          }

          function Page() {
            return <Header />;
          }

          function Header() {
            return <div>Header</div>;
          }
        `,
        options: [{ allowedChainDepth: 1 }],
        errors: [
          {
            messageId: 'deepParentTree',
            data: {
              component: 'Root',
              depth: '3',
            },
          },
          {
            messageId: 'deepParentTree',
            data: {
              component: 'Page',
              depth: '2',
            },
          },
        ],
      },
      {
        code: `
          function Root() {
            return (
              <main>
                <Page />
                <Sidebar />
              </main>
            );
          }

          function Page() {
            return (
              <div>
                <Header />
                <Summary />
              </div>
            );
          }

          function Header() {
            return (
              <div>
                <UserArea />
                <Logo />
              </div>
            );
          }

          function UserArea() {
            return (
              <div>
                <Avatar />
              </div>
            );
          }

          function Avatar() {
            return <img />;
          }

          function Sidebar() {
            return <aside>Sidebar</aside>;
          }

          function Summary() {
            return <div>Summary</div>;
          }

          function Logo() {
            return <div>Logo</div>;
          }
        `,
        errors: [
          {
            messageId: 'deepParentTree',
            data: {
              component: 'Root',
              depth: '5',
            },
          },
          {
            messageId: 'deepParentTree',
            data: {
              component: 'Page',
              depth: '4',
            },
          },
          {
            messageId: 'deepParentTree',
            data: {
              component: 'Header',
              depth: '3',
            },
          },
        ],
      },
      {
        code: `
          function Root() {
            return (
              <main>
                <Page />
                <Sidebar />
              </main>
            );
          }

          function Page() {
            return (
              <div>
                <Header />
                <Summary />
              </div>
            );
          }

          function Header() {
            return (
              <div>
                <UserArea />
                <Logo />
              </div>
            );
          }

          function UserArea() {
            return (
              <div>
                <Avatar />
              </div>
            );
          }

          function Avatar() {
            return <img />;
          }

          function Sidebar() {
            return <aside>Sidebar</aside>;
          }

          function Summary() {
            return <div>Summary</div>;
          }

          function Logo() {
            return <div>Logo</div>;
          }
        `,
        options: [{ allowedChainDepth: 4 }],
        errors: [
          {
            messageId: 'deepParentTree',
            data: {
              component: 'Root',
              depth: '5',
            },
          },
        ],
      },
    ],
  });
});
