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
  ast: Rule.Node;
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

function isNode(value: unknown): value is Rule.Node {
  if (!value || typeof value !== 'object') return false;
  const maybeNode = value as Rule.Node & { type?: unknown };
  return typeof maybeNode.type === 'string';
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

function collectNodesFromArray(entries: unknown[]): Rule.Node[] {
  let nodes: Rule.Node[] = [];
  for (const entry of entries) {
    if (!isNode(entry)) continue;
    nodes = [...nodes, entry];
  }
  return nodes;
}

function collectNodesFromValue(value: unknown): Rule.Node[] {
  if (!value) return [];
  if (value instanceof Array) return collectNodesFromArray(value);
  if (!isNode(value)) return [];
  return [value];
}

function readChildNodes(node: Rule.Node): Rule.Node[] {
  let childNodes: Rule.Node[] = [];
  const entries = node as unknown as Record<string, unknown>;

  for (const key in entries) {
    if (key === 'parent') continue;
    const nextNodes = collectNodesFromValue(entries[key]);
    childNodes = [...childNodes, ...nextNodes];
  }

  return childNodes;
}

function mergeUnique(left: string[], right: string[]): string[] {
  return [...new Set([...left, ...right])];
}

function getHandleNamesFromText(text: string): string[] {
  const matches = text.match(/\bhandle[A-Za-z0-9_$]*\b/g);
  if (!matches) return [];
  return [...new Set(matches)];
}

function getHandleIdentifier(node: Rule.Node | null | undefined): IdentifierNode | null {
  const id = asIdentifier(node);
  if (!id) return null;
  if (!startsWithHandle(id.name)) return null;
  return id;
}

function getFunctionDeclarationCandidate(node: Rule.Node): Candidate[] {
  if (node.type !== 'FunctionDeclaration') return [];
  const declaration = node as Rule.Node & { id?: Rule.Node | null };
  const id = getHandleIdentifier(declaration.id ?? null);
  if (!id) return [];
  return [{ name: id.name, node: id }];
}

function getVariableCandidate(node: Rule.Node): Candidate[] {
  if (node.type !== 'VariableDeclarator') return [];
  const declaration = node as Rule.Node & {
    id?: Rule.Node;
    init?: Rule.Node | null;
  };
  const id = getHandleIdentifier(declaration.id);
  if (!id) return [];
  if (!isFunctionInit(declaration.init ?? null)) return [];
  return [{ name: id.name, node: id }];
}

function extractCandidate(node: Rule.Node): Candidate[] {
  return [...getFunctionDeclarationCandidate(node), ...getVariableCandidate(node)];
}

function collectCandidates(node: Rule.Node): Candidate[] {
  let candidates = extractCandidate(node);
  const childNodes = readChildNodes(node);
  for (const childNode of childNodes) {
    candidates = [...candidates, ...collectCandidates(childNode)];
  }
  return candidates;
}

function getJsxAttribute(
  node: Rule.Node,
): { type: 'JSXAttribute'; name?: unknown; value?: unknown } | null {
  const maybeNode = node as unknown as { type?: string; name?: unknown; value?: unknown };
  if (maybeNode.type !== 'JSXAttribute') return null;
  return maybeNode as { type: 'JSXAttribute'; name?: unknown; value?: unknown };
}

function getOnPropName(attribute: { type: 'JSXAttribute'; name?: unknown }): string | null {
  const nameNode = attribute.name as JsxIdentifierNode | undefined;
  if (!nameNode || nameNode.type !== 'JSXIdentifier') return null;
  const propName: string = nameNode.name;
  if (!isOnJsxPropName(propName)) return null;
  return propName;
}

function getExpressionFromAttribute(attribute: {
  type: 'JSXAttribute';
  value?: unknown;
}): Rule.Node | null {
  const value = attribute.value as
    | { type?: string; expression?: Rule.Node | null }
    | null
    | undefined;
  if (!value || value.type !== 'JSXExpressionContainer') return null;
  const expressionContainer = value as { expression?: unknown };
  if (!isNode(expressionContainer.expression)) return null;
  return expressionContainer.expression ?? null;
}

function getOnPropExpression(node: Rule.Node): Rule.Node | null {
  const attribute = getJsxAttribute(node);
  if (!attribute) return null;
  const onPropName = getOnPropName(attribute);
  if (!onPropName) return null;
  return getExpressionFromAttribute(attribute);
}

function extractOnPropHandleNames(node: Rule.Node, sourceCode: Readonly<SourceCodeLike>): string[] {
  const expression = getOnPropExpression(node);
  if (!expression) return [];
  const expressionText = sourceCode.getText(expression);
  return getHandleNamesFromText(expressionText);
}

function collectOnPropHandleNames(node: Rule.Node, sourceCode: Readonly<SourceCodeLike>): string[] {
  let names = extractOnPropHandleNames(node, sourceCode);
  const childNodes = readChildNodes(node);
  for (const childNode of childNodes) {
    const childNames = collectOnPropHandleNames(childNode, sourceCode);
    names = mergeUnique(names, childNames);
  }
  return names;
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
    const sourceCode = context.sourceCode as unknown as SourceCodeLike;

    return {
      'Program:exit'() {
        const candidates = collectCandidates(sourceCode.ast);
        const onPropNames = collectOnPropHandleNames(sourceCode.ast, sourceCode);

        for (const candidate of candidates) {
          if (onPropNames.includes(candidate.name)) continue;

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
