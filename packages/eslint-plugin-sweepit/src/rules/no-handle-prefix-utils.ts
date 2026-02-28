import type { Rule } from 'eslint';

const HANDLE_PREFIX = 'handle';

type IdentifierNode = Rule.Node & {
  type: 'Identifier';
  name: string;
};

interface Candidate {
  name: string;
  node: Rule.Node;
}

interface SourceCodeLike {
  getText: (node: Rule.Node) => string;
}

type JsxIdentifierNode = {
  type: 'JSXIdentifier';
  name: string;
};

function startsWithHandle(name: string): boolean {
  return name.startsWith(HANDLE_PREFIX) && name.length > HANDLE_PREFIX.length;
}

function isOnJsxPropName(name: string): boolean {
  if (!name.startsWith('on') || name.length <= 2) return false;
  const third = name[2];
  return third >= 'A' && third <= 'Z';
}

function asIdentifier(node: Rule.Node | null | undefined): IdentifierNode | null {
  if (!node || node.type !== 'Identifier') return null;
  const identifier = node as Rule.Node & { name?: unknown };
  if (typeof identifier.name !== 'string') return null;
  return identifier as IdentifierNode;
}

function isFunctionInit(node: Rule.Node | null | undefined): boolean {
  if (!node) return false;
  return node.type === 'ArrowFunctionExpression' || node.type === 'FunctionExpression';
}

function getHandleNamesFromText(text: string): string[] {
  const matches = text.match(/\bhandle[A-Za-z0-9_$]*\b/g);
  if (!matches) return [];
  return [...new Set(matches)];
}

function mergeUnique(left: string[], right: string[]): string[] {
  return [...new Set([...left, ...right])];
}

function getHandleIdentifier(node: Rule.Node | null | undefined): IdentifierNode | null {
  const id = asIdentifier(node);
  if (!id) return null;
  if (!startsWithHandle(id.name)) return null;
  return id;
}

function getFunctionDeclarationCandidate(node: Rule.Node): Candidate | null {
  if (node.type !== 'FunctionDeclaration') return null;
  const declaration = node as Rule.Node & { id?: Rule.Node | null };
  const id = getHandleIdentifier(declaration.id ?? null);
  if (!id) return null;

  return {
    name: id.name,
    node: id,
  };
}

function getVariableCandidate(node: Rule.Node): Candidate | null {
  if (node.type !== 'VariableDeclarator') return null;
  const declaration = node as Rule.Node & {
    id?: Rule.Node;
    init?: Rule.Node | null;
  };
  const id = getHandleIdentifier(declaration.id);
  if (!id || !isFunctionInit(declaration.init ?? null)) return null;

  return {
    name: id.name,
    node: id,
  };
}

function getOnPropName(attribute: Rule.Node & { name?: unknown }): string | null {
  const nameNode = attribute.name as JsxIdentifierNode | undefined;
  if (!nameNode || nameNode.type !== 'JSXIdentifier') return null;
  const propName: string = nameNode.name;
  if (!isOnJsxPropName(propName)) return null;
  return propName;
}

function getExpressionFromAttribute(attribute: Rule.Node & { value?: unknown }): Rule.Node | null {
  const value = attribute.value as
    | { type?: string; expression?: Rule.Node | null }
    | null
    | undefined;
  if (!value || value.type !== 'JSXExpressionContainer') return null;
  return value.expression ?? null;
}

function getUsedHandleNamesFromAttribute(
  attribute: Rule.Node & { name?: unknown; value?: unknown },
  sourceCode: Readonly<SourceCodeLike>,
): string[] {
  const onPropName = getOnPropName(attribute);
  if (!onPropName) return [];

  const expression = getExpressionFromAttribute(attribute);
  if (!expression) return [];

  return getHandleNamesFromText(sourceCode.getText(expression));
}

const rule: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Forbid util/helper functions prefixed with handle* unless they are used as JSX on* handlers',
      url: 'https://github.com/jjenzz/sweepit/tree/main/skills/sweepi/rules/no-handle-prefix-utils.md',
    },
    messages: {
      noHandlePrefixUtil:
        "Util/helper function '{{name}}' should not use handle*. Reserve handle* for functions used in JSX on* props.",
    },
    schema: [],
  },
  create(context) {
    const reportContext: Readonly<Rule.RuleContext> = context;
    const sourceCode = context.sourceCode as unknown as Readonly<SourceCodeLike>;
    let candidates: Candidate[] = [];
    let usedNames: string[] = [];

    return {
      FunctionDeclaration(node: Rule.Node) {
        const candidate = getFunctionDeclarationCandidate(node);
        if (!candidate) return;
        candidates = [...candidates, candidate];
      },
      VariableDeclarator(node: Rule.Node) {
        const candidate = getVariableCandidate(node);
        if (!candidate) return;
        candidates = [...candidates, candidate];
      },
      JSXAttribute(node: Rule.Node) {
        const attribute = node as Rule.Node & { name?: unknown; value?: unknown };
        const namesFromAttribute = getUsedHandleNamesFromAttribute(attribute, sourceCode);
        usedNames = mergeUnique(usedNames, namesFromAttribute);
      },
      'Program:exit'() {
        for (const candidate of candidates) {
          if (usedNames.includes(candidate.name)) continue;

          reportContext.report({
            node: candidate.node,
            messageId: 'noHandlePrefixUtil',
            data: { name: candidate.name },
          });
        }
      },
    };
  },
};

export default rule;
