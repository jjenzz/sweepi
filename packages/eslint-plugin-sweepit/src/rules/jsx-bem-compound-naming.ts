import type { Rule } from 'eslint';

const COMMON_PART_NAMES = new Set([
  'Trigger',
  'Content',
  'Title',
  'Description',
  'Header',
  'Footer',
  'Body',
  'Item',
  'Label',
  'Input',
  'Control',
  'Indicator',
  'Icon',
  'Arrow',
  'Portal',
  'Overlay',
]);

function isPascalCase(name: string): boolean {
  if (name.length === 0) return false;
  const first = name[0];
  return first >= 'A' && first <= 'Z';
}

function getCompoundParts(name: string): { block: string; part: string } | null {
  for (const part of COMMON_PART_NAMES) {
    if (!name.endsWith(part)) continue;
    const block = name.slice(0, name.length - part.length);
    if (!isPascalCase(block)) continue;
    return { block, part };
  }
  return null;
}

const rule: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce BEM-style compound component naming (for example ButtonGroupItem)',
    },
    messages: {
      genericPartName:
        "Component '{{name}}' is too generic. Prefix part names with a compound block (for example '{{example}}').",
      missingBlockComponent:
        "Compound part '{{name}}' requires matching block '{{block}}' in scope to keep naming consistent.",
    },
    schema: [],
  },
  create(context) {
    const knownComponentNames = new Set<string>();

    return {
      FunctionDeclaration(node: Rule.Node) {
        const fn = node as unknown as { id?: Rule.Node | null };
        if (fn.id?.type !== 'Identifier') return;
        const id = fn.id as unknown as { name: string };
        if (!isPascalCase(id.name)) return;
        knownComponentNames.add(id.name);
      },
      VariableDeclarator(node: Rule.Node) {
        const declaration = node as unknown as { id?: Rule.Node; init?: Rule.Node | null };
        if (declaration.id?.type !== 'Identifier') return;
        if (
          declaration.init?.type !== 'ArrowFunctionExpression' &&
          declaration.init?.type !== 'FunctionExpression'
        ) {
          return;
        }
        const id = declaration.id as unknown as { name: string };
        if (!isPascalCase(id.name)) return;
        knownComponentNames.add(id.name);
      },
      ImportDeclaration(node: Rule.Node) {
        const declaration = node as unknown as { specifiers?: Rule.Node[] };
        for (const specifier of declaration.specifiers ?? []) {
          if (specifier.type !== 'ImportSpecifier' && specifier.type !== 'ImportDefaultSpecifier') {
            continue;
          }
          const importSpecifier = specifier as unknown as { local?: Rule.Node };
          if (importSpecifier.local?.type !== 'Identifier') continue;
          const local = importSpecifier.local as unknown as { name: string };
          if (!isPascalCase(local.name)) continue;
          knownComponentNames.add(local.name);
        }
      },
      JSXOpeningElement(node: Rule.Node) {
        const opening = node as unknown as {
          name: Rule.Node;
        };
        const nameNode = opening.name;
        const typedNameNode = nameNode as unknown as { type?: string; name?: string };
        if (typedNameNode.type !== 'JSXIdentifier' || !typedNameNode.name) return;

        const name = typedNameNode.name;
        if (!isPascalCase(name)) return;

        if (COMMON_PART_NAMES.has(name)) {
          context.report({
            node: nameNode,
            messageId: 'genericPartName',
            data: {
              name,
              example: `ButtonGroup${name}`,
            },
          });
          return;
        }

        const parts = getCompoundParts(name);
        if (!parts) return;
        if (knownComponentNames.has(parts.block)) return;

        context.report({
          node: nameNode,
          messageId: 'missingBlockComponent',
          data: {
            name,
            block: parts.block,
          },
        });
      },
    };
  },
};

export default rule;
