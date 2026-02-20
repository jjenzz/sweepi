import type { Rule } from 'eslint';

interface JSXExpressionContainer {
  type: 'JSXExpressionContainer';
  expression?: { type?: string } | null;
}

const rule: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow inline object literals as JSX prop values',
    },
    messages: {
      noObjectProps:
        "Inline object literal passed to prop '{{prop}}'. Move the object to a stable variable/reference.",
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
        if (!expression || expression.type !== 'ObjectExpression') return;

        context.report({
          node: attr.value as unknown as Rule.Node,
          messageId: 'noObjectProps',
          data: { prop: attr.name.name },
        });
      },
    };
  },
};

export default rule;
