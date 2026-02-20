import type { Rule } from 'eslint';

const MIN_REPORTED_CHAIN_DEPTH = 3;

interface ComponentRecord {
  name: string;
  node: Rule.Node;
  selfClosingCustomChildren: Set<string>;
}

function isPascalCase(name: string): boolean {
  if (name.length === 0) return false;
  const first = name[0];
  return first >= 'A' && first <= 'Z';
}

function getCustomJsxName(node: Rule.Node): string | null {
  if (node.type === 'JSXIdentifier') {
    const name = (node as unknown as { name: string }).name;
    return isPascalCase(name) ? name : null;
  }

  if (node.type === 'JSXMemberExpression') {
    const member = node as unknown as { object: Rule.Node };
    if (member.object.type === 'JSXIdentifier') {
      const object = member.object as unknown as { name: string };
      return isPascalCase(object.name) ? object.name : null;
    }
  }

  return null;
}

function collectSelfClosingCustomJsxNames(
  node: Rule.Node | null | undefined,
  names: Set<string>,
): void {
  if (!node) return;

  if (node.type === 'JSXElement') {
    const element = node as unknown as {
      openingElement: { name: Rule.Node; selfClosing?: boolean };
      children?: Rule.Node[];
    };
    if (element.openingElement.selfClosing) {
      const customName = getCustomJsxName(element.openingElement.name);
      if (customName) names.add(customName);
    }

    for (const child of element.children ?? []) {
      if (child.type !== 'JSXElement' && child.type !== 'JSXFragment') continue;
      collectSelfClosingCustomJsxNames(child, names);
    }
    return;
  }

  if (node.type === 'JSXFragment') {
    const fragment = node as unknown as { children?: Rule.Node[] };
    for (const child of fragment.children ?? []) {
      if (child.type !== 'JSXElement' && child.type !== 'JSXFragment') continue;
      collectSelfClosingCustomJsxNames(child, names);
    }
  }
}

function getSelfClosingCustomChildren(body: Rule.Node | null | undefined): Set<string> {
  const names = new Set<string>();
  if (!body) return names;

  if (body.type === 'JSXElement' || body.type === 'JSXFragment') {
    collectSelfClosingCustomJsxNames(body, names);
  } else if (body.type === 'BlockStatement') {
    const block = body as unknown as { body?: Rule.Node[] };
    for (const statement of block.body ?? []) {
      if (statement.type !== 'ReturnStatement') continue;
      const returnStatement = statement as unknown as { argument?: Rule.Node | null };
      const argument = returnStatement.argument;
      if (!argument) continue;
      if (argument.type !== 'JSXElement' && argument.type !== 'JSXFragment') continue;
      collectSelfClosingCustomJsxNames(argument, names);
    }
  }

  return names;
}

function computeChainDepth(
  componentName: string,
  components: Map<string, ComponentRecord>,
  memo: Map<string, number>,
  visiting: Set<string>,
): number {
  const cached = memo.get(componentName);
  if (cached != null) return cached;

  if (visiting.has(componentName)) {
    return MIN_REPORTED_CHAIN_DEPTH;
  }
  visiting.add(componentName);

  const component = components.get(componentName);
  if (!component) {
    memo.set(componentName, 0);
    visiting.delete(componentName);
    return 0;
  }

  if (component.selfClosingCustomChildren.size === 0) {
    memo.set(componentName, 1);
    visiting.delete(componentName);
    return 1;
  }

  let depth = 1;
  for (const childName of component.selfClosingCustomChildren) {
    if (!components.has(childName)) continue;
    const childDepth = 1 + computeChainDepth(childName, components, memo, visiting);
    if (childDepth > depth) depth = childDepth;
  }
  memo.set(componentName, depth);
  visiting.delete(componentName);
  return depth;
}

const rule: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Encourage flatter parent component chains by reporting 3+ deep self-closing custom component handoffs',
    },
    messages: {
      deepParentTree:
        "Component '{{component}}' is part of a {{depth}}-deep parent-component chain of self-closing custom-component handoffs. Flatten the chain by reducing intermediate relay components.",
    },
    schema: [],
  },
  create(context) {
    const components = new Map<string, ComponentRecord>();

    function registerComponent(
      name: string | null | undefined,
      body: Rule.Node | null | undefined,
      node: Rule.Node,
    ): void {
      if (!name || !isPascalCase(name)) return;
      components.set(name, {
        name,
        node,
        selfClosingCustomChildren: getSelfClosingCustomChildren(body),
      });
    }

    return {
      FunctionDeclaration(node: Rule.Node) {
        const fn = node as unknown as {
          id?: { name?: string } | null;
          params?: Rule.Node[];
          body?: Rule.Node;
        };
        registerComponent(fn.id?.name, fn.body, node);
      },
      VariableDeclarator(node: Rule.Node) {
        const declaration = node as unknown as {
          id?: Rule.Node;
          init?: Rule.Node | null;
        };
        if (declaration.id?.type !== 'Identifier') return;
        if (!declaration.init) return;
        if (
          declaration.init.type !== 'ArrowFunctionExpression' &&
          declaration.init.type !== 'FunctionExpression'
        ) {
          return;
        }

        const id = declaration.id as unknown as { name: string };
        const init = declaration.init as unknown as {
          params?: Rule.Node[];
          body?: Rule.Node;
        };
        registerComponent(id.name, init.body, declaration.id);
      },
      'Program:exit'() {
        const memo = new Map<string, number>();
        for (const component of components.values()) {
          const depth = computeChainDepth(component.name, components, memo, new Set<string>());
          if (depth < MIN_REPORTED_CHAIN_DEPTH) continue;

          context.report({
            node: component.node,
            messageId: 'deepParentTree',
            data: {
              component: component.name,
              depth: String(depth),
            },
          });
        }
      },
    };
  },
};

export default rule;
