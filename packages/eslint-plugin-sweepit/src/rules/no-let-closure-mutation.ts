import type { Rule } from 'eslint';

function getExecutionBoundary(scope: Rule.Scope.Scope): Rule.Scope.Scope {
  let current: Rule.Scope.Scope | null = scope;
  while (current) {
    if (current.type === 'function' || current.type === 'module' || current.type === 'global') {
      return current;
    }
    current = current.upper;
  }
  return scope;
}

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow reassigning let bindings from nested function/closure scopes',
      url: 'https://github.com/jjenzz/sweepit/tree/main/skills/sweepi/rules/no-let-closure-mutation.md',
    },
    schema: [],
    messages: {
      noLetClosureMutation:
        "Reassigning '{{name}}' from a nested function or closure is not allowed.",
    },
  },
  create(context) {
    const sourceCode = context.sourceCode;

    function checkVariable(variable: Rule.Scope.Variable): void {
      const declarationBoundary = getExecutionBoundary(variable.scope);

      for (const reference of variable.references) {
        if (!reference.isWrite()) continue;
        if (reference.init) continue;
        const referenceBoundary = getExecutionBoundary(reference.from);
        if (referenceBoundary === declarationBoundary) continue;

        context.report({
          node: reference.identifier,
          messageId: 'noLetClosureMutation',
          data: { name: variable.name },
        });
      }
    }

    return {
      VariableDeclaration(node: Rule.Node) {
        const declaration = node as Rule.Node & { kind?: string };
        if (declaration.kind !== 'let') return;

        const variables = sourceCode.getDeclaredVariables(node);
        for (const variable of variables) {
          checkVariable(variable);
        }
      },
    };
  },
};

export default rule;
