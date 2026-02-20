import type { Rule } from 'eslint';

interface JSXExpressionContainer {
  type: 'JSXExpressionContainer';
  expression?: { type?: string } | null;
}

const rule: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow inline array literals as JSX prop values',
    },
    messages: {
      noArrayProps:
        "Inline array literal passed to prop '{{prop}}'. Move the array to a stable variable/reference.",
    },
    schema: [],
  },
  create(context) {
    return {
      JSXAttribute(node: Rule.Node) {
        const attr = node as unknown as {
          name?: { type?: string; name?: string };
          value?: { type?: string } | null;
        };
        if (attr.name?.type !== 'JSXIdentifier' || !attr.name.name) return;
        if (!attr.value || attr.value.type !== 'JSXExpressionContainer') return;

        const expression = (attr.value as JSXExpressionContainer).expression;
        if (!expression || expression.type !== 'ArrayExpression') return;

        context.report({
          node: attr.value as unknown as Rule.Node,
          messageId: 'noArrayProps',
          data: { prop: attr.name.name },
        });
      },
    };
  },
};

export default rule;
