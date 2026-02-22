import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import rule from '../../src/rules/no-useless-hook';
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

describe('no-useless-hook', () => {
  ruleTester.run('no-useless-hook', rule, {
    valid: [
      "import { useState } from 'react'; function useCount() { const [c, setC] = useState(0); return c; }",
      "import { useEffect } from 'react'; function useFetch() { useEffect(() => {}, []); return null; }",
      "import { useRef } from 'react'; function useRefValue() { const r = useRef(0); return r; }",
      "import { useContext } from 'react'; function useCtx() { return useContext(X); }",
      "import { useReducer } from 'react'; function useR() { const [s, d] = useReducer(f, 0); return s; }",
      "import { useLayoutEffect } from 'react'; function useLayout() { useLayoutEffect(() => {}, []); }",
      "import { useId } from 'react'; function useStableId() { return useId(); }",
      "import { useTransition } from 'react'; function useNav() { const [p, s] = useTransition(); return p; }",
      "import { useDeferredValue } from 'react'; function useDeferred(v: string) { return useDeferredValue(v); }",
      "import { useSyncExternalStore } from 'react'; function useStore() { return useSyncExternalStore(s, g); }",
      "import { useImperativeHandle } from 'react'; function useHandle(ref: any) { useImperativeHandle(ref, () => ({})); }",
      'function formatDate(d: Date) { return d.toISOString(); }',
      "const getUser = () => fetch('/user');",
      // Calling a custom hook makes this a legitimate hook
      'function useAuth() { return useUserContext(); }',
      'const useTheme = () => useThemeContext();',
      'function useData() { return React.useCustomHook(); }',
    ],
    invalid: [
      {
        code: 'function useUser() { return fetchUser(); }',
        errors: [
          {
            messageId: 'noUselessHook',
            data: { name: 'useUser' },
          },
        ],
      },
      {
        code: 'const useFormatDate = (d: Date) => d.toISOString();',
        errors: [
          {
            messageId: 'noUselessHook',
            data: { name: 'useFormatDate' },
          },
        ],
      },
      {
        code: "function useConfig() { return { theme: 'dark' }; }",
        errors: [
          {
            messageId: 'noUselessHook',
            data: { name: 'useConfig' },
          },
        ],
      },
      {
        code: 'const useData = function () { return 42; };',
        errors: [
          {
            messageId: 'noUselessHook',
            data: { name: 'useData' },
          },
        ],
      },
    ],
  });
});
